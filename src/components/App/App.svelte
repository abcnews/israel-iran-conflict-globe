<script lang="ts">
  import Scrollyteller from '@abcnews/svelte-scrollyteller';
  import d3 from '../Globe/d3';
  import { bbox as getBBox } from '@turf/bbox';

  // Components
  import Globe from '../Globe/Globe.svelte';

  import { markers, type Mark } from './markers';
  import type { FeatureCollection, GeometryObject } from 'geojson';

  export let scrollyData;

  const DEFAULT_DURATION = 1500;

  const bbox2featurecollenction = bbox => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            coordinates: [[...bbox, bbox[0]]],
            type: 'Polygon'
          }
        }
      ]
    };
  };

  let globeScale = 100;
  let countryCodeFocus = 'GB';
  let year: number = 0;
  let duration = 1500;
  let shouldRotate = false;
  let isLegendVisible = false;
  let isLegendObscuringGlobe = false;
  let view: FeatureCollection;
  let focus;
  let scale;
  let marks: Mark[];
  let highlights: string[];

  const markerChangeHandler = marker => {
    let bbox: [[number, number], [number, number], [number, number], [number, number]];
    ({ bbox, highlights, marks } = markers[marker.idx || 0]);

    view = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            coordinates: [bbox],
            type: 'Polygon'
          }
        }
      ]
    };

    const p = d3.geoOrthographic();

    scale = p.fitSize([clientHeight, clientWidth], bbox).scale();
    // globeScale = marker.zoom || globeScale;

    countryCodeFocus = marker.focus || 'GB';
    year = typeof marker.year === 'undefined' ? 0 : marker.year;
    duration = marker.duration || DEFAULT_DURATION;
    shouldRotate = marker.rotate ? true : false;
    isLegendVisible = year !== 0;
    isLegendObscuringGlobe = isLegendVisible && globeScale >= 150;
  };

  let clientHeight;
  let clientWidth;
</script>

<Scrollyteller panels={scrollyData.panels} onMarker={markerChangeHandler}>
  <div class="graphic" bind:clientHeight bind:clientWidth>
    <Globe {view} {duration} {shouldRotate} />
  </div>
</Scrollyteller>

<style lang="scss">
  .graphic {
    height: 100%;
    width: 100%;
    background-color: hsl(0, 0%, 98%);
    display: flex;
  }

  :global(.u-layout > div.interactive-globe) {
    // Fix for Odyssey
    margin-left: calc(-50vw + 0px + 50%) !important;
    width: calc(100vw - 0px);
  }

  // Should be handled by Odyssey now
  // :global(.Caption-attribution) {
  //   white-space: normal !important;
  // }
</style>
