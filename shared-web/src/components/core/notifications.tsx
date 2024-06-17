import {FC, JSX, useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {styled} from 'styled-components';

export interface NotificationOptions {
  duration: number;
  alertColor: string;
  successColor: string;
}

let baseOptions: NotificationOptions = {
  duration: 3000,
  alertColor: '#af4949',
  successColor: '#49af68',
};

const mergeOptions = (overrides?: Partial<NotificationOptions>): NotificationOptions => ({
  duration: overrides?.duration ?? baseOptions.duration,
  alertColor: overrides?.alertColor ?? baseOptions.alertColor,
  successColor: overrides?.successColor ?? baseOptions.successColor,
});

export function setupNotifications(overrides?: Partial<NotificationOptions>): void {
  if (overrides) {
    baseOptions = mergeOptions(overrides);
  }
}

type NotificationType = 'alert' | 'success';
type NotificationContent = JSX.Element | string;

export function showAlert(
  content: NotificationContent,
  overrides?: Partial<NotificationOptions>
): void {
  showNotification('alert', content, mergeOptions(overrides));
}
export function showSuccess(
  content: NotificationContent,
  overrides?: Partial<NotificationOptions>
): void {
  showNotification('success', content, mergeOptions(overrides));
}

function showNotification(
  type: NotificationType,
  content: NotificationContent,
  options: NotificationOptions
): void {
  const {duration, successColor, alertColor} = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '0';
  container.style.left = '0';
  container.style.transform = `translateY(calc(-100% - ${marginTop}px))`;
  container.style.transitionTimingFunction = 'ease-in-out';
  container.style.transitionDuration = '300ms';
  container.style.transitionProperty = 'transform opacity';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  function handleDone(): void {
    container.style.transform = `translateY(calc(-100% - ${marginTop}px))`;
    container.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(container);
    }, 1000);
  }
  function handleRendered(): void {
    setTimeout(() => {
      container.style.transform = `translateY(0)`;
      container.style.opacity = '1';
    }, 0);
  }
  setTimeout(handleDone, duration);

  createRoot(container).render(
    <Notification
      color={type === 'alert' ? alertColor : successColor}
      content={content}
      // eslint-disable-next-line react/jsx-no-bind
      onRendered={handleRendered}
    />
  );
}

interface NotificationProps {
  color: string;
  content: NotificationContent;
  onRendered: () => void;
}

const Notification: FC<NotificationProps> = props => {
  const {color, content, onRendered} = props;
  useLayoutEffect(() => onRendered(), [onRendered]);

  return (
    <Wrapper data-test-id="notification">
      <Notif $bg={color}>{content}</Notif>
    </Wrapper>
  );
};
Notification.displayName = 'Notification';

const marginTop = 24;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const Notif = styled.div<{$bg: string}>`
  margin-top: ${marginTop}px;
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  max-width: 400px;
  pointer-events: all;
  background-color: ${p => p.$bg};
`;
