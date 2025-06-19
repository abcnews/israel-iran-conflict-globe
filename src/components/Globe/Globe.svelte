<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import {
    geoPath,
    geoOrthographic,
    easeExpIn,
    interpolate,
    select,
    scaleLinear,
    easeSinOut,
    type GeoGeometryObjects
  } from 'd3';
  import canvasDpiScaler from 'canvas-dpi-scaler';
  import { onMount } from 'svelte';

  // Internal imports
  import worldComplex from './world-stripped.json';

  export let background = 'hsl(0, 0%, 98%)';
  export let zoom = 100;
  export let duration = 1250;
  export let focus: [number, number] = [0, 0];
  export let year = 0;
  export let shouldRotate = false;

  let t0 = Date.now();

  let globalTime: number;
  let innerWidth: number;
  let innerHeight: number;
  let isInitialised = false;
  let rootEl: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let context: CanvasRenderingContext2D | null;
  let path: ReturnType<typeof geoPath>;
  let isDrawing = false;
  let countriesToHighlight: any = [];

  let countriesToAnimateInArray: any = [];
  let countriesToAnimateOut: any = [];
  let prevHighlightedCountries: any = [];
  let prevHighlightedCountryCodes: any = [];

  let rotationWhenStarted: [number, number, number] = [0, 0, 0];

  let isTweening = false;

  const globe: GeoGeometryObjects = { type: 'Sphere' };

  const fadeEase = easeExpIn;

  const margin = 20;

  const projection = geoOrthographic()
    .clipAngle(90)
    .precision(0.6)
    .fitExtent(
      [
        [margin, margin],
        [width - margin, height - margin]
      ],
      globe
    );

  const OCEAN_COLOUR = '#173543';
  const LAND_COLOUR = '#333639';
  const LAND_STROKE_COLOUR = '#585858';
  const GLOBE_OUTLINE_COLOR = '#CCCCCC';
  const HIGHLIGHT_COLOR = 'hsl(220, 100%, 27%)';
  const ROTATION_TOP_SPEED: number = 0.025;
  const SPIN_UP_TIME = 3000;

  const mergedLand = topojson.merge(worldComplex, worldComplex.objects['custom.geo'].geometries);
  const borders = topojson.mesh(worldComplex, worldComplex.objects['custom.geo'], (a, b) => a !== b);

  // Here we are separating different countries and giving them different animations
  // depending on if they're partials or fading in or fading out.
  function doHighlightCalculations() {
    // Get full highlight countries

    prevHighlightedCountryCodes = countriesToHighlight.map(country => country.properties?.code);
    prevHighlightedCountries = countriesToHighlight;
  }

  $: {
    year;
    focus;
    zoom;
    doHighlightCalculations();
  }

  /**
   * Animate a change in both zoom and location
   */
  function setScaleAndPosition(
    scaleLocal: number,
    position: [number, number],
    duration: number = 1000,
    onComplete: () => void = () => {}
  ) {
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tweenFunction = () => {
      // Reset rotation
      isTweening = true;
      const scale0 = projection.scale();
      const lerpScale = interpolate(scale0, scaleLocal);
      const rotation0 = projection.rotate();
      const lerpRotation = interpolate<[number, number]>(rotation0, [-position[0], -position[1]]);
      return t => {
        if (shouldReduceMotion) {
          projection.scale(scaleLocal);
          projection.rotate([-position[0], -position[1]]);
        } else {
          projection.scale(lerpScale(t));
          projection.rotate(lerpRotation(t));
        }

        globalTime = t;
        draw();

        if (t === 1) {
          isTweening = false;
          if (canvas && shouldRotate && isInitialised) {
            t0 = Date.now();
            rotationWhenStarted = projection.rotate();
            startSpin();
          }
          onComplete && onComplete();
        }
      };
    };

    select({}).transition().duration(duration).tween('scaleAndRotation', tweenFunction);
  }

  /**
   * Draw a frame to the canvas
   */
  function draw() {
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
    path(mergedLand);

    context.fill();
    context.stroke();

    // Highlight a country
    countriesToHighlight.forEach((country: any) => {
      if (!context) return;
      context.beginPath();
      context.fillStyle = countriesToAnimateInArray.includes(country.properties?.code)
        ? `hsla(220, 100%, 27%, ${fadeEase(globalTime)})`
        : HIGHLIGHT_COLOR;
      path(country);
      context.fill();
    });

    countriesToAnimateOut.forEach((country: any) => {
      if (!context) return;
      context.beginPath();
      context.fillStyle = `hsl(220, 100%, 27%, ${1.0 - fadeEase(globalTime)})`;
      path(country);
      context.fill();
    });

    // Draw country outlines
    context.beginPath();
    context.strokeStyle = LAND_STROKE_COLOUR;
    context.lineWidth = 1.1;
    path(borders);
    context.stroke();

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

    isDrawing = false;
  }

  $: canvas &&
    setScaleAndPosition(zoom, focus, isInitialised ? duration : 0, () => {
      isInitialised = true;
    });

  // Scales and Easing
  const speedScale = scaleLinear().domain([0, 1]).range([0, ROTATION_TOP_SPEED]);
  speedScale.clamp(true);
  const easeScale = scaleLinear().domain([0, SPIN_UP_TIME]).range([0, 1]);
  easeScale.clamp(true);
  const speedEase = easeSinOut;

  const startSpin = () => {
    let t = Date.now() - t0;
    if (isTweening || !shouldRotate) return;
    const speed = speedScale(speedEase(easeScale(t)));
    projection.rotate([rotationWhenStarted[0] + speed * t, rotationWhenStarted[1]]);
    draw();
    requestAnimationFrame(startSpin);
  };

  onMount(() => {
    if (canvas && context) {
      canvasDpiScaler(canvas, context);
    }
  });

  $: context = canvas && canvas.getContext('2d');

  $: if (canvas && context) {
    // Do some preload magic to stop font flicker
    context.beginPath();
    context.fillStyle = 'rgba(0, 0, 0, 0.0)';
    context.font = '700 18px ABCSans';
    context.fillText('Preloading ABC Sans...', 100, 100);
    path = geoPath(projection, context);
  }
</script>

<div class="root" bind:this={rootEl} bind:clientWidth={width} bind:clientHeight={height}>
  <canvas {width} {height} bind:this={canvas}> </canvas>
</div>

<svelte:window bind:innerWidth bind:innerHeight />

<style lang="scss">
  div.root {
    width: 100%;
    height: 100%;
  }
</style>
