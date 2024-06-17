import {ComponentPropsWithoutRef, FC, JSX, useCallback, useEffect} from 'react';
import {createGlobalStyle, styled} from 'styled-components';
import {useLocation} from 'wouter';

import {createDataStore} from '@shared-web/lib/data_store';
import {useGlobalKeyPress} from '@shared-web/lib/use_global_key_press';
import {usePrevious} from '@shared-web/lib/use_previous';
import {useTheme} from '@shared-web/theme/theme_context';

type DivProps = ComponentPropsWithoutRef<'div'>;
type ModalMode = 'slide-down' | 'fade-center' | 'slide-right';

enum ModalShownState {
  // Modal is rendered hidden with animation disabled
  Hidden = 'Hidden',
  // Modal is rendered hidden with animation enabled
  Hidding = 'Hidding',
  // Modal is rendered shown with animation enabled
  Showing = 'Showing',
}

interface ModalState {
  shownState: ModalShownState;
  children?: JSX.Element;
  props?: DivProps;
  mode: ModalMode;
  width?: number;
  noCross?: boolean;
  backdropColor?: string;
  onHide?: () => void;
}

const modalStateStore = createDataStore<ModalState>({
  shownState: ModalShownState.Hidden,
  mode: 'slide-down',
});
const getModalState = modalStateStore.getData;
const setModalState = modalStateStore.setData;
const updateModalState = modalStateStore.updateData;
const useModalState = modalStateStore.useData;

export function showModal(
  options: Omit<ModalState, 'shownState' | 'mode'> & {
    mode?: ModalMode;
    title: string | JSX.Element;
    background?: string;
    color?: string;
  }
): void {
  const {
    title,
    mode = 'slide-down',
    color = '#fff',
    background = 'transparent',
    children,
  } = options;
  showRawModal({
    ...options,
    children: (
      <ModalWrapper $color={color} $background={background}>
        <ModalTitle>{title}</ModalTitle>
        {children}
      </ModalWrapper>
    ),
    mode,
  });
}

export function showRawModal(options: Omit<ModalState, 'shownState'>): void {
  setModalState({...options, shownState: ModalShownState.Hidden});
  const modal = document.getElementById('modal');
  if (!modal) {
    return;
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => setModalState({...options, shownState: ModalShownState.Showing}))
  );
}

export function hideModal(): void {
  updateModalState(state => {
    state.onHide?.();
    return {...state, shownState: ModalShownState.Hidding};
  });

  const modal = document.getElementById('modal');
  if (!modal) {
    return;
  }
  modal.ontransitionend = () => {
    updateModalState(state => ({...state, shownState: ModalShownState.Hidden}));
    modal.ontransitionend = null;
  };
}

export const Modal: FC = () => {
  const {
    shownState,
    mode,
    width,
    noCross,
    backdropColor = '#000000dd',
    children,
    props,
  } = useModalState();
  const handleHideModal = useCallback(() => hideModal(), []);
  const {
    main: {textColor},
  } = useTheme();

  const [location] = useLocation();
  const prevLocation = usePrevious(location);
  useEffect(() => {
    if (location !== prevLocation && getModalState().shownState === ModalShownState.Showing) {
      hideModal();
    }
  }, [location, prevLocation]);

  useGlobalKeyPress(['Escape'], () => {
    hideModal();
  });

  return (
    // eslint-disable-next-line react/forbid-component-props
    <Wrapper id="modal" $shownState={shownState} $mode={mode} $backgroundColor={backdropColor}>
      <Backdrop onClick={handleHideModal} />
      <Dialog $shownState={shownState} $mode={mode} $width={width} {...props}>
        {noCross ? undefined : (
          <CloseButton $color={textColor} onClick={handleHideModal}>
            {/* <ThinCross color={GRAY_1} size={14} /> */}x
          </CloseButton>
        )}
        {children}
      </Dialog>
      <NoScroll $shownState={shownState} />
    </Wrapper>
  );
};
Modal.displayName = 'Modal';

