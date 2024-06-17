import {FC, JSX} from 'react';
import {styled} from 'styled-components';

import {DAYS_IN_WEEK} from '@shared/lib/date_utils';

import {SvgIcon} from '@shared-web/components/core/svg_icon';
import {chevronLeftIcon} from '@shared-web/components/icons/chevron_left_icon';
import {chevronRightIcon} from '@shared-web/components/icons/chevron_right_icon';
import {EmptyFragment} from '@shared-web/lib/react';
import {optional, optionalRaw} from '@shared-web/lib/styled_utils';

interface CalendarProps {
  month: number;
  year: number;
  renderCell: (date: Date) => JSX.Element;
  onPreviousClick: () => void;
  onNextClick: () => void;
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
  const {renderCell, year, month, onPreviousClick, onNextClick} = props;

  const handlePreviousClick = onPreviousClick;
  const handleNextClick = onNextClick;

  const weeks = calendarWeeks({month, year});
  const [firstWeek] = weeks;
  if (!firstWeek) {
    return EmptyFragment;
  }

  return (
    <CalendarTable>
      <CalendarHeader $textColor="#00000070">
        <tr>
          <td colSpan={firstWeek.length}>
            <MonthYear>
              <SvgWrapper onClick={handlePreviousClick}>
                <SvgIcon icon={chevronLeftIcon} color="#00000070" size={13} />
              </SvgWrapper>
              <CalendarHeaderValue>
                {new Date(year, month).toLocaleString(undefined, {month: 'long', year: 'numeric'})}
              </CalendarHeaderValue>
              <SvgWrapper onClick={handleNextClick}>
                <SvgIcon icon={chevronRightIcon} color="#00000070" size={13} />
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
              <CalendarCell key={date.getTime()}>{renderCell(date)}</CalendarCell>
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

const CalendarHeader = styled.thead<{
  $backgroundColor?: string;
  $textColor?: string;
  $borderColor?: string;
}>`
  ${p => optional('background-color', p.$backgroundColor)}
  ${p => optional('color', p.$textColor)}
  ${p => optionalRaw(p.$borderColor, v => `border: solid 2px ${v};`)}
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

const SvgWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 36px;
  cursor: pointer;
  &:hover {
    background-color: #00000008;
  }
`;

const CalendarHeaderValue = styled.div`
  text-transform: capitalize;
  text-align: center;
  padding: 6px 0;
`;

const CalendarCell = styled.td<{$borderColor?: string}>`
  width: ${100 / DAYS_IN_WEEK}%;
  padding: 0;
  vertical-align: top;
  ${p => optionalRaw(p.$borderColor, v => `border: solid 2px ${v};`)}
`;
