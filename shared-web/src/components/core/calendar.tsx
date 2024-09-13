import {FC, JSX, MouseEventHandler, useCallback} from 'react';
import {styled} from 'styled-components';

import {DAYS_IN_WEEK, startOfLocalDay} from '@shared/lib/date_utils';

import {SvgIcon} from '@shared-web/components/core/svg_icon';
import {chevronLeftIcon} from '@shared-web/components/icons/chevron_left_icon';
import {chevronRightIcon} from '@shared-web/components/icons/chevron_right_icon';
import {EmptyFragment} from '@shared-web/lib/react';
import {optional} from '@shared-web/lib/styled_utils';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

interface CalendarProps {
  month: number;
  year: number;
  isDisabled?: (date: Date) => boolean;
  renderCell?: (date: Date) => JSX.Element;
  onPreviousClick?: () => void;
  onNextClick?: () => void;
  onDayClick?: (date: Date) => void;
}

const MONDAY = 1;
const firstDayOfTheWeek = MONDAY;

export function calendarWeeks(opts: {month: number; year: number}): Date[][] {
  const {month, year} = opts;

  // Compute start
  const startOfMonth = new Date(year, month, 1);
  const startOfMonthDay = startOfMonth.getDay();

  const calendarStart = new Date(startOfMonth);
  const dateStartDelta = (startOfMonthDay + DAYS_IN_WEEK - firstDayOfTheWeek) % DAYS_IN_WEEK;
  calendarStart.setDate(calendarStart.getDate() - dateStartDelta);

  // Compute weeks
  const weeks: Date[][] = [];
  const endOfMonth = new Date(year, month + 1, 0);
  let current = calendarStart;
  while (current.getTime() <= endOfMonth.getTime()) {
    const week: Date[] = [];
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      week.push(current);
      const date = new Date(current);
      date.setDate(date.getDate() + 1);
      current = date;
    }
    weeks.push(week);
  }

  return weeks;
}

export const Calendar: FC<CalendarProps> = props => {
  const {
    renderCell: renderCellProp,
    year,
    month,
    onPreviousClick,
    onNextClick,
    onDayClick,
    isDisabled,
  } = props;
  const {main} = useTheme();

  const handlePreviousClick = onPreviousClick;
  const handleNextClick = onNextClick;

  const handleDayClick = useCallback<MouseEventHandler>(
    evt => {
      const date = new Date(parseFloat(evt.currentTarget.getAttribute('data-ts') ?? ''));
      if (isNaN(date.getTime())) {
        return;
      }
      onDayClick?.(date);
    },
    [onDayClick]
  );

  const renderCell = useCallback(
    (date: Date): JSX.Element => {
      if (renderCellProp) {
        return renderCellProp(date);
      }
      const today = startOfLocalDay();
      const day = startOfLocalDay(date);
      const isToday = today.getTime() === day.getTime();
      const disabled = isDisabled ? isDisabled(date) : false;

      return (
        <CalendarCell $theme={main} $disabled={disabled} $highlighted={false}>
          <CalendarCellDay>
            <CalendarCellDayNumber $today={isToday} $theme={main}>
              {date.getDate()}
            </CalendarCellDayNumber>
          </CalendarCellDay>
        </CalendarCell>
      );
    },
    [isDisabled, main, renderCellProp]
  );

  const weeks = calendarWeeks({month, year});
  const [firstWeek] = weeks;
  if (!firstWeek) {
    return EmptyFragment;
  }

  return (
    <CalendarTable>
      <CalendarHeader $theme={main}>
        <tr>
          <td colSpan={firstWeek.length}>
            <MonthYear>
              <SvgWrapper $theme={main} onClick={handlePreviousClick}>
                <SvgIcon icon={chevronLeftIcon} color={main.textColor} size={13} />
              </SvgWrapper>
              <CalendarHeaderValue>
                {new Date(year, month).toLocaleString(undefined, {month: 'long', year: 'numeric'})}
              </CalendarHeaderValue>
              <SvgWrapper $theme={main} onClick={handleNextClick}>
                <SvgIcon icon={chevronRightIcon} color={main.textColor} size={13} />
              </SvgWrapper>
            </MonthYear>
          </td>
        </tr>
        <tr>
          {firstWeek.map(date => (
            <td key={date.getTime()}>
              <CalendarHeaderValue>
                {date.toLocaleString(undefined, {weekday: 'short'})}
              </CalendarHeaderValue>
            </td>
          ))}
        </tr>
      </CalendarHeader>
      <tbody>
        {weeks.map(week => (
          <tr key={`week-${week[0]?.getTime()}`}>
            {week.map(date => (
              <CalendarCellWrapper
                key={date.getTime()}
                data-ts={date.getTime()}
                onClick={handleDayClick}
              >
                {renderCell(date)}
              </CalendarCellWrapper>
            ))}
          </tr>
        ))}
      </tbody>
    </CalendarTable>
  );
};
Calendar.displayName = 'Calendar';

const CalendarTable = styled.table`
  border-collapse: collapse;
  table-layout: fixed;
`;

const CalendarHeader = styled.thead<{$theme: FrontendTheme['main']}>`
  ${p => optional('background-color', p.$theme.backgroundColor)}
  ${p => optional('color', p.$theme.textColor)}
  user-select: none;
`;

const MonthYear = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 19px;
  svg {
    cursor: pointer;
  }
`;

const SvgWrapper = styled.div<{$theme: FrontendTheme['main']}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 36px;
  cursor: pointer;
  &:hover {
    background-color: ${p => p.$theme.highlight1};
  }
`;

const CalendarHeaderValue = styled.div`
  text-transform: capitalize;
  text-align: center;
  padding: 6px 0;
`;

const CalendarCellWrapper = styled.td`
  width: ${100 / DAYS_IN_WEEK}%;
`;

const CalendarCell = styled.div<{
  $disabled: boolean;
  $highlighted: boolean;
  $theme: FrontendTheme['main'];
}>`
  display: flex;
  flex-direction: column;
  width: 48px;
  height: 52px;
  border-radius: 6px;
  margin: 3px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  pointer-events: ${p => (p.$disabled ? 'none' : 'inherit')};
  background: ${p => p.$theme.highlight1};
  border: solid 2px ${p => (p.$highlighted ? p.$theme.accentColor : p.$theme.highlight2)};
  ${p =>
    !p.$disabled &&
    `&:hover {
        border: solid 2px ${p.$theme.accentColor};
        color: ${p.$theme.accentColor};
    }`}
`;

const CalendarCellDay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`;
const CalendarCellDayNumber = styled.div<{
  $today: boolean;
  $theme: FrontendTheme['main'];
}>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  ${p =>
    p.$today
      ? `background-color: ${p.$theme.accentColor}aa; color: ${p.$theme.accentTextColor};`
      : `background-color: ${p.$theme.highlight2}; color: ${p.$theme.textColor};`}
`;
