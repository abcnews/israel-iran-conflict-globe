<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import d3 from './d3';
  import canvasDpiScaler from 'canvas-dpi-scaler';
  import { onMount } from 'svelte';
  import jankdefer from 'jankdefer';
  import geoJsonArea from '@mapbox/geojson-area';

  // Internal imports
  import countriesJson from './countries.json';
  import countryCodes from './countryCodes.json';
  import worldSimplified from './world-10m-simplified-0.01.topo.json';

  export let background = 'hsl(0, 0%, 98%)';
  export let zoom = 100;
  export let bbox: [[number, number], [number, number], [number, number], [number, number]] | undefined = undefined;
  export let duration = 1250;
  export let focus = 'AU';
  export let year = 0;
  export let shouldRotate = false;

  let world = worldSimplified;

  // fetch(__webpack_public_path__ + 'world-10m-simplified-0.8.topo.json')
  //   .then(res => res.json())
  //   .then(newWorld => (world = newWorld));

  type Label = {
    center: [number, number];
    label: string;
    hasDot: boolean;
  };

  let t0 = Date.now();

  let globalTime: number;
  let innerWidth;
  let innerHeight;
  let isInitialised = false;
  let rootEl;
  let canvas;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let context;
  let canvasElement;
  let path;
  let isDrawing = false;
  let countriesToHighlight: any = [];
  let countriesToHighlightPartial = [];
  let prevPartialHighlightedCountryCodes: any = [];
  let labels: Label[] = [];

  let prevCountriesToRing = [];
  let prevCountriesToRingPartial = [];
  let countriesToRingPartial = [];
  let countriesToRing: any = [];
  let ringsToAnimateOut = [];
  let ringsToAnimateOutPartial = [];

  let countriesToAnimateInArray: any = [];
  let partialAnimateInArray: any = [];
  let partialAnimateOut: any = [];
  let countriesToAnimateOut: any = [];
  let prevHighlightedCountries: any = [];
  let prevHighlightedCountryCodes: any = [];
  let prevPartialHighlightedCountries: any = [];

  let rotationWhenStarted: number = 0;

  let isTweening = false;

  const globe = { type: 'Sphere' };

  const fadeEase = d3.easeExpIn;

  let margin = getMargin(width, height);
  const projection = d3
    .geoOrthographic()
    .translate(width / 2, height / 2)
    .clipAngle(90)
    .precision(0.6)
    .fitExtent(
      [
        [margin, margin],
        [width - margin, height - margin]
      ],
      globe
    );

  let initialScale = projection.scale();
  let scale = initialScale;

  const ORIGIN = [-0.118092, 51.509865]; // London
  const OCEAN_COLOUR = 'hsl(216, 100%, 97%)';
  const LAND_COLOUR = '#FFFFFF';
  const LAND_STROKE_COLOUR = '#94a1a4';
  const GLOBE_OUTLINE_COLOR = '#CCCCCC';
  const HIGHLIGHT_COLOR = 'hsl(220, 100%, 27%)';
  const ROTATION_TOP_SPEED: number = 0.025;
  const SPIN_UP_TIME = 3000;
  const AREA_UNDER_GETS_DOTS = 2500;
  const PARTIAL_LINE_WIDTH = 1.1;
  const RING_RADIUS = 0.55;

  // More complex world
  const mergedLand = topojson.merge(worldSimplified, worldSimplified.objects['world-10m.geo'].geometries);

  // const landSansOthers = topojson.feature(worldSimplified, worldSimplified.objects['world-10m.geo']);

  // const countriesSansOthers = topojson
  //   .feature(worldSimplified, worldSimplified.objects['world-10m.geo'])
  //   .features.map(feature => {
  //     feature.properties.name = feature.properties.name_en || '';
  //     feature.properties.center = d3.geoCentroid(feature);
  //     feature.properties.code = feature.properties.iso_a2;
  //     return feature;
  //   });
  const countries: any = [];
  const borders = topojson.mesh(worldSimplified, worldSimplified.objects['world-10m.geo'], (a, b) => a !== b);

  // Calculate area of polygon km^2
  function getArea(country) {
    return geoJsonArea.geometry(country.geometry) / 1000000;
  }

  // Here we are separating different countries and giving them different animations
  // depending on if they're partials or fading in or fading out.
  function doHighlightCalculations() {
    countriesToHighlight = [];

    countriesToAnimateInArray = countriesToHighlight
      .filter((country: any) => !prevHighlightedCountryCodes.includes(country.properties?.code))
      .map(country => country.properties?.code);

    countriesToAnimateOut = prevHighlightedCountries.filter(
      country => !countriesToHighlight.map(country => country.properties?.code).includes(country.properties?.code)
    );

    // Get partial highlight countries
    countriesToHighlightPartial = [];

    partialAnimateInArray = countriesToHighlightPartial
      .filter((country: any) => !prevPartialHighlightedCountryCodes.includes(country.properties?.code))
      .map((country: any) => country.properties?.code);

    partialAnimateOut = prevPartialHighlightedCountries.filter(
      country =>
        !countriesToHighlightPartial.map((country: any) => country.properties?.code).includes(country.properties?.code)
    );

    // Little islands to put a ring/circle on
    countriesToRing = countriesToHighlight.filter(country => {
      return getArea(country) < AREA_UNDER_GETS_DOTS;
    });

    countriesToRingPartial = countriesToHighlightPartial.filter(country => {
      return getArea(country) < AREA_UNDER_GETS_DOTS;
    });

    ringsToAnimateOut = prevCountriesToRing.filter(
      (country: any) => !countriesToRing.map(country => country.properties?.code).includes(country.properties?.code)
    );

    ringsToAnimateOutPartial = prevCountriesToRingPartial.filter(
      (country: any) =>
        !countriesToRingPartial.map((country: any) => country.properties?.code).includes(country.properties?.code)
    );

    prevHighlightedCountryCodes = countriesToHighlight.map(country => country.properties?.code);
    prevPartialHighlightedCountryCodes = countriesToHighlightPartial.map((country: any) => country.properties?.code);
    prevHighlightedCountries = countriesToHighlight;
    prevPartialHighlightedCountries = countriesToHighlightPartial;
    prevCountriesToRing = countriesToRing;
    prevCountriesToRingPartial = countriesToRingPartial;
  }

  $: {
    year;
    focus;
    zoom;
    bbox;
    doHighlightCalculations();
  }

  const toDegrees = kms => kms / 111.319444;
  const wait = m => new Promise((resolve, reject) => setTimeout(resolve, m));
  const findCountry = name => {
    return countries.filter(c => {
      return c.properties.name.toLowerCase() === name.toLowerCase();
    })[0];
  };

  function findCountryByCode(countryCode, countries) {
    return countries.find(c => c.properties?.code?.toLowerCase() === countryCode.toLocaleLowerCase());
  }

  function getCenter(countryCode: string, countries): number[] {
    if (typeof countryCode === 'undefined') return ORIGIN;
    const foundCountry = findCountryByCode(countryCode, countries);
    if (!foundCountry) return ORIGIN;
    return foundCountry.properties.center;
  }

  function getMargin(width, height) {
    let percentage = width < 700 ? 0.05 : 0.15;
    return Math.floor(Math.min(width, height) * percentage);
  }

  function interpolateScale(fromScale, toScale, bounce) {
    return t => {
      let factor = 1 - 4 * t * t + 4 * t - 1;
      let result = fromScale + t * (toScale - fromScale);

      if (bounce) {
        result -= factor * Math.min(toScale, fromScale) * 0.5;
      }

      return result;
    };
  }

  /**
   * Animate a change in both zoom and location
   * @param {number} scale Percentage of initial scale
   * @param {array} position [lat, lng]
   * @param {number} duration A time in milliseconds
   * @param {function} onComplete A function to run when the tween has finished
   */
  function setScaleAndPosition(scaleLocal, position, duration, onComplete = () => {}) {
    if (typeof duration === 'undefined') duration = 1000;

    const currentScale = projection.scale();

    const proj = d3
      .geoOrthographic()
      .translate(width / 2, height / 2)
      .clipAngle(90)
      .precision(0.6)
      .fitSize([width, height], bbox);

    scaleLocal = proj.scale();

    scale = scaleLocal;
    scaleLocal = (initialScale * scale) / 100;
    position = path.centroid(bbox);

    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tweenFunction = () => {
      // Reset rotation
      isTweening = true;
      const scale0 = projection.scale();
      const lerpScale = d3.interpolate(scale0, scaleLocal);
      const rotation0 = projection.rotate();
      const lerpRotation = d3.interpolate(rotation0, [-position[0], -position[1]]);
      return t => {
        console.log(t);
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
          if (canvasElement && shouldRotate && isInitialised) {
            t0 = Date.now();
            rotationWhenStarted = projection.rotate();
            startSpin();
          }
          onComplete && onComplete();
        }
      };
    };

    d3.select({}).transition().duration(duration).tween('scaleAndRotation', tweenFunction);
  }

  function inversePosition() {
    return [-projection.rotate()[0], -projection.rotate()[1]];
  }

  /**
   * Draw a frame to the canvas
   */
  function draw(props = {}) {
    if (isDrawing) return;
    isDrawing = true;

    const c = context.canvas ? context : canvas.node().getContext('2d');

    c.clearRect(0, 0, width, height);

    // Draw the oceans
    c.beginPath();
    c.fillStyle = OCEAN_COLOUR;
    path(globe);
    c.fill();

    // Draw the land and borders
    c.beginPath();
    c.strokeStyle = LAND_STROKE_COLOUR;
    c.lineWidth = 1.1;
    c.fillStyle = LAND_COLOUR;
    path(mergedLand);

    c.fill();
    c.stroke();

    // // Highlight a country
    // countriesToHighlight.forEach((country: any) => {
    //   c.beginPath();
    //   c.fillStyle = countriesToAnimateInArray.includes(country.properties?.code)
    //     ? `hsla(220, 100%, 27%, ${fadeEase(globalTime)})`
    //     : HIGHLIGHT_COLOR;
    //   path(country);
    //   c.fill();
    // });

    // countriesToAnimateOut.forEach((country: any) => {
    //   c.beginPath();
    //   c.fillStyle = `hsl(220, 100%, 27%, ${1.0 - fadeEase(globalTime)})`;
    //   path(country);
    //   c.fill();
    // });

    // // Draw country outlines
    // c.beginPath();
    // c.strokeStyle = LAND_STROKE_COLOUR;
    // c.lineWidth = 1.1;
    // path(borders);
    // c.stroke();

    // // Partial highlights
    // countriesToHighlightPartial.forEach((country: any) => {
    //   c.beginPath();
    //   c.strokeStyle = partialAnimateInArray.includes(country.properties?.code)
    //     ? `hsla(223, 100%, 26%, ${fadeEase(globalTime)})`
    //     : 'hsl(223, 100%, 26%)';
    //   c.lineWidth = PARTIAL_LINE_WIDTH;
    //   c.fillStyle = partialAnimateInArray.includes(country.properties?.code)
    //     ? `hsl(219, 45%, 78%, ${fadeEase(globalTime)})`
    //     : 'hsl(219, 45%, 78%)';
    //   path(country);
    //   c.fill();
    //   c.stroke();
    // });

    // partialAnimateOut.forEach((country: any) => {
    //   c.beginPath();
    //   c.strokeStyle = `hsla(223, 100%, 26%, ${1.0 - fadeEase(globalTime)})`;
    //   c.lineWidth = PARTIAL_LINE_WIDTH;
    //   c.fillStyle = `hsl(219, 45%, 78%, ${1.0 - fadeEase(globalTime)})`;
    //   path(country);
    //   c.fill();
    //   c.stroke();
    // });

    // // Draw a thicker outline around the globe to hide any circle edges
    // c.beginPath();
    // c.strokeStyle = background;
    // c.lineWidth = 12;
    // path(globe);
    // c.stroke();

    // // Draw the nice thin actual outline of the globe
    // c.beginPath();
    // c.strokeStyle = GLOBE_OUTLINE_COLOR;
    // c.lineWidth = 1.7;
    // projection.scale(projection.scale() - 5);
    // path(globe);
    // c.stroke();
    // projection.scale(projection.scale() + 5);

    // // Draw any labels
    // labels.forEach((label, index) => {
    //   if (d3.geoDistance(label.center, inversePosition()) < 1.5707963267949) {
    //     const fontSize = window.innerWidth < 500 ? 16 : 18;

    //     // Set this before measuring
    //     c.font = `700 ${fontSize}px ABCSans`;

    //     const [x, y] = projection(label.center);

    //     const labelTextPadding = 18;
    //     const labelTextOffset = window.innerWidth < 500 ? 20 : 30;
    //     const labelTextWidth = c.measureText(label.label).width;

    //     c.font = `700 ${fontSize}px ABCSans`;
    //     c.textBaseline = 'bottom';

    //     // Draw dot
    //     if (label.hasDot) {
    //       c.beginPath();
    //       c.fillStyle = '#FF6100';
    //       c.strokeStyle = '#fff';
    //       c.lineWidth = 2;
    //       c.arc(x, y, 6, 0, Math.PI * 2);
    //       c.fill();
    //       c.stroke();
    //     }

    //     if (window.innerWidth < 500) {
    //       if (index % 2 === 0) {
    //         // Top label
    //         c.beginPath();
    //         c.moveTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset - fontSize * 2);
    //         c.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset - fontSize * 2);
    //         c.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset);
    //         c.lineTo(x + 5, y - labelTextOffset);
    //         c.lineTo(x, y - labelTextOffset * 0.3);
    //         c.lineTo(x - 5, y - labelTextOffset);
    //         c.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset);
    //         c.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset - fontSize * 2);
    //         c.closePath();
    //         c.fillStyle = '#000';
    //         c.fill();

    //         // Draw text
    //         c.fillStyle = '#fff';
    //         c.textAlign = 'center';
    //         c.fillText(label.label, x, y - labelTextOffset - fontSize * 0.2);
    //       } else {
    //         // Bottom label
    //         c.beginPath();
    //         c.moveTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset + fontSize * 2);
    //         c.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset + fontSize * 2);
    //         c.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset);
    //         c.lineTo(x + 5, y + labelTextOffset);
    //         c.lineTo(x, y + labelTextOffset * 0.7);
    //         c.lineTo(x - 5, y + labelTextOffset);
    //         c.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset);
    //         c.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset + fontSize * 2);
    //         c.closePath();
    //         c.fillStyle = '#000';
    //         c.fill();

    //         // Draw text
    //         c.fillStyle = '#fff';
    //         c.textAlign = 'center';
    //         c.fillText(label.label, x, y + labelTextOffset + fontSize * 1.6);
    //       }
    //     } else {
    //       if (index % 2 === 0) {
    //         // Draw tag background
    //         c.beginPath();
    //         c.moveTo(x + labelTextOffset, y - fontSize);
    //         c.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y - fontSize);
    //         c.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y + fontSize);
    //         c.lineTo(x + labelTextOffset, y + fontSize);
    //         c.lineTo(x + labelTextOffset / 3, y);
    //         c.closePath();
    //         c.fillStyle = '#000';
    //         c.fill();

    //         // Draw label
    //         c.fillStyle = '#fff';
    //         c.textAlign = 'left';
    //         c.fillText(label.label, x + labelTextOffset + labelTextPadding, y + fontSize * 0.6);
    //       } else {
    //         // Draw tag background
    //         c.beginPath();
    //         c.moveTo(x - labelTextOffset, y - fontSize);
    //         c.lineTo(x - labelTextOffset - labelTextWidth - labelTextPadding * 2, y - fontSize);
    //         c.lineTo(x - labelTextOffset - labelTextWidth - labelTextPadding * 2, y + fontSize);
    //         c.lineTo(x - labelTextOffset, y + fontSize);
    //         c.lineTo(x - labelTextOffset / 3, y);
    //         c.closePath();
    //         c.fillStyle = '#000';
    //         c.fill();

    //         // Draw label
    //         c.fillStyle = '#fff';
    //         c.textAlign = 'right';
    //         c.fillText(label.label, x - labelTextOffset - labelTextPadding, y + fontSize * 0.6);
    //       }
    //     }
    //   }
    // });

    isDrawing = false;
  }

  function getContext() {
    return context.canvas ? context : canvas.node().getContext('2d');
  }

  function onResize(localWidth: number, localHeight: number) {
    if (!canvas) return;

    // Don't bother resizing if the change is just the mobile browser bars
    if (window.innerHeight < height && window.innerHeight > height - 80) return;

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.attr('width', width).attr('height', height);

    margin = getMargin(width, height);
    projection.translate([width / 2, height / 2]).fitExtent(
      [
        [margin, margin],
        [width - margin, height - margin]
      ],
      globe
    );

    initialScale = projection.scale();

    // Keep scale at the percentage it was before the resize
    projection.scale((projection.scale() * scale) / 100);

    canvasDpiScaler(canvasElement, getContext());
    draw();
  }

  $: center = getCenter(focus, countries);
  $: canvas &&
    bbox &&
    setScaleAndPosition(zoom, center, isInitialised ? duration : 0, () => {
      isInitialised = true;
    });
  $: onResize(innerWidth, innerHeight);

  // Scales and Easing
  const speedScale = d3.scaleLinear().domain([0, 1]).range([0, ROTATION_TOP_SPEED]);
  speedScale.clamp(true);
  const easeScale = d3.scaleLinear().domain([0, SPIN_UP_TIME]).range([0, 1]);
  easeScale.clamp(true);
  const speedEase = d3.easeSinOut;

  const startSpin = () => {
    let t = Date.now() - t0;
    if (isTweening || !shouldRotate) return;
    const speed = speedScale(speedEase(easeScale(t)));
    projection.rotate([rotationWhenStarted[0] + speed * t, rotationWhenStarted[1]]);
    draw();
    requestAnimationFrame(startSpin);
  };

  onMount(() => {
    function init() {
      canvas = d3.select(rootEl).append('canvas').style('display', 'block').attr('width', width).attr('height', height);
      context = canvas.node().getContext('2d');
      canvasElement = canvas.node();

      // Scale Canvas if on HighDPI/Retina screens
      canvasDpiScaler(canvasElement, context);

      // Do some preload magic to stop font flicker
      context.beginPath();
      context.fillStyle = 'rgba(0, 0, 0, 0.0)';
      context.font = '700 18px ABCSans';
      context.fillText('Preloading ABC Sans...', 100, 100);

      path = d3.geoPath().projection(projection).context(context);
    }

    jankdefer(init, {
      framerateTarget: 50,
      timeout: 3000,
      threshold: 5,
      debug: false
    });
  });
</script>

<div bind:this={rootEl} />

<svelte:window bind:innerWidth bind:innerHeight />

<style lang="scss">
</style>
