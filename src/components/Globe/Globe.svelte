<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import { geoPath, geoOrthographic, scaleLinear, type GeoGeometryObjects, easeExpInOut, geoDistance } from 'd3';
  import { center } from '@turf/center';
  import { bbox } from '@turf/bbox';
  import { envelope } from '@turf/envelope';
  import { bboxPolygon } from '@turf/bbox-polygon';
  import { point, featureCollection } from '@turf/helpers';
  import { intersect } from '@turf/intersect';
  import { tweened } from 'svelte/motion';
  import { drawLabels } from './draw';
  import { createTween } from './tween';

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
  export let highlights: string[] = [];

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
  const rotationTween = tweened<Position>([0, 0], { duration, easing: easeExpInOut });

  const OCEAN_COLOUR = '#173543';
  const LAND_COLOUR = '#333639';
  const LAND_STROKE_COLOUR = '#585858';
  const GLOBE_OUTLINE_COLOR = '#CCCCCC';
  const HIGHLIGHT_COLOR = '#C3C3C3';
  const ROTATION_TOP_SPEED: number = 0.025;
  const SPIN_UP_TIME = 3000;

  // Merge all the geometries into a single 'land' geometry
  let land = topojson.merge(worldComplex, worldComplex.objects[topoObjKey].geometries);
  const allLand = land;

  // Get a MultiLineString that contains only internal boundaries.
  let borders = topojson.mesh(worldComplex, worldComplex.objects[topoObjKey], (a, b) => a !== b);
  const allBorders = borders;

  // Get all the countries
  const countries = worldComplex.objects[topoObjKey].geometries.map(country => {
    const geojson = topojson.feature(worldComplex, country);
    geojson.bbox = bbox(geojson);
    return { id: country.properties.iso_a2, geojson, opacity: createTween(0, duration) };
  });

  const countriesMap = new Map(
    countries.map(country => {
      return [country.id, country];
    })
  );

  $: countries.forEach(country => {
    country.opacity.target = highlights.includes(country.id) ? 1 : 0;
  });

  $: projection.fitSize([width, height], globe); // TODO: this should maybe not be needed, but it is??
  const rad2deg = (deg: number) => (deg * 180) / Math.PI;
  const updateView = (view: FeatureCollection) => {
    // Calculate the new scale and rotation

    // Must know rotation before calculating scale.
    const [lambda, phi] = center(view).geometry.coordinates.map(d => -d);
    const nextProjection = geoOrthographic().rotate([lambda, phi]).fitSize([width, height], view);
    const nextScale = nextProjection.scale();

    // TODO: Calculate the maximum angle for current and future scale and rotation

    const currentAngle = rad2deg(geoDistance(projection.invert?.([0, 0]), projection.invert?.([width, height])));
    const nextAngle = rad2deg(geoDistance(nextProjection.invert?.([0, 0]), nextProjection.invert?.([width, height])));

    projection.clipAngle(Math.min(90, Math.max(currentAngle, nextAngle)));

    // Update the tweened values
    $scaleTween = nextScale;
    $rotationTween = [lambda, phi];
  };

  $: projection.clipExtent([
    [0, 0],
    [width, height]
  ]);

  $: view && updateView(view);

  $: {
    projection.scale($scaleTween);
    projection.rotate([$rotationTween[0], $rotationTween[1]]);

    draw(1);
    // if (context && path) {
    //   context.beginPath();
    //   context.strokeStyle = 'red';
    //   path(view);
    //   context.stroke();
    // }
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

    countries
      .filter(c => c.opacity.value > 0)
      .forEach(({ geojson, opacity }) => {
        if (context && geojson) {
          context.beginPath();
          context.fillStyle = `${HIGHLIGHT_COLOR}${Math.round(opacity.value * 255).toString(16)}`;
          path(geojson);
          context.fill();
        }
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
