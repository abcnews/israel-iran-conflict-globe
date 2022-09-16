<script lang="ts">
  import Scrollyteller from 'svelte-scrollyteller';
  import PercentageIndicators from '../PercentageIndicators.svelte';
  import _CustomPanel from '../CustomPanel.svelte';
  const CustomPanel: any = _CustomPanel; // TS WorkAround

  // Components
  import Globe from '../Globe/Globe.svelte';
  import Legend from '../Legend/Legend.svelte';

  export let scrollyData;

  const DEFAULT_DURATION = 1500;

  let globeScale = 100;
  let countryCodeFocus = 'GB';
  let year: number = 0;
  let duration = 1500;
  let shouldRotate = false;
  let isLegendVisible = false;
  let isLegendObscuringGlobe = false;

  const markerChangeHandler = marker => {
    console.log(marker);
    globeScale = marker.zoom || globeScale;
    countryCodeFocus = marker.focus || 'GB';
    year = typeof marker.year === 'undefined' ? 0 : marker.year;
    duration = marker.duration || DEFAULT_DURATION;
    shouldRotate = marker.rotate ? true : false;
    isLegendVisible = year !== 0;
    isLegendObscuringGlobe = isLegendVisible && globeScale >= 150;
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
    <Globe zoom={globeScale} focus={countryCodeFocus} {year} {duration} {shouldRotate} />
    <Legend
      year={year >= 1901 && year <= 2022 ? year : null}
      isVisible={isLegendVisible}
      isObscuringGlobe={isLegendObscuringGlobe}
    />
  </div>
</Scrollyteller>

<style lang="scss">
  .graphic {
    height: 100%;
    width: 100%;
    background-color: 'hsl(0, 0%, 98%)';
    display: flex;
  }

  :global(.u-layout > div.interactive-globe) {
    // Fix for Odyssey
    margin-left: calc(-50vw + 0px + 50%) !important;
    width: calc(100vw - 0px);
  }
</style>
