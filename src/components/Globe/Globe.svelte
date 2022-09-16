<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import d3 from './d3';
  import canvasDpiScaler from 'canvas-dpi-scaler';
  import { onMount, onDestroy } from 'svelte';
  import rangeInclusive from 'range-inclusive';
  import jankdefer from 'jankdefer';
  import geoJsonArea from '@mapbox/geojson-area';
  import produce from 'immer';

  // Internal imports
  import worldJson from './world.json';
  import countriesJson from './countries.json';
  import countryCodes from './countryCodes.json';
  import empireData from './empireData.json';
  import worldComplex from './world-stripped.json';
  import gibraltarJson from './gibraltar.json';
  import britishIndianOceanTerritoryJson from './britishIndianOceanTerritory.json';

  // Format data to determine if in empire or not
  const earliestYear = 1169;
  const latestYear = 2022;
  const empireYears = rangeInclusive(earliestYear, latestYear);
  const empireLookup = new Map();

  empireYears.forEach((year: number) => {
    const countriesIn = empireData.filter(country => year >= country['Start date'] && year <= country['End date']);
    empireLookup.set(year, { in: countriesIn });

    // Special cases, only UK, and ALL ever
    empireLookup.set(0, { in: empireData.filter(country => country['Country Code'] === 'GB') });
    empireLookup.set(4000, { in: empireData });
  });

  export let background = 'hsl(0, 0%, 98%)';
  export let zoom = 100;
  export let duration = 1250;
  export let focus = 'AU';
  export let year = 0;
  export let shouldRotate = false;

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
  let totalCountriesToHighlight: any = [];
  let countriesToHighlightPartial = [];
  let prevPartialHighlightedCountryCodes: any = [];
  let prevCountriesToRing = [];
  let countriesToRing: any = [];
  let ringsToAnimateOut = [];
  let countriesToAnimateIn: any = [];
  let partialAnimateInArray: any = [];
  let partialAnimateOut: any = [];
  let countriesToAnimateOut: any = [];
  let prevHighlightedCountries: any = [];
  let prevHighlightedCountryCodes: any = [];
  let prevPartialHighlightedCountries: any = [];
  let earthRotation: number = 0;
  let rotationSpeed: number = 0.0;
  let rotationTopSpeed: number = 0.2;
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
  const RING_OPACITY = 0.9;

  // Map Features (Keeping because of missing Antarctica)
  // TODO: Integrate into more complex map
  // const LAND = topojson.feature(worldJson, worldJson.objects.countries);
  const COUNTRIES = topojson.feature(worldJson, worldJson.objects.countries).features.map(f => {
    f.properties.name = countriesJson[f.id?.toString()] || '';
    f.properties.center = d3.geoCentroid(f);
    f.properties.code = countryCodes.find(country => country.Numeric.toString() === f.id?.toString())?.Alpha2;
    return f;
  });
  // const BORDERS = topojson.mesh(worldJson, worldJson.objects.countries, (a, b) => a !== b);
  const antarctica = findCountryByCode('AQ', COUNTRIES);

  const [gibraltar] = topojson.feature(gibraltarJson, gibraltarJson.objects.gibraltar).features.map(feature => {
    feature.properties.name = feature.properties.name || '';
    feature.properties.center = d3.geoCentroid(feature);
    feature.properties.code = 'GI';
    return feature;
  });

  const [britishIndianOceanTerritory] = topojson
    .feature(britishIndianOceanTerritoryJson, britishIndianOceanTerritoryJson.objects.britishIndianOcean)
    .features.map(feature => {
      feature.properties.name = feature.properties.name || '';
      feature.properties.center = d3.geoCentroid(feature);
      feature.properties.code = 'IO';
      return feature;
    });

  // More complex world
  const landSansOthers = topojson.feature(worldComplex, worldComplex.objects['custom.geo']);

  const countriesSansOthers = topojson
    .feature(worldComplex, worldComplex.objects['custom.geo'])
    .features.map(feature => {
      feature.properties.name = feature.properties.name_en || '';
      feature.properties.center = d3.geoCentroid(feature);
      feature.properties.code = feature.properties.iso_a2;
      return feature;
    });
  const countries: any = [...countriesSansOthers, antarctica, gibraltar, britishIndianOceanTerritory];
  const borders = topojson.mesh(worldJson, worldJson.objects.countries, (a, b) => a !== b);

  const land = produce(landSansOthers, draft => {
    draft.features.push(antarctica, gibraltar, britishIndianOceanTerritory);
  });

  // Calculate area of polygon km^2
  function getArea(country) {
    return geoJsonArea.geometry(country.geometry) / 1000000;
  }

  // Here we are separating different countries and giving them different animations
  // depending on if they're partials or fading in or fading out.
  function doHighlightCalculations() {
    const inCurrentYear = empireLookup.get(year)?.in;
    const inCurrentYearFull = inCurrentYear?.filter(country => !country.Partial) || [];
    const inCurrentYearPartial = inCurrentYear?.filter(country => country.Partial) || [];

    // Get full highlight countries
    const countryCodeArray = inCurrentYearFull.map(country => country['Country Code']);
    countriesToHighlight = countries.filter(country => countryCodeArray.includes(country.properties?.code));

    countriesToAnimateIn = countriesToHighlight
      .filter((country: any) => !prevHighlightedCountryCodes.includes(country.properties?.code))
      .map(country => country.properties?.code);

    countriesToAnimateOut = prevHighlightedCountries.filter(
      country => !countriesToHighlight.map(country => country.properties?.code).includes(country.properties?.code)
    );

    // Get partial highlight countries
    const countryCodePartialArray: any = inCurrentYearPartial.map(country => country['Country Code']);
    countriesToHighlightPartial = countries.filter(country =>
      countryCodePartialArray.includes(country.properties?.code)
    );

    partialAnimateInArray = countriesToHighlightPartial
      .filter((country: any) => !prevPartialHighlightedCountryCodes.includes(country.properties?.code))
      .map((country: any) => country.properties?.code);

    partialAnimateOut = prevPartialHighlightedCountries.filter(
      country =>
        !countriesToHighlightPartial.map((country: any) => country.properties?.code).includes(country.properties?.code)
    );

    // Little islands to put a ring/circle on
    countriesToRing = countriesToHighlight.filter(country => {
      return getArea(country) < 1000;
    });

    ringsToAnimateOut = prevCountriesToRing.filter(
      (country: any) => !countriesToRing.map(country => country.properties?.code).includes(country.properties?.code)
    );

    prevHighlightedCountryCodes = countriesToHighlight.map(country => country.properties?.code);
    prevPartialHighlightedCountryCodes = countriesToHighlightPartial.map((country: any) => country.properties?.code);
    prevHighlightedCountries = countriesToHighlight;
    prevPartialHighlightedCountries = countriesToHighlightPartial;
    prevCountriesToRing = countriesToRing;
  }

  $: {
    year;
    focus;
    zoom;
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

    scale = scaleLocal;
    scaleLocal = (initialScale * scale) / 100;

    if (typeof position === 'string') position = findCountry(position).properties.center;

    const tweenFunction = () => {
      // Stop auto rotate & reset initial auto rotate speed
      isTweening = true;
      rotationSpeed = 0;

      const scale0 = projection.scale();
      const lerpScale = d3.interpolate(scale0, scaleLocal);
      const rotation0 = projection.rotate();
      const lerpRotation = d3.interpolate(rotation0, [-position[0], -position[1]]);
      return t => {
        projection.scale(lerpScale(t));
        projection.rotate(lerpRotation(t));
        globalTime = t;
        draw();

        if (t === 1) {
          isTweening = false;
          canvasElement && shouldRotate && startSpin();
          onComplete && onComplete();
        }
      };
    };

    d3.select({}).transition().duration(duration).tween('scaleAndRotation', tweenFunction);
  }

  /**
   * Animate a change in scale for the globe
   * @param {number} scale Percentage of initial scale
   * @param {number} duration A time in milliseconds
   * @param {bool} bounce Should the camera zoom out further than needed in the zoom tween arc
   * @param {function} onComplete A function to run when the tween has finished
   */
  function setScale(scale, duration, bounce, onComplete) {
    if (typeof duration === 'undefined') duration = 1000;

    scale = scale;
    scale = (initialScale * scale) / 100;

    d3.select({})
      .transition()
      .duration(duration)
      .tween('zoom', () => {
        const scale0 = projection.scale();
        const lerp = interpolateScale(scale0, scale, bounce);
        return t => {
          projection.scale(lerp(t));
          draw();

          if (t === 1) {
            onComplete && onComplete();
          }
        };
      });
  }

  /**
   * Animate the focused location of the globe
   * @param {array|string} position [lat, lng] or name of country
   * @param {number} duration A time in milliseconds
   * @param {function} onComplete A function to run when the tween has finished
   */
  function setPosition(position, duration, onComplete) {
    if (typeof duration === 'undefined') duration = 1000;
    if (typeof position === 'string') position = findCountry(position).properties.center;

    d3.select({})
      .transition()
      .duration(duration)
      .tween('rotation', () => {
        const rotation0 = projection.rotate();
        const lerp = d3.interpolate(rotation0, [-position[0], -position[1]]);
        return t => {
          projection.rotate(lerp(t));
          draw();

          if (t === 1) {
            onComplete && onComplete();
          }
        };
      });
  }

  /**
   * Animate a change in location of the globe
   * @param {array} vector [x, y] in kilometres to be added to the current [lat, lng] position
   * @param {number} duration A time in milliseconds
   * @param {function} onComplete A function to run when the tween has finished
   */
  function rotateBy(vector, duration, onComplete) {
    if (typeof duration === 'undefined') duration = 1000;

    const rotation0 = projection.rotate();
    const newPosition = [-rotation0[0] + toDegrees(vector[0]), -rotation0[1] + toDegrees(vector[1])];

    setPosition(newPosition, duration, onComplete);
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
    path(land);
    c.fill();
    c.stroke();

    // Highlight a country
    countriesToHighlight.forEach((country: any) => {
      c.beginPath();
      c.fillStyle = countriesToAnimateIn.includes(country.properties?.code)
        ? `hsla(220, 100%, 27%, ${fadeEase(globalTime)})`
        : HIGHLIGHT_COLOR;
      path(country);
      c.fill();
    });

    countriesToAnimateOut.forEach((country: any) => {
      c.beginPath();
      c.fillStyle = `hsl(220, 100%, 27%, ${1.0 - fadeEase(globalTime)})`;
      path(country);
      c.fill();
    });

    // Partial highlights
    countriesToHighlightPartial.forEach((country: any) => {
      c.beginPath();
      c.strokeStyle = partialAnimateInArray.includes(country.properties?.code)
        ? `hsla(223, 100%, 26%, ${fadeEase(globalTime)})`
        : 'hsl(223, 100%, 26%)';
      c.lineWidth = 1.4;
      c.fillStyle = partialAnimateInArray.includes(country.properties?.code)
        ? `hsl(219, 45%, 78%, ${fadeEase(globalTime)})`
        : 'hsl(219, 45%, 78%)';
      path(country);
      c.fill();
      c.stroke();
    });

    partialAnimateOut.forEach((country: any) => {
      c.beginPath();
      c.strokeStyle = `hsla(223, 100%, 26%, ${1.0 - fadeEase(globalTime)})`;
      c.lineWidth = 1.4;
      c.fillStyle = `hsl(219, 45%, 78%, ${1.0 - fadeEase(globalTime)})`;
      path(country);
      c.fill();
      c.stroke();
    });

    // Draw a ring around smaller islands
    countriesToRing.forEach((country: any) => {
      c.beginPath();
      const circle = d3.geoCircle().center(country.properties?.center).radius(0.5);
      c.beginPath();
      c.fillStyle = countriesToAnimateIn.includes(country.properties?.code)
        ? `hsla(220, 100%, 27%, ${fadeEase(globalTime)})`
        : HIGHLIGHT_COLOR;
      path(circle());
      c.fill();
    });

    ringsToAnimateOut.forEach((country: any) => {
      c.beginPath();
      const circle = d3.geoCircle().center(country.properties?.center).radius(0.5);
      c.beginPath();
      c.fillStyle = `hsla(220, 100%, 27%, ${1.0 - fadeEase(globalTime)})`;
      path(circle());
      c.fill();
    });

    // Draw country outlines
    // c.beginPath();
    // c.strokeStyle = LAND_STROKE_COLOUR;
    // c.lineWidth = 1.4;
    // path(BORDERS);
    // c.stroke();

    // Draw a thicker outline around the globe to hide any circle edges
    c.beginPath();
    c.strokeStyle = background;
    c.lineWidth = 12;
    path(globe);
    c.stroke();

    // Draw the nice thin actual outline of the globe
    c.beginPath();
    c.strokeStyle = GLOBE_OUTLINE_COLOR;
    c.lineWidth = 1.7;
    projection.scale(projection.scale() - 5);
    path(globe);
    c.stroke();
    projection.scale(projection.scale() + 5);

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
    setScaleAndPosition(zoom, center, isInitialised ? duration : 0, () => {
      isInitialised = true;
    });
  $: onResize(innerWidth, innerHeight);

  const startSpin = () => {
    if (isTweening || !shouldRotate) return;
    rotationSpeed < rotationTopSpeed ? rotationSpeed += 0.001 : null;
    earthRotation = projection.rotate();
    earthRotation[0] = earthRotation[0] + rotationSpeed;
    projection.rotate(earthRotation);
    draw();
    requestAnimationFrame(startSpin);
  };

  $: {
    // Do we need this?
    !shouldRotate ? rotationSpeed = 0 : null;
  }

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
