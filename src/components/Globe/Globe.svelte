<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import { geoPath, geoOrthographic, type GeoGeometryObjects, geoDistance } from 'd3';
  import { center } from '@turf/center';
  import { bbox } from '@turf/bbox';
  import { Tween } from 'svelte/motion';
  import { drawLabels, drawPath } from './draw';

  // Internal imports
  import worldComplex from './world-50m-simplified-0.4.topo.json';
  import type { FeatureCollection } from 'geojson';
  import type { Mark } from '../App/markers';
  import { expoInOut } from 'svelte/easing';
  import { rad2deg } from './utils';

  const topoObjKey = 'world-50m.geo';

  interface Props {
    background?: string;
    duration?: number;
    shouldRotate?: boolean;
    view: FeatureCollection | undefined; // A GeoJSON feature collection of objects which should be entirely within view.
    marks: Mark[];
    highlights?: string[];
  }

  let {
    background = 'hsl(0, 0%, 98%)',
    duration = 1250,
    shouldRotate = false,
    view,
    marks,
    highlights = []
  }: Props = $props();

  const globe: GeoGeometryObjects = { type: 'Sphere' };
  const projection = geoOrthographic().clipAngle(90).precision(0.6);

  let canvas: HTMLCanvasElement | undefined = $state();
  let context: CanvasRenderingContext2D | undefined | null = $derived(canvas && canvas.getContext('2d'));
  let width: number = $state(0);
  let height: number = $state(0);
  let path: ReturnType<typeof geoPath> | undefined | null = $derived(
    projection && context && geoPath(projection, context)
  );

  // Pre-load fonts
  $effect(() => {
    if (!context) return;
    context.beginPath();
    context.fillStyle = 'rgba(0, 0, 0, 0.0)';
    context.font = '700 18px ABCSans';
    context.fillText('Preloading ABC Sans...', 100, 100);
  });

  // let rotationWhenStarted: [number, number, number] = [0, 0, 0];

  const scaleTween = new Tween(0, { duration, easing: expoInOut });
  const rotationTween = new Tween<[number, number]>([0, 0], { duration, easing: expoInOut });

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
    return { id: country.properties.iso_a2, geojson, opacity: new Tween(0, { duration }) };
  });

  $effect(() => {
    projection.fitSize([width, height], globe);
  }); // TODO: this should maybe not be needed, but it is??

  // Set the clip extent of the projection to avoid drawing elements outside the viewport.
  $effect(() => {
    projection.clipExtent([
      [0, 0],
      [width, height]
    ]);
  });

  // Calculate the new scale and rotation
  $effect(() => {
    if (!view) return;

    // Must know rotation before calculating scale.
    const [lambda, phi] = center(view).geometry.coordinates.map(d => -d);
    const nextProjection = geoOrthographic().rotate([lambda, phi]).fitSize([width, height], view);
    const nextScale = nextProjection.scale();

    // Calculate the maximum angle for current and future scale and rotation so we can filter objects for faster
    // rendering
    if (projection.invert && nextProjection.invert) {
      const currentNW = projection.invert([0, 0]);
      const currentSE = projection.invert([width, height]);
      const nextNW = nextProjection.invert([0, 0]);
      const nextSE = nextProjection.invert([width, height]);
      if (currentNW && currentSE && nextNW && nextSE) {
        const currentAngle = rad2deg(geoDistance(currentNW, currentSE));
        const nextAngle = rad2deg(geoDistance(nextNW, nextSE));

        // Clip the geometries outside the viewable clip angles before projecting
        projection.clipAngle(Math.min(90, Math.max(currentAngle, nextAngle)));
      }
    }
    // Update the tweened values
    scaleTween.set(nextScale);
    rotationTween.set([lambda, phi]);
  });

  $effect(() => {
    console.log('scale, rotate');
    // Set the rotation and scale to the current tweened value
    projection.scale(scaleTween.current);
    projection.rotate(rotationTween.current);
    draw();
  });

  $effect(() => {
    // Update the location tweens for each country
    countries.forEach(country => {
      country.opacity.set(highlights.includes(country.id) ? 1 : 0);
    });

    draw();
  });

  /**
   * Draw a frame to the canvas
   */
  function draw() {
    if (!context || !path) return;

    context.clearRect(0, 0, width, height);

    // Draw the base map
    drawPath(context, path, { fillStyle: OCEAN_COLOUR }, globe);
    drawPath(context, path, { strokeStyle: LAND_STROKE_COLOUR, lineWidth: 1.1, fillStyle: LAND_COLOUR }, land);
    drawPath(context, path, { strokeStyle: LAND_STROKE_COLOUR, lineWidth: 1.1 }, borders);

    countries
      .filter(c => c.opacity.current > 0)
      .forEach(({ id, geojson, opacity }) => {
        drawPath(
          context,
          path,
          { fillStyle: `${HIGHLIGHT_COLOR}${Math.round(opacity.current * 255).toString(16)}` },
          geojson
        );
      });

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

    // Tidy up the world a little
    // Draw a thicker outline around the globe to hide any circle edges
    drawPath(context, path, { strokeStyle: background, lineWidth: 12 }, globe);
    // Draw the nice thin actual outline of the globe
    projection.scale(projection.scale() - 5);
    drawPath(context, path, { strokeStyle: GLOBE_OUTLINE_COLOR, lineWidth: 1.7 }, globe);
    projection.scale(projection.scale() + 5);

    // Draw any labels
    if (marks)
      drawLabels(
        context,
        projection,
        marks.filter(d => d.label)
      );
  }

  // // Scales and Easing
  // const speedScale = scaleLinear().domain([0, 1]).range([0, ROTATION_TOP_SPEED]);
  // speedScale.clamp(true);
  // const easeScale = scaleLinear().domain([0, SPIN_UP_TIME]).range([0, 1]);
  // easeScale.clamp(true);

  // const startSpin = () => {
  //   let t = Date.now() - t0;
  //   if (isTweening || !shouldRotate) return;
  //   const speed = speedScale(easeExpInOut(easeScale(t)));
  //   projection.rotate([rotationWhenStarted[0] + speed * t, rotationWhenStarted[1]]);
  //   draw(t);
  //   requestAnimationFrame(startSpin);
  // };
</script>

<div class="root" bind:clientWidth={width} bind:clientHeight={height}>
  <canvas {width} {height} bind:this={canvas}> </canvas>
</div>

<style lang="scss">
  div.root {
    width: 100%;
    height: 100%;
  }
</style>
