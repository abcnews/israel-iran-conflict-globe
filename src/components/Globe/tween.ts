export const createTween = (initialValue: number, duration: number = 1000, easing: (t: number) => number = t => t) => {
  let target = initialValue;
  let value = target;
  let rafRef: ReturnType<typeof requestAnimationFrame>;
  const start = () => {
    cancelAnimationFrame(rafRef);
    let startTime: number;
    let startValue = value;
    const animate = (t: number) => {
      const delta = Math.min((t - startTime) / duration, 1);
      value = startValue + (target - startValue) * easing(delta);
      if (delta < 1) {
        rafRef = requestAnimationFrame(animate);
      }
    };
    rafRef = requestAnimationFrame(t => {
      startTime = t;
      animate(t);
    });
  };
  return {
    set target(t: number) {
      if (target !== t) {
        target = t;
        start();
      }
    },
    get target() {
      return target;
    },
    get value() {
      return value;
    }
  };
};