const NoScroll = createGlobalStyle<{$shownState: ModalShownState}>`
  html,
  body {
    overflow-y: ${p => (p.$shownState === ModalShownState.Showing ? 'hidden' : 'auto')};
  }
  #root {
    pointer-events: ${p => (p.$shownState === ModalShownState.Showing ? 'none' : 'all')};
  }
  @media print {
    #root {
      display: none;
    }
  }
`;

const Wrapper = styled.div<{
  $shownState: ModalShownState;
  $mode: ModalMode;
  $backgroundColor: string;
}>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: flex;
  ${({$mode}) =>
    $mode === 'slide-down'
      ? `
        flex-direction: column;
        align-items: center;
      `
      : $mode === 'fade-center'
        ? `
        flex-direction: column;
      `
        : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          $mode === 'slide-right'
          ? `
        flex-direction: row;
        justify-content: flex-end;
      `
          : false}
  overflow: ${({$shownState}) => ($shownState === ModalShownState.Showing ? 'auto' : 'hidden')};
  pointer-events: ${({$shownState}) => ($shownState === ModalShownState.Showing ? 'all' : 'none')};

  ${({$shownState, $backgroundColor}) =>
    $shownState === ModalShownState.Hidden
      ? `
        transition: none;
        background-color: #00000000;
      `
      : $shownState === ModalShownState.Hidding
        ? `
        transition: background-color 300ms ease;
        background-color: #00000000;
      `
        : `
        transition: background-color 300ms ease;
        background-color: ${$backgroundColor};
      `}

  @media print {
    position: initial;
    top: initial;
    right: initial;
    bottom: initial;
    left: initial;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  @media print {
    display: none;
  }
`;

const Dialog = styled.div<{$shownState: ModalShownState; $mode: ModalMode; $width?: number}>`
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  ${({$shownState, $mode}) => {
    if ($shownState === ModalShownState.Hidden) {
      return 'transition: none;';
    }
    let transitionProperty = 'none';
    if ($mode === 'slide-down') {
      transitionProperty = 'margin-top, opacity';
    } else if ($mode === 'fade-center') {
      transitionProperty = 'opacity';
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if ($mode === 'slide-right') {
      transitionProperty = 'margin-right';
    }
    return `
      transition-property: ${transitionProperty};
      transition-duration: 300ms;
      transition-timing-function: ease;
    `;
  }}

  ${({$shownState, $mode, $width}) => {
    if ($mode === 'slide-down') {
      if ($shownState === ModalShownState.Showing) {
        return `
          opacity: 1;
          margin-bottom: 150px;
          margin-top: 150px;
        `;
      }
      return `
          opacity: 0;
          margin-bottom: 150px;
          margin-top: 80px;
        `;
    } else if ($mode === 'fade-center') {
      const opacity = $shownState === ModalShownState.Showing ? 1 : 0;
      return `
        opacity: ${opacity};
        margin: auto;
      `;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if ($mode === 'slide-right') {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const width = $width ?? 600;
      const marginRight = $shownState === ModalShownState.Showing ? 0 : -width;
      return `
        margin-right: ${marginRight}px;
        width: ${width}px;
        overflow: auto;
      `;
    }
    return false;
  }}
`;

const CloseButton = styled.div<{$color: string}>`
  position: absolute;
  padding: 14px;
  top: 0;
  right: 5px;
  cursor: pointer;
  font-family: monospace;
  color: ${p => p.$color}dd;
  &:hover {
    color: ${p => p.$color};
  }
`;

const ModalWrapper = styled.div<{$background: string; $color: string}>`
  padding: 32px 32px 32px 32px;
  color: ${p => p.$color};
  background: ${p => p.$background};
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
`;

const ModalTitle = styled.div`
  font-size: 32px;
  color: #aaaaaa;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
`;
