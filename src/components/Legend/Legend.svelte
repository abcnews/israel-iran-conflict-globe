<script lang="ts">
  import { withPrevious } from 'svelte-previous';

  export let year: number | null = null;
  export let isVisible = false;
  export let isObscuringGlobe = false;

  const [currentYear, previousYear] = withPrevious<number | null>(null);

  $: $currentYear = year;
</script>

<div class="legend" class:hasYear={$currentYear !== null} class:isVisible class:isObscuringGlobe>
  <div class="year">{$currentYear || $previousYear}</div>
  <div class="series british">
    <div class="indicator" />
    <div class="text">British rule</div>
  </div>
  <div class="series partial">
    <div class="indicator" />
    <div class="text">Partial rule</div>
  </div>
</div>

<style>
  .legend {
    opacity: 0;
    transform: translate(-50%, 0);
    position: absolute;
    top: 0;
    left: 50%;
    width: 100%;
    max-width: 330px;
    overflow: hidden;
    background-color: #eef5ff;
    font-family: ABCSans, sans-serif;
    display: flex;
    align-items: center;
    transition: opacity 0.75s;
  }

  .legend.isVisible {
    opacity: 1;
    transition-delay: 0.75s;
  }

  .legend::before {
    content: '';
    opacity: 0;
    position: absolute;
    top: -1px;
    left: -1px;
    border: 1px solid #69788c;
    width: calc(100% + 2px);
    height: calc(100% + 1px);
    transition: opacity 0.75s 0.25s;
  }

  @media (min-width: 331px) {
    .legend::before {
      left: 0;
      width: 100%;
    }
  }

  .legend.isObscuringGlobe::before {
    opacity: 1;
    transition-delay: 0.5s;
  }

  .legend > * {
    margin-right: 20px;
    text-align: center;
  }

  .year {
    transform: translate(-100%, 0);
    flex: 1 0 20%;
    padding: 4px;
    background-color: #69788c;
    color: #fff;
    font-size: 18px;
    letter-spacing: 0.1ch;
    transition: transform 0.5s ease-in-out;
  }

  .legend.hasYear .year {
    transform: none;
  }

  .year:empty::after {
    content: '\00A0'; /* &nbsp; */
  }

  .series {
    transform: translate(-33.33%, 0);
    flex: 1 1 40%;
    display: flex;
    gap: 10px;
    align-items: center;
    transition: transform 0.5s ease-in-out;
  }

  .legend.hasYear .series {
    transform: none;
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
