<script lang="ts">
  import Scrollyteller from 'svelte-scrollyteller';
  import PercentageIndicators from '../PercentageIndicators.svelte';
  import _CustomPanel from '../CustomPanel.svelte';
  const CustomPanel: any = _CustomPanel; // TS WorkAround

  // Components
  import Globe from '../Globe/Globe.svelte';

  export let scrollyData;

  let number = 0;
  let stProgress;

  const markerChangeHandler = marker => {
    console.log(marker);
    number = marker.number;
  };

  const progressChangeHandler = progress => {
    // console.log(progress);
    stProgress = progress;
  };
</script>

<Scrollyteller
  panels={scrollyData.panels}
  onMarker={markerChangeHandler}
  onProgress={progressChangeHandler}
  customPanel={CustomPanel}
>
  <div class="graphic">
    <Globe />
  </div>
</Scrollyteller>

<style>
  .graphic {
    height: 100%;
    width: 100%;
    background-color: 'hsl(0, 0%, 98%)';
    display: flex;
  }
</style>
