<script lang="ts">
  // External imports
  import * as topojson from 'topojson-client';
  import d3 from './d3';
  import canvasDpiScaler from 'canvas-dpi-scaler';
  import { onMount } from 'svelte';
  import rangeInclusive from 'range-inclusive';

  // Internal imports
  import worldJson from './world.json';
  import countriesJson from './countries.json';
  import countryCodes from './countryCodes.json';
  import empireData from './empireData.json';

  // Format data to determine if in empire or not
  const earliestYear = 1169;
  const latestYear = 2022;
  const empireYears = rangeInclusive(earliestYear, latestYear);
  const empireMap = new Map();

  empireYears.forEach((year: number) => {
    const countriesIn = empireData.filter(country => year >= country['Start date'] && year <= country['End date']);
    empireMap.set(year, { in: countriesIn });
  });

  export let background = 'hsl(0, 0%, 98%)';
  export let zoom = 100;
  export let duration = 1250;
  export let focus = 'AU';
  export let year = 1901;

  let isInitialised = false;
  let rootEl;
  let canvas;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let context;
  let canvasElement;
  let path;
  let isDrawing = false;
  let countriesToHighlight = [];

  const globe = { type: 'Sphere' };

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

  const INITIAL_SCALE = projection.scale();
  let scale = INITIAL_SCALE;

  const ORIGIN = [-0.118092, 51.509865]; // London
  const OCEAN_COLOUR = 'hsl(195, 29%, 92%)';
  const LAND_COLOUR = '#FFFFFF';
  const LAND_STROKE_COLOUR = 'rgba(29, 60, 67, 0.5)';

  // Map Features
  const LAND = topojson.feature(worldJson, worldJson.objects.land);
  const COUNTRIES = topojson.feature(worldJson, worldJson.objects.countries).features.map(f => {
    f.properties.name = countriesJson[f.id.toString()] || '';
    f.properties.center = d3.geoCentroid(f);
    f.properties.colour = '#377f8c';
    f.properties.code = countryCodes.find(country => country.Numeric.toString() === f.id.toString())?.Alpha2;
    return f;
  });
  const BORDERS = topojson.mesh(worldJson, worldJson.objects.countries, (a, b) => a !== b);

  $: {
    const inCurrentYear = empireMap.get(year).in;
    const countryCodeArray = inCurrentYear.map(country => country['Country Code']);
    countriesToHighlight = COUNTRIES.filter(country => countryCodeArray.includes(country.properties.code));
  }

  const toDegrees = kms => kms / 111.319444;
  const wait = m => new Promise((resolve, reject) => setTimeout(resolve, m));
  const findCountry = name => {
    return COUNTRIES.filter(c => {
      return c.properties.name.toLowerCase() === name.toLowerCase();
    })[0];
  };

  function getCenter(countryCode: string, countries): number[] {
    if (typeof countryCode === 'undefined') return ORIGIN;
    const foundCountry = countries.find(c => c.properties?.code?.toLowerCase() === countryCode.toLocaleLowerCase());
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
    scaleLocal = (INITIAL_SCALE * scale) / 100;

    if (typeof position === 'string') position = findCountry(position).properties.center;

    d3.select({})
      .transition()
      .duration(duration)
      .tween('scaleAndRotation', () => {
        const scale0 = projection.scale();
        const lerpScale = d3.interpolate(scale0, scaleLocal);
        const rotation0 = projection.rotate();
        const lerpRotation = d3.interpolate(rotation0, [-position[0], -position[1]]);
        return t => {
          projection.scale(lerpScale(t));
          projection.rotate(lerpRotation(t));
          draw();

          t === 1 && onComplete();
        };
      });
  }

  /**
   * Draw a frame to the canvas
   */
  function draw(props = {}) {
    if (isDrawing) return;
    isDrawing = true;

    // props = props || this.props;

    const c = context.canvas ? context : canvas.node().getContext('2d');

    // c.fillStyle = c.fillRect(0, 0, width, height);
    c.clearRect(0, 0, width, height);

    // Draw the oceans
    c.beginPath();
    c.fillStyle = OCEAN_COLOUR;
    path(globe);
    c.fill();

    // Draw the land
    c.beginPath();
    c.strokeStyle = LAND_STROKE_COLOUR;
    c.fillStyle = LAND_COLOUR;
    c.lineWidth = 1.1;
    path(LAND);
    c.fill();
    c.stroke();

    // Highlight a country
    countriesToHighlight.forEach(country => {
      c.beginPath();
      c.fillStyle = 'salmon';
      path(country);
      c.fill();
    });

    // Draw country outlines
    c.beginPath();
    c.strokeStyle = LAND_STROKE_COLOUR;
    c.lineWidth = 1.1;
    path(BORDERS);
    c.stroke();

    // // Draw any shapes
    // (props.config.shapes || []).forEach(shape => {
    //   shape.features.forEach(feature => {
    //     if (
    //       feature.geometry.type === 'Point' &&
    //       d3.geoDistance(feature.geometry.coordinates, this.inversePosition()) < 1.5707963267949
    //     ) {
    //       const [x, y] = this.projection(feature.geometry.coordinates);

    //       c.beginPath();
    //       c.fillStyle = shape.fill;
    //       c.strokeStyle = '#fff';
    //       c.lineWidth = 2;
    //       c.arc(x, y, 6, 0, Math.PI * 2);
    //       c.fill();
    //       c.stroke();
    //     } else {
    //       c.beginPath();
    //       c.fillStyle = null;
    //       c.strokeStyle = null;
    //       this.path(feature);
    //       if (shape.fill) {
    //         c.fillStyle = shape.fill;
    //         if (shape.opacity) {
    //           c.globalAlpha = shape.opacity;
    //         }
    //         c.fill();
    //         c.globalAlpha = 1;
    //       }
    //       if (shape.stroke) {
    //         c.strokeStyle = shape.stroke;
    //         c.lineWidth = 2;
    //         c.stroke();
    //       }
    //     }
    //   });
    // });

    // // Draw any ranges
    // this.ranges.forEach(range => {
    //   c.beginPath();
    //   c.strokeStyle = '#FF6100';
    //   c.globalAlpha = 0.1;
    //   c.fillStyle = '#FF4D00';
    //   c.lineWidth = 3;
    //   this.path(range());
    //   c.fill();
    //   c.globalAlpha = 1;
    //   c.stroke();
    // });

    // Draw a thicker outline around the globe to hide any circle edges
    c.beginPath();
    c.strokeStyle = background;
    c.lineWidth = 12;
    path(globe);
    c.stroke();

    // Draw the nice thin actual outline of the globe
    c.beginPath();
    c.strokeStyle = '#B6CED6';
    c.lineWidth = 2;
    projection.scale(projection.scale() - 5);
    path(globe);
    c.stroke();
    projection.scale(projection.scale() + 5);

    // // Draw a little plane somewhere
    // if (this.plane) {
    //   const l = this.projection(this.plane.slice(0, 2)).concat(this.plane[2]);
    //   c.translate(l[0], l[1]);
    //   c.rotate(l[2]);
    //   c.drawImage(this.planeImage, -25, -25, 50, 50);
    //   c.rotate(-l[2]);
    //   c.translate(-l[0], -l[1]);
    // }

    // // Draw any labels
    // this.labels.forEach((label, index) => {
    //   if (d3.geoDistance(label.center, this.inversePosition()) < 1.5707963267949) {
    //     const fontSize = window.innerWidth < 500 ? 16 : 18;

    //     // Set this before measuring
    //     c.font = `700 ${fontSize}px ABCSans`;

    //     const [x, y] = this.projection(label.center);

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

  $: center = getCenter(focus, COUNTRIES);
  $: setScaleAndPosition(zoom, center, duration);

  onMount(() => {
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

    // Set initial position instantly
    // setScaleAndPosition(100, ORIGIN, 0, () => (isInitialised = true));
  });
</script>

<div bind:this={rootEl} />

<style lang="scss">
</style>
