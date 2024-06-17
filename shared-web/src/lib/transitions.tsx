export enum TransitionEasing {
  EaseInOut = 'ease-in-out',
}

export enum TransitionDuration {
  Short = 100,
  Standard = 300,
  Long = 600,
}

interface TransitionOptions {
  duration: TransitionDuration;
  easing: TransitionEasing;
  delay: number;
}

const defaultTransitionOptions: TransitionOptions = {
  duration: TransitionDuration.Standard,
  easing: TransitionEasing.EaseInOut,
  delay: 0,
};

export function cssTransition(props = ['all'], options: Partial<TransitionOptions> = {}): string {
  const {duration, easing, delay} = {...defaultTransitionOptions, ...options};
  const transitionValue = props.map(prop => `${prop} ${duration}ms ${easing} ${delay}ms`).join(',');
  return `transition: ${transitionValue};`;
}
