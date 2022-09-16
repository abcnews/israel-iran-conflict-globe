<script lang="ts">
  export let year: number;
  export let isVisible = false;
  export let isObscuringGlobe = false;

  $: clampedYear = Math.max(1901, Math.min(year, 2022));
</script>

<legend class="legend" class:isVisible class:isObscuringGlobe>
  <div class="year">{clampedYear}</div>
  <div class="series british">
    <div class="indicator" />
    <div class="text">British rule</div>
  </div>
  <div class="series partial">
    <div class="indicator" />
    <div class="text">Partial rule</div>
  </div>
</legend>

<style>
  .legend {
    opacity: 0;
    transform: translate(-50%, 0);
    position: absolute;
    top: 0;
    left: 50%;
    padding: 0;
    width: 100%;
    max-width: 330px;
    background-color: #eef5ff;
    font-family: ABCSans, sans-serif;
    display: flex;
    align-items: center;
    transition: opacity 0.75s, box-shadow 0.75s;
  }

  .legend.isVisible {
    opacity: 1;
    transition-delay: 0.75s;
  }

  .legend.isObscuringGlobe {
    box-shadow: inset -1px -1px 0px 0px #94a1a4;
  }

  .legend > * {
    margin-right: 20px;
    text-align: center;
  }

  .year {
    flex: 1 0 20%;
    padding: 4px;
    background-color: #69788c;
    color: #fff;
    font-size: 18px;
    letter-spacing: 0.1ch;
  }

  .series {
    flex: 1 1 40%;
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .indicator {
    display: inline-block;
    margin-left: auto;
    margin-bottom: 1px;
    border: 1px solid #00297f;
    width: 13px;
    height: 13px;
    background-color: #00297f;
  }

  .series.partial .indicator {
    background-color: #a3b7dc;
  }

  .text {
    margin-right: auto;
    color: #000;
    font-size: 12px;
    letter-spacing: 0.05ch;
  }
</style>
