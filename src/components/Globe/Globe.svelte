<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import { geoPath, geoCircle, geoOrthographic, scaleLinear, type GeoGeometryObjects, easeExpInOut } from 'd3';
  import { center } from '@turf/center';
  import { tweened } from 'svelte/motion';
  import { drawLabels } from './draw';

  // Internal imports
  import worldComplex from './world-50m-simplified-0.4.topo.json';
  import type { FeatureCollection, Position } from 'geojson';
  import type { Mark } from '../App/markers';

  const topoObjKey = 'world-50m.geo';

  export let background = 'hsl(0, 0%, 98%)';
  export let duration = 1250;
  export let shouldRotate = false;
  export let view: FeatureCollection;
  export let marks: Mark[];
  export let highlights: string[];

  let t0 = Date.now();
  let rootEl: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let width: number = 0;
  let height: number = 0;
  let context: CanvasRenderingContext2D | null;
  let path: ReturnType<typeof geoPath>;
  let isDrawing = false;

  let countriesToHighlight: string[] = [];

  let countriesToAnimateInArray: string[] = [];
  let countriesToAnimateOut: string[] = [];
  let prevHighlightedCountries: string[] = [];
  let prevHighlightedCountryCodes: string[] = [];

  let rotationWhenStarted: [number, number, number] = [0, 0, 0];

  let isTweening = false;

  const globe: GeoGeometryObjects = { type: 'Sphere' };

  const projection = geoOrthographic().clipAngle(90).precision(0.6);

  const scaleTween = tweened(0, { duration, easing: easeExpInOut });
  const fadeTween = tweened(0, { duration });
  const rotationTween = tweened<Position>([0, 0], { duration, easing: easeExpInOut });

  const OCEAN_COLOUR = '#173543';
  const LAND_COLOUR = '#333639';
  const LAND_STROKE_COLOUR = '#585858';
  const GLOBE_OUTLINE_COLOR = '#CCCCCC';
  const HIGHLIGHT_COLOR = '#C3C3C3';
  const ROTATION_TOP_SPEED: number = 0.025;
  const SPIN_UP_TIME = 3000;

  // Merge all the geometries into a single 'land' geometry
  const land = topojson.merge(worldComplex, worldComplex.objects[topoObjKey].geometries);

  // Get a MultiLineString that contains only internal boundaries.
  const borders = topojson.mesh(worldComplex, worldComplex.objects[topoObjKey], (a, b) => a !== b);

  // Get all the countries
  const countries = new Map(
    worldComplex.objects[topoObjKey].geometries.map(country => {
      return [country.properties.iso_a2, topojson.feature(worldComplex, country)];
    })
  );

  // $: {
  //   const prev = countriesToHighlight;
  //   const next = highlights;
  // }

  $: projection.fitSize([width, height], globe); // TODO: this should maybe not be needed, but it is??

  const updateView = (view: FeatureCollection) => {
    // Calculate the new scale and rotation
    const proj = geoOrthographic().clipAngle(90).precision(0.6).fitSize([width, height], view);
    const focus = center(view);

    // Update the tweened values
    $scaleTween = proj.scale();
    $rotationTween = focus.geometry.coordinates;
  };

  $: view && updateView(view);

  $: {
    projection.scale($scaleTween);
    projection.rotate([-$rotationTween[0], -$rotationTween[1]]);
    draw(1);
    if (context && path) {
      context.beginPath();
      context.strokeStyle = 'red';
      path(view);
      context.stroke();
    }
  }

  /**
   * Draw a frame to the canvas
   */
  function draw(t: number) {
    if (isDrawing || !context || !path) return;
    isDrawing = true;

    context.clearRect(0, 0, width, height);

    // Draw the oceans
    context.beginPath();
    context.fillStyle = OCEAN_COLOUR;
    path(globe);
    context.fill();

    // Draw the land and borders
    context.beginPath();
    context.strokeStyle = LAND_STROKE_COLOUR;
    context.lineWidth = 1.1;
    context.fillStyle = LAND_COLOUR;
    path(land);

    context.fill();
    context.stroke();

    highlights?.forEach(code => {
      const country = countries.get(code);
      if (context && country) {
        context.beginPath();
        context.fillStyle = HIGHLIGHT_COLOR;
        path(country);
        context.fill();
      }
    });

    // Highlight a country
    countriesToHighlight.forEach((country: any) => {
      if (!context) return;
      context.beginPath();
      context.fillStyle = countriesToAnimateInArray.includes(country.properties?.code)
        ? `hsla(220, 100%, 27%, ${easeExpInOut(t)})`
        : HIGHLIGHT_COLOR;
      path(country);
      context.fill();
    });

    countriesToAnimateOut.forEach((country: any) => {
      if (!context) return;
      context.beginPath();
      context.fillStyle = `hsl(220, 100%, 27%, ${1.0 - easeExpInOut(t)})`;
      path(country);
      context.fill();
    });

    // Draw country outlines
    context.beginPath();
    context.strokeStyle = LAND_STROKE_COLOUR;
    context.lineWidth = 1.1;
    path(borders);
    context.stroke();

    // Draw marks
    marks?.forEach(mark => {
      if (mark.markVariant === 'none') return;
      const position = projection(mark.center);
      if (context && position) {
        const [x, y] = position;
        // Draw dot

        context.beginPath();
        context.fillStyle = '#AF3838';
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    });

    // Draw a thicker outline around the globe to hide any circle edges
    context.beginPath();
    context.strokeStyle = background;
    context.lineWidth = 12;
    path(globe);
    context.stroke();

    // Draw the nice thin actual outline of the globe
    context.beginPath();
    context.strokeStyle = GLOBE_OUTLINE_COLOR;
    context.lineWidth = 1.7;
    projection.scale(projection.scale() - 5);
    path(globe);
    context.stroke();
    projection.scale(projection.scale() + 5);

    // Draw any labels
    if (marks)
      drawLabels(
        context,
        projection,
        marks.filter(d => d.label)
      );
    isDrawing = false;
  }

  // Scales and Easing
  const speedScale = scaleLinear().domain([0, 1]).range([0, ROTATION_TOP_SPEED]);
  speedScale.clamp(true);
  const easeScale = scaleLinear().domain([0, SPIN_UP_TIME]).range([0, 1]);
  easeScale.clamp(true);

  const startSpin = () => {
    let t = Date.now() - t0;
    if (isTweening || !shouldRotate) return;
    const speed = speedScale(easeExpInOut(easeScale(t)));
    projection.rotate([rotationWhenStarted[0] + speed * t, rotationWhenStarted[1]]);
    draw(t);
    requestAnimationFrame(startSpin);
  };

  $: if (canvas) {
    context = canvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.fillStyle = 'rgba(0, 0, 0, 0.0)';
      context.font = '700 18px ABCSans';
      context.fillText('Preloading ABC Sans...', 100, 100);
      path = geoPath(projection, context);
    }
  }
</script>

<div class="root" bind:this={rootEl} bind:clientWidth={width} bind:clientHeight={height}>
  <canvas {width} {height} bind:this={canvas}> </canvas>
</div>

<style lang="scss">
  div.root {
    width: 100%;
    height: 100%;
  }
</style>
