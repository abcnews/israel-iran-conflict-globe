<script lang="ts">
  import Scrollyteller from 'svelte-scrollyteller';
  import PercentageIndicators from '../PercentageIndicators.svelte';
  import _CustomPanel from '../CustomPanel.svelte';
  const CustomPanel: any = _CustomPanel; // TS WorkAround

  // Components
  import Globe from '../Globe/Globe.svelte';

  export let scrollyData;

  const DEFAULT_DURATION = 1500;

  let globeScale = 100;
  let countryCodeFocus = 'GB';
  let year = 1901;
  let duration = 1500;

  const markerChangeHandler = marker => {
    console.log(marker);
    globeScale = marker.zoom || globeScale;
    countryCodeFocus = marker.focus || 'GB';
    year = marker.year || year;
    duration = marker.duration || DEFAULT_DURATION;
  };

  const progressChangeHandler = progress => {};
</script>

<Scrollyteller
  panels={scrollyData.panels}
  onMarker={markerChangeHandler}
  onProgress={progressChangeHandler}
  customPanel={CustomPanel}
>
  <div class="graphic">
    <Globe zoom={globeScale} focus={countryCodeFocus} {year} {duration} />
  </div>
</Scrollyteller>

<style>
  .graphic {
    height: 100%;
    width: 100%;
    background-color: 'hsl(0, 0%, 98%)';
    display: flex;
  }

  :global(.u-layout > div.interactive-globe) {
    margin-left: calc(-50vw + 0px + 50%) !important;
    width: calc(100vw - 0px);
  }
</style>
