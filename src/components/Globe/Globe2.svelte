<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import { onMount } from 'svelte';
  import jankdefer from 'jankdefer';
  import d3 from './d3';
  import { Versor } from './Versor';

  // Internal imports
  import worldSimplified from './world-50m-simplified-0.4.topo.json';

  // export let background = 'hsl(0, 0%, 98%)';
  export let bbox: [[number, number], [number, number], [number, number], [number, number]] | undefined = undefined;
  // export let duration = 1250;

  // Start with an embedded, very simplified world map
  let world = worldSimplified;

  // Fetch a more detailed map to load in when it's available
  // fetch(__webpack_public_path__ + 'world-10m-simplified-0.8.topo.json')
  //   .then(res => res.json())
  //   .then(newWorld => (world = newWorld));

  $: countries = world.objects['world-50m.geo'];
  $: land = topojson.merge(world, countries.geometries);
  $: borders = topojson.mesh(world, countries, (a, b) => a !== b);

  let isTweening = false;

  const globe = { type: 'Sphere' };

  const fadeEase = d3.easeExpIn;

  let p1,
    p2 = [0, 0],
    r1,
    r2 = [0, 0, 0];
  let s1 = 0;
  let s2 = 0;

  let margin = 10;
  // Create a projection and a path generator.
  const projection = d3.geoOrthographic();
  const tilt = 0;
  const ORIGIN = [-0.118092, 51.509865]; // London
  const OCEAN_COLOUR = '#173543';
  const LAND_COLOUR = '#333639';
  const LAND_STROKE_COLOUR = '#585858';
  const GLOBE_OUTLINE_COLOR = '#CCCCCC';
  const HIGHLIGHT_COLOR = 'hsl(220, 100%, 27%)';
  const ROTATION_TOP_SPEED: number = 0.025;
  const SPIN_UP_TIME = 3000;
  const AREA_UNDER_GETS_DOTS = 2500;
  const PARTIAL_LINE_WIDTH = 1.1;
  const RING_RADIUS = 0.55;

  const dpr = window.devicePixelRatio ?? 1;
  const path = d3.geoPath();

  let width: number;
  let height: number;
  let rootEl: HTMLDivElement;
  let innerWidth: number;
  let innerHeight: height;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;

  $: path.projection(projection);
  $: path.context(context);

  const setContext = cavnas => {
    if (canvas) {
      context = canvas.getContext('2d');
      context.scale(dpr, dpr);
      return context;
    }
  };

  $: context = setContext(canvas);

  // Update projection
  $: projection.fitExtent(
    [
      [margin, margin],
      [width - margin, height - margin]
    ],
    { type: 'Sphere' }
  );

  // setInterval(render, 500);

  /**
   * Draw a frame to the canvas
   */
  function render() {
    if (!path || !context) return;

    // Start fresh
    context.clearRect(0, 0, width * dpr, height * dpr);

    // Draw the oceans
    context.beginPath();
    path({ type: 'Sphere' });
    context.fillStyle = OCEAN_COLOUR;
    context.fill();

    // Draw the land
    context.beginPath();
    context.strokeStyle = LAND_STROKE_COLOUR;
    context.lineWidth = 1.1;
    context.fillStyle = LAND_COLOUR;
    path(land);
    context.fill();
    context.stroke();

    // Draw borders
    context.beginPath();
    context.strokeStyle = LAND_STROKE_COLOUR;
    context.lineWidth = 1.1;
    path(borders);
    context.stroke();
  }

  function update(data) {
    const p = d3.geoOrthographic().fitSize([width, height], data);
    p1 = p2;
    p2 = d3.geoCentroid(data);
    r1 = r2;
    r2 = [-p2[0], tilt - p2[1], 0];
    s1 = s2;
    s2 = p.scale();

    const ip = d3.geoInterpolate(p1, p2);
    const iv = Versor.interpolateAngles(r1, r2);
    const is = d3.interpolate(s1, s2);

    projection.fitSize([width, height], data);

    d3.transition()
      .duration(1250)
      .tween('render', () => t => {
        console.log('t :>> ', t);
        projection.rotate(iv(t)).scale(is(t));
        render();
      })

      .end();
  }

  $: update(bbox);
</script>

<div class="root" bind:this={rootEl} bind:clientWidth={width} bind:clientHeight={height}>
  <canvas width={dpr * width} height={dpr * height} bind:this={canvas}></canvas>
</div>

<svelte:window bind:innerWidth bind:innerHeight />

<style>
  .root {
    width: 100%;
    height: 100%;
  }
  canvas {
    width: 100%;
    height: 100%;
  }
</style>
