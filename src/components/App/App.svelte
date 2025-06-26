<script lang="ts">
  import Scrollyteller from '@abcnews/svelte-scrollyteller';

  // Components
  import Globe from '../Globe/Globe.svelte';

  import { markers, type BBox, type Mark } from './markers';
  import type { FeatureCollection } from 'geojson';
  import { createViewPolygon } from '../Globe/utils';

  export let scrollyData;

  const DEFAULT_DURATION = 1500;

  let duration = DEFAULT_DURATION;
  let autoRotation: 'west' | 'east' | 'none' = markers[0].rotate || 'none';
  let view: FeatureCollection = createViewPolygon(markers[0].bbox);
  let marks: Mark[] = markers[0].marks;
  let highlights: string[] = markers[0].highlights;

  const markerChangeHandler = marker => {
    const data = markers[marker.idx || 0];
    if (!data) return;
    let bbox: BBox;
    ({ bbox, highlights, marks } = data);

    view = createViewPolygon(bbox);

    duration = marker.duration || DEFAULT_DURATION;
    autoRotation = data.rotate || 'none';
  };
</script>

<Scrollyteller panels={scrollyData.panels} onMarker={markerChangeHandler} layout={{ resizeInteractive: false }}>
  <div class="graphic">
    <Globe {view} {marks} {highlights} {duration} {autoRotation} background="#ffffff" />
  </div>
</Scrollyteller>

<style lang="scss">
  .graphic {
    height: 100%;
    width: 100%;
  }
</style>
