import {
  ChangeEventHandler,
  Dispatch,
  FC,
  JSX,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {styled} from 'styled-components';

import {startOfLocalDay} from '@shared/lib/date_utils';
import {localeDate, localeDateString} from '@shared/lib/time_format';

import {Calendar} from '@shared-web/components/core/calendar';
import {Input} from '@shared-web/components/core/input';
import {TimePicker} from '@shared-web/components/core/time_picker';
import {EmptyFragment, NULL_REF} from '@shared-web/lib/react';
import {useClickOutside} from '@shared-web/lib/use_click_outside';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

interface DateTimeInputProps {
  ts?: number;
  minTs?: number;
  maxTs?: number;
  syncState?: Dispatch<number>;
  label?: string | JSX.Element;
  overrides?: Partial<FrontendTheme['input']>;
  autoFocus?: boolean;
}

function stringToTs(str: string): number | undefined {
  const ts = localeDate(str).getTime();
  return isNaN(ts) ? undefined : ts;
}
function tsToString(ts: number | undefined): string {
  return ts === undefined ? '' : localeDateString(new Date(ts));
}

const SPACE_BETWEEN_INPUT_AND_CALENDAR = 8;

export const DateTimeInput: FC<DateTimeInputProps> = props => {
  const {ts, minTs, maxTs, syncState, label, overrides, autoFocus} = props;
  const {
    main: {accentColor},
  } = useTheme();

  const inputRef = useRef<HTMLInputElement>(NULL_REF);
  const wrapperRef = useRef<HTMLDivElement>(NULL_REF);

  const [inputText, setInputText] = useState(ts !== undefined ? tsToString(ts) : '');
  const [calendarShown, setCalendarShown] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [calendarOffset, setCalendarOffset] = useState(0);
  const isHoveringCalendar = useRef(false);

  useEffect(() => {
    if (ts !== undefined) {
      setCalendarDate(new Date(ts));
    }
  }, [ts]);

  const bail = useCallback(() => {
    setCalendarShown(false);
    setSelectedDay(undefined);
    inputRef.current?.blur();
  }, []);
  useClickOutside(wrapperRef, bail);

  // Compute the `calendarOffset` which should be the height of the elements before the calendar div
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
      setCalendarOffset(heightSum + SPACE_BETWEEN_INPUT_AND_CALENDAR);
    }
  }, []);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    e => {
      const text = e.currentTarget.value;
      setInputText(text);
      const newTs = stringToTs(text);
      if (newTs !== undefined) {
        syncState?.(newTs);
      }
    },
    [syncState]
  );

  const handlePreviousMonthClick = useCallback(() => {
    setCalendarDate(currentDate => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }, []);
  const handleNextMonthClick = useCallback(() => {
    setCalendarDate(currentDate => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }, []);

  const handleDayClick = useCallback<MouseEventHandler>(evt => {
    const date = new Date(parseFloat(evt.currentTarget.getAttribute('data-ts') ?? ''));
    if (isNaN(date.getTime())) {
      return;
    }
    setTimeout(() => setSelectedDay(date));
  }, []);

  const handleTimeClick = useCallback(
    (hour: number, minute: number) => {
      if (!selectedDay) {
        return;
      }
      const date = new Date(selectedDay.getTime());
      date.setHours(hour);
      date.setMinutes(minute);
      const ts = date.getTime();
      setInputText(tsToString(ts));
      setCalendarShown(false);
      syncState?.(ts);
    },
    [selectedDay, syncState]
  );

  const handleFocus = useCallback(() => setCalendarShown(true), []);
  const handleBlur = useCallback(() => {
    if (!isHoveringCalendar.current) {
      setCalendarShown(false);
      if (ts !== undefined) {
        setInputText(tsToString(ts));
      }
    }
  }, [ts]);

  const handleMouseEnter = useCallback(() => {
    isHoveringCalendar.current = true;
  }, []);
  const handleMouseLeave = useCallback(() => {
    isHoveringCalendar.current = false;
  }, []);

  const handleKeyDown = useCallback<KeyboardEventHandler>(
    e => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        bail();
      }
    },
    [bail]
  );

  const renderCell = useCallback(
    (date: Date) => {
      const dateTs = date.getTime();
      const today = dateTs === startOfLocalDay().getTime();
      const disabled =
        (minTs !== undefined && dateTs < minTs) || (maxTs !== undefined && dateTs > maxTs);
      return (
        <CalendarCell
          key={date.getTime()}
          data-ts={date.getTime()}
          onClick={handleDayClick}
          $disabled={disabled}
          $selected={ts !== undefined && startOfLocalDay(new Date(ts)).getTime() === dateTs}
          $accentColor={accentColor}
        >
          <CalendarCellDay>
            <CalendarCellDayNumber $today={today}>{date.getDate()}</CalendarCellDayNumber>
          </CalendarCellDay>
        </CalendarCell>
      );
    },
    [accentColor, handleDayClick, maxTs, minTs, ts]
  );

  return (
    <Wrapper ref={wrapperRef}>
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
        $calendarShown={calendarShown}
      />
      {calendarShown ? (
        <Popup
          $offset={calendarOffset}
          $accentColor={accentColor}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {selectedDay ? (
            <TimePicker
              header={selectedDay.toLocaleDateString(undefined, {dateStyle: 'full'})}
              onClick={handleTimeClick}
            />
          ) : (
            <Calendar
              month={calendarDate.getMonth()}
              year={calendarDate.getFullYear()}
              renderCell={renderCell}
              onPreviousClick={handlePreviousMonthClick}
              onNextClick={handleNextMonthClick}
            />
          )}
        </Popup>
      ) : (
        EmptyFragment
      )}
    </Wrapper>
  );
};
DateTimeInput.displayName = 'DateTimeInput';

const Wrapper = styled.div`
  position: relative;
`;

const StyledInput = styled(Input)<{$calendarShown: boolean}>`
  width: 100%;
`;

const Popup = styled.div<{
  $accentColor: string;
  $offset: number;
}>`
  position: absolute;
  top: ${p => p.$offset}px;
  left: 0;
  overflow: auto;
  z-index: 5;

  padding: 20px 24px 24px 24px;
  border: solid 2px ${p => p.$accentColor};
  border-radius: 16px;
  box-shadow: 0 0 20px -10px #00000036;
  background-color: #ffffff;
`;

const CalendarCell = styled.div<{
  $disabled: boolean;
  $selected: boolean;
  $accentColor: string;
}>`
  display: flex;
  flex-direction: column;
  width: 48px;
  height: 52px;
  border-radius: 6px;
  margin: 3px;
  background: #00000006;
  color: ${p => (p.$selected ? p.$accentColor : '#00000060')};
  border: solid 2px ${p => (p.$selected ? p.$accentColor : '#00000010')};
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  pointer-events: ${p => (p.$disabled ? 'none' : 'all')};
  opacity: ${p => (p.$disabled ? '0.5' : '1')};
  &:hover {
    border: solid 2px ${p => p.$accentColor};
    color: ${p => p.$accentColor};
  }
`;

const CalendarCellDay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`;
const CalendarCellDayNumber = styled.div<{
  $today: boolean;
}>`
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  ${p => (p.$today ? 'background-color: #00000010;' : false)};
`;
