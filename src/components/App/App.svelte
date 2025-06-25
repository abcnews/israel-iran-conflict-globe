<script lang="ts">
  import Scrollyteller from '@abcnews/svelte-scrollyteller';
  import rewind from '@mapbox/geojson-rewind';

  // Components
  import Globe from '../Globe/Globe.svelte';

  import { markers, type Mark } from './markers';
  import type { FeatureCollection } from 'geojson';

  export let scrollyData;

  const DEFAULT_DURATION = 1500;

  let duration = 1500;
  let shouldRotate = false;
  let view: FeatureCollection;
  let marks: Mark[];
  let highlights: string[];

  const markerChangeHandler = marker => {
    let bbox: [[number, number], [number, number], [number, number], [number, number]];
    ({ bbox, highlights, marks } = markers[marker.idx || 0]);

    view = rewind(
      {
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
      },
      true
    );

    duration = marker.duration || DEFAULT_DURATION;
    shouldRotate = marker.rotate ? true : false;
  };
</script>

<Scrollyteller panels={scrollyData.panels} onMarker={markerChangeHandler} layout={{ resizeInteractive: false }}>
  <div class="graphic">
    <Globe {view} {marks} {highlights} {duration} {shouldRotate} background="#213945" />
  </div>
</Scrollyteller>

<style lang="scss">
  .graphic {
    height: 100%;
    width: 100%;
  }
</style>
