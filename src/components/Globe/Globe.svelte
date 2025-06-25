<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import { geoPath, geoOrthographic, type GeoGeometryObjects, geoDistance } from 'd3';
  import { center } from '@turf/center';
  import { bbox } from '@turf/bbox';
  import { Tween } from 'svelte/motion';
  import { drawPath, drawMark, drawLabel } from './draw';

  // Internal imports
  import worldComplex from './world-50m-simplified-0.4.topo.json';
  import type { FeatureCollection } from 'geojson';
  import type { Mark } from '../App/markers';
  import { expoInOut } from 'svelte/easing';
  import { applyOpacity, rad2deg, splitMultiPolygon } from './utils';

  let prefersRedudcedMotion = $state(document.body.classList.contains('is-reduced-motion'));

  // Observe changes to body class
  const monitorReducedMotionClass: Action = node => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        prefersRedudcedMotion = mutation.target.classList.contains('is-reduced-motion');
      });
    });

    observer.observe(node, { attributeFilter: ['class'] });
  };

  const topoObjKey = 'world-50m.geo';

  import { ALL_LABELS } from '../App/markers';
  import type { Action } from 'svelte/action';
  import { devicePixelRatio } from 'svelte/reactivity/window';
  import { onMount } from 'svelte';

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
    marks = [],
    highlights = []
  }: Props = $props();

  const globe: GeoGeometryObjects = { type: 'Sphere' };
  const projection = geoOrthographic().clipAngle(90).precision(0.6);

  let canvas: HTMLCanvasElement | undefined = $state();
  let context: CanvasRenderingContext2D | undefined | null = $derived(canvas && canvas.getContext('2d'));
  let clientWidth: number = $state(0);
  let clientHeight: number = $state(0);
  let path: ReturnType<typeof geoPath> | undefined | null = $derived(
    projection && context && geoPath(projection, context)
  );

  let width = $derived(clientWidth * (devicePixelRatio.current || 1));
  let height = $derived(clientHeight * (devicePixelRatio.current || 1));

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
  const LAND_COLOUR = '#5A5A5A';
  const LAND_STROKE_COLOUR = '#ACACAC';
  const GLOBE_OUTLINE_COLOR = '#CCCCCC';
  const HIGHLIGHT_COLOR = '#C3C3C3';
  const HIGHLIGHT_STROKE_COLOR = '#646464';
  const ROTATION_TOP_SPEED: number = 0.025;
  const SPIN_UP_TIME = 3000;

  // Merge all the geometries into a single 'land' geometry
  let land = topojson.merge(worldComplex, worldComplex.objects[topoObjKey].geometries);

  // Get a MultiLineString that contains only internal boundaries.
  let borders = topojson.mesh(worldComplex, worldComplex.objects[topoObjKey], (a, b) => a !== b);

  // Get all the countries
  const countries = worldComplex.objects[topoObjKey].geometries.map(country => {
    const geojson = topojson.feature(worldComplex, country);

    geojson.bbox = bbox(geojson);
    return { id: country.properties.iso_a2, geojson, opacity: new Tween(0, { duration: duration, easing: expoInOut }) };
  });

  const palestine = countries.find(country => country.geojson.properties.iso_a2 === 'PS');
  if (palestine) {
    splitMultiPolygon(palestine.geojson).forEach((region, idx) =>
      countries.push({
        id: `${region.properties?.iso_a2}_${idx}`,
        geojson: region,
        opacity: new Tween(0, { duration, easing: expoInOut })
      })
    );
  }

  const labels = Object.values(ALL_LABELS).map(label => {
    return { label, opacity: new Tween(0, { duration, easing: expoInOut }) };
  });

  onMount(() => {
    projection.fitSize([width, height], globe);
    scaleTween.target = projection.scale();
  });

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
    scaleTween.target = nextScale;
    rotationTween.target = [lambda, phi];
  });

  $effect(() => {
    countries.forEach(({ id, opacity }) => {
      opacity.target = highlights.includes(id) ? 1 : 0;
    });
  });

  $effect(() => {
    labels.forEach(label => {
      label.opacity.target = marks.includes(label.label) ? 1 : 0;
    });
  });

  // Draw
  $effect(() => {
    if (!context || !path) return;

    // Update the projection with current scale and rotation values
    projection.scale(prefersRedudcedMotion ? scaleTween.target : scaleTween.current);
    projection.rotate(prefersRedudcedMotion ? rotationTween.target : rotationTween.current);

    // TODO: cross fade in low motion mode
    const dataURL = canvas?.toDataURL();

    context.clearRect(0, 0, width, height);

    // Draw the base map
    drawPath(context, path, { fillStyle: OCEAN_COLOUR }, globe);
    drawPath(context, path, { strokeStyle: LAND_STROKE_COLOUR, lineWidth: 2.1, fillStyle: LAND_COLOUR }, land);
    drawPath(context, path, { strokeStyle: LAND_STROKE_COLOUR, lineWidth: 2.1 }, borders);

    countries
      .filter(({ opacity }) => opacity.current > 0)
      .forEach(({ geojson, opacity }) => {
        const fillStyle = applyOpacity(HIGHLIGHT_COLOR, prefersRedudcedMotion ? opacity.target : opacity.current);
        const strokeStyle = applyOpacity(
          HIGHLIGHT_STROKE_COLOR,
          prefersRedudcedMotion ? opacity.target : opacity.current
        );
        drawPath(context, path, { fillStyle, strokeStyle, lineWidth: 2.1 }, geojson);
      });

    // Tidy up the world a little
    // Draw a thicker outline around the globe to hide any circle edges
    drawPath(context, path, { strokeStyle: background, lineWidth: 12 }, globe);
    // Draw the nice thin actual outline of the globe
    projection.scale(projection.scale() - 5);
    drawPath(context, path, { strokeStyle: GLOBE_OUTLINE_COLOR, lineWidth: 1.7 }, globe);
    projection.scale(projection.scale() + 5);

    // Draw marks
    labels.forEach(({ label, opacity }) => {
      const position = projection(label.center);
      if (context && position) {
        drawMark(
          context,
          position,
          label.markVariant,
          prefersRedudcedMotion ? opacity.target : opacity.current,
          devicePixelRatio.current
        );
        drawLabel(
          context,
          projection,
          label,
          prefersRedudcedMotion ? opacity.target : opacity.current,
          devicePixelRatio.current
        );
      }
    });
  });
</script>

<svelte:body use:monitorReducedMotionClass />
<div class="root" bind:clientWidth bind:clientHeight>
  <canvas {width} {height} bind:this={canvas}> </canvas>
</div>

<style lang="scss">
  div.root {
    width: 100%;
    height: 100%;
  }
  canvas {
    width: 100%;
    height: 100%;
  }
</style>
