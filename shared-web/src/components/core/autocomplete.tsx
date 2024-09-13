import {
  ChangeEventHandler,
  cloneElement,
  ComponentPropsWithoutRef,
  Dispatch,
  JSX,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {styled} from 'styled-components';

import {Input} from '@shared-web/components/core/input';
import {debounce} from '@shared-web/lib/debounce';
import {notifyError} from '@shared-web/lib/notification';
import {EmptyFragment} from '@shared-web/lib/react';
import {cssPx, optionalPx, optionalRaw} from '@shared-web/lib/styled_utils';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

const DEFAULT_ITEM_LOOKUP_DEBOUNCE_MS = 500;

interface AutocompleteProps<Item> {
  item?: Item;
  itemToInputString?: (item: Item) => string;
  syncState?: Dispatch<Item | undefined>;
  lookupItem?: (input: string) => Promise<Item[]>;
  itemElement?: (item: Item, highlighted: boolean) => JSX.Element;
  itemToKey?: (item: Item) => string;

  lookupInitial?: () => Promise<Item[]>;
  debounceMs?: number;
  minChar?: number;
  label?: string | JSX.Element;
  overrides?: Partial<FrontendTheme['input']>;
  autoFocus?: boolean;
  className?: string;
  maxHeight?: string | number;
  disabled?: boolean;
  inputProps?: Omit<ComponentPropsWithoutRef<'input'>, 'style' | 'value' | 'children'>;
}
// eslint-disable-next-line react/function-component-definition
export function Autocomplete<Item>(props: AutocompleteProps<Item>): JSX.Element {
  const {
    item,
    itemToInputString = String,
    itemToKey,
    syncState,
    debounceMs = DEFAULT_ITEM_LOOKUP_DEBOUNCE_MS,
    lookupItem,
    lookupInitial,
    minChar,
    label,
    overrides,
    autoFocus,
    itemElement = (item, highlighted) => (
      <DefaultResult $highlighted={highlighted}>{itemToInputString(item)}</DefaultResult>
    ),
    className,
    maxHeight,
    disabled,
    inputProps = {},
  } = props;
  const {input} = useTheme();

  const {focusBorderColor, borderRadius, focusBorderWidth, focusOutlineWidth, focusOutlineColor} = {
    ...input,
    ...overrides,
  };
  const [resultsOffset, setResultsOffset] = useState(0);

  const [initialItems, setInitialItems] = useState<Item[] | undefined>();
  useLayoutEffect(() => {
    if (lookupInitial) {
      lookupInitial().then(setInitialItems).catch(notifyError);
    }
  }, [lookupInitial]);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Compute the `resultsOffset` which should be the height of the elements before the results div
  useLayoutEffect(() => {
    if (!wrapperRef.current) {
      return;
    }
    const {children} = wrapperRef.current;
    let heightSum = 0;
    for (let i = 0; i < children.length; i++) {
      const element = children.item(i);
      if (!element) {
        continue;
      }
      if (element === resultsRef.current) {
        break;
      }
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const cssValue = (css: string): string | undefined =>
        document.defaultView?.getComputedStyle(element).getPropertyValue(css);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const cssPx = (css: string): number => {
        const computed = cssValue(css);
        const pxSuffix = 'px';
        if (computed?.endsWith(pxSuffix)) {
          const pxValue = computed.slice(0, -pxSuffix.length);
          const pxInt = parseFloat(pxValue);
          return isNaN(pxInt) ? 0 : pxInt;
        }
        return 0;
      };
      if (['relative', 'static'].includes(cssValue('position') ?? '')) {
        heightSum +=
          element.getBoundingClientRect().height + cssPx('margin-top') + cssPx('margin-bottom');
      }
      setResultsOffset(heightSum);
    }
  }, []);

  const [inputText, setInputText] = useState(item !== undefined ? itemToInputString(item) : '');
  const [lookupResults, setLookupResults] = useState<Item[] | undefined>();
  const [hideRes, setHideRes] = useState(!autoFocus);
  const [highlightedResult, setHighlightedResult] = useState(0);
  const isHoveringResults = useRef(false);

  useEffect(() => {
    setInputText(item !== undefined ? itemToInputString(item) : '');
  }, [item, itemToInputString]);

  const items = lookupResults ?? initialItems;

  const debouncedItemLookup = useMemo(
    () =>
      debounce((text: string, useInitialIfEmpty?: boolean): void => {
        if (lookupItem !== undefined) {
          lookupItem(text)
            .then(res => {
              setLookupResults(useInitialIfEmpty && res.length === 0 ? undefined : res);
              setHighlightedResult(0);
            })
            .catch(notifyError);
        }
      }, debounceMs),
    [debounceMs, lookupItem]
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    evt => {
      const text = evt.currentTarget.value;
      setInputText(text);
      syncState?.(undefined);
      if (text.length === 0) {
        setLookupResults(undefined);
        return;
      }
      if (minChar === undefined || text.length >= minChar) {
        debouncedItemLookup(text);
      }
    },
    [debouncedItemLookup, minChar, syncState]
  );

  const disableNextFocus = useRef(false);
  const handleResultSelect = useCallback(
    (item: Item) => {
      setInputText(itemToInputString(item));
      setLookupResults(undefined);
      setHideRes(true);
      syncState?.(item);
      isHoveringResults.current = false;
      disableNextFocus.current = true;
      inputRef.current?.focus();
    },
    [itemToInputString, syncState]
  );

  const handleResultClick = useCallback<MouseEventHandler>(
    e => {
      const index = parseFloat(e.currentTarget.getAttribute('data-index') ?? '');
      if (isNaN(index)) {
        return;
      }
      const item = items?.[index];
      if (item === undefined) {
        return;
      }
      handleResultSelect(item);
    },
    [handleResultSelect, items]
  );

  const handleFocus = useCallback<ChangeEventHandler<HTMLInputElement>>(
    evt => {
      if (disableNextFocus.current) {
        disableNextFocus.current = false;
        return;
      }
      setHideRes(false);
      const text = evt.currentTarget.value;
      if (text.length === 0) {
        setLookupResults(undefined);
        return;
      }
      if (minChar === undefined || text.length >= minChar) {
        debouncedItemLookup(text, true);
      }
    },
    [debouncedItemLookup, minChar]
  );

  const handleBlur = useCallback(() => {
    if (!isHoveringResults.current) {
      setHideRes(true);
    }
  }, []);
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    e => {
      if (items === undefined) {
        return;
      }
      if (e.key === 'Enter') {
        const result = items[highlightedResult];
        if (result !== undefined) {
          e.preventDefault();
          handleResultSelect(result);
        }
        // Stop propagation when pressing "Enter" to prevent auto submitting forms
        e.stopPropagation();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedResult(current => (current + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedResult(current => (current - 1) % items.length);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setHideRes(true);
      }
    },
    [handleResultSelect, highlightedResult, items]
  );

  const handleMouseEnter = useCallback(() => {
    isHoveringResults.current = true;
  }, []);
  const handleMouseLeave = useCallback(() => {
    isHoveringResults.current = false;
  }, []);

  const showRes = !hideRes && items !== undefined;

  return (
    // eslint-disable-next-line react/forbid-component-props
    <Wrapper ref={wrapperRef} className={className}>
      <StyledInput
        ref={inputRef}
        value={inputText}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        overrides={overrides}
        label={label}
        autoFocus={autoFocus}
        $resultsShown={showRes}
        disabled={disabled}
        {...inputProps}
      />
      {showRes ? (
        <Results
          ref={resultsRef}
          $borderColor={focusBorderColor}
          $borderWidth={focusBorderWidth}
          $borderRadius={borderRadius}
          $focusOutlineColor={focusOutlineColor}
          $focusOutlineWidth={focusOutlineWidth}
          $offset={resultsOffset}
          $maxHeight={maxHeight}
        >
          {items.map((p, i) =>
            cloneElement(itemElement(p, highlightedResult === i), {
              'data-index': i,
              onClick: handleResultClick,
              onMouseEnter: handleMouseEnter,
              onMouseLeave: handleMouseLeave,
              key: (itemToKey ?? itemToInputString)(p),
            })
          )}
        </Results>
      ) : (
        EmptyFragment
      )}
    </Wrapper>
  );
}
Autocomplete.displayName = 'Autocomplete';

const Wrapper = styled.div`
  position: relative;
`;

const StyledInput = styled(Input)<{$resultsShown: boolean}>`
  width: 100%;
  ${p =>
    p.$resultsShown
      ? `
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
              border-bottom: none;
            `
      : ``}
`;

const Results = styled.div<{
  $borderColor?: string;
  $borderWidth?: number;
  $borderRadius?: number;
  $focusOutlineWidth?: number;
  $focusOutlineColor?: string;
  $offset: number;
  $maxHeight?: number | string;
}>`
  position: absolute;
  top: ${p => p.$offset}px;
  right: 0;
  left: 0;
  overflow: auto;
  z-index: 5;
  ${p => optionalRaw(p.$borderWidth, v => `border: solid ${cssPx(v)} ${p.$borderColor};`)}
  border-top-width: 0;
  ${p => optionalPx('border-bottom-left-radius', p.$borderRadius)}
  ${p => optionalPx('border-bottom-right-radius', p.$borderRadius)}
      ${p => optionalPx('max-height', p.$maxHeight)}
        ${p =>
    optionalRaw(
      p.$focusOutlineWidth,
      v => `box-shadow: 0 0 0 ${cssPx(v)} ${p.$focusOutlineColor ?? 'transparent'};`
    )}
`;

const DefaultResult = styled.div<{$highlighted?: boolean}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px;
  cursor: pointer;
  ${p => (p.$highlighted ? `background-color: #f6f6f6;` : ``)};
  &:hover {
    background-color: #f6f6f6;
  }
`;
