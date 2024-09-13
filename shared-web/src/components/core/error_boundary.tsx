// Error boundary is only not supported by React using a class component

import {Component, JSX, ReactNode} from 'react';

interface ErrorBoundaryProps {
  fallback?: JSX.Element;
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public static displayName = 'ErrorBoundary';

  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {hasError: true};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override componentDidCatch(error: unknown, info: {componentStack: string}): void {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    // logErrorToMyService(error, info.componentStack);
  }

  public override render(): ReactNode {
    const {fallback, children} = this.props;
    const {hasError} = this.state;
    if (hasError) {
      return fallback ?? <></>;
    }

    return children;
  }
}
