import {padNumber} from '@shared/lib/format_utils';
import {asNumber, neverHappens, removeUndefined} from '@shared/lib/type_utils';

export const DAYS_IN_WEEK = 7;
export type S3PrefixPeriod = 'year' | 'month' | 'day' | 'hour' | 'minute';

//
// S3 prefix from dates
//

export function yearDatePrefix(date: Date): string {
  return String(date.getUTCFullYear());
}
export function monthDatePrefix(date: Date): string {
  return `${yearDatePrefix(date)}/${padNumber(date.getUTCMonth() + 1, 2)}`;
}
export function dayDatePrefix(date: Date): string {
  return `${monthDatePrefix(date)}/${padNumber(date.getUTCDate(), 2)}`;
}
export function hourDatePrefix(date: Date): string {
  return `${dayDatePrefix(date)}/${padNumber(date.getUTCHours(), 2)}`;
}
export function minuteDatePrefix(date: Date): string {
  return `${hourDatePrefix(date)}/${padNumber(date.getUTCMinutes(), 2)}`;
}

export function periodDatePrefix(date: Date, period: S3PrefixPeriod): string {
  if (period === 'year') {
    return yearDatePrefix(date);
  } else if (period === 'month') {
    return monthDatePrefix(date);
  } else if (period === 'day') {
    return dayDatePrefix(date);
  } else if (period === 'hour') {
    return hourDatePrefix(date);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return minuteDatePrefix(date);
  }
  neverHappens(period, `Invalid period value "${period}"`);
}

export function minuteDateFromPrefix(prefix: string): Date {
  // Convert all the date components to numbers
  const dateComponents = removeUndefined(prefix.split('/').map(d => asNumber(d)));
  // Expect partitioning by minutes (yyyy/MM/dd/hh/mm)
  const [years, months, days, hours, minutes] = dateComponents;
  if (
    years === undefined ||
    months === undefined ||
    days === undefined ||
    hours === undefined ||
    minutes === undefined
  ) {
    throw new Error(`Expected a minute partitionning in "${prefix}"`);
  }
  // Convert to UTC date
  const date = new Date(Date.UTC(years, months - 1, days, hours, minutes));
  return date;
}

export function hourDateFromPrefix(prefix: string): Date {
  // Convert all the date components to numbers
  const dateComponents = removeUndefined(prefix.split('/').map(d => asNumber(d)));
  // Expect partitioning by hours (yyyy/MM/dd/hh)
  const [years, months, days, hours] = dateComponents;
  if (years === undefined || months === undefined || days === undefined || hours === undefined) {
    throw new Error(`Expected an hour partitionning in "${prefix}"`);
  }
  // Convert to UTC date
  const date = new Date(Date.UTC(years, months - 1, days, hours));
  return date;
}

export function dayDateFromPrefix(prefix: string): Date {
  // Convert all the date components to numbers
  const dateComponents = removeUndefined(prefix.split('/').map(d => asNumber(d)));
  // Expect partitioning by days (yyyy/MM/dd)
  const [years, months, days] = dateComponents;
  if (years === undefined || months === undefined || days === undefined) {
    throw new Error(`Expected a day partitionning in "${prefix}"`);
  }
  // Convert to UTC date
  const date = new Date(Date.UTC(years, months - 1, days));
  return date;
}

export function monthDateFromPrefix(prefix: string): Date {
  // Convert all the date components to numbers
  const dateComponents = removeUndefined(prefix.split('/').map(d => asNumber(d)));
  // Expect partitioning by months (yyyy/MM)
  const [years, months] = dateComponents;
  if (years === undefined || months === undefined) {
    throw new Error(`Expected a month partitionning in "${prefix}"`);
  }
  // Convert to UTC date
  const date = new Date(Date.UTC(years, months - 1));
  return date;
}

export function yearDateFromPrefix(prefix: string): Date {
  // Convert all the date components to numbers
  const dateComponents = removeUndefined(prefix.split('/').map(d => asNumber(d)));
  // Expect partitioning by years (yyyy/MM)
  const [years, months] = dateComponents;
  if (years === undefined || months === undefined) {
    throw new Error(`Expected a year partitionning in "${prefix}"`);
  }
  // Convert to UTC date
  const date = new Date(Date.UTC(years, 0));
  return date;
}

export function periodDateFromPrefix(prefix: string): {date: Date; period: S3PrefixPeriod} {
  // Convert all the date components to numbers
  const dateComponents = removeUndefined(prefix.split('/').map(d => asNumber(d)));
  const [years, months, days, hours, minutes] = dateComponents;
  if (years === undefined) {
    throw new Error('Cannot extract date from empty S3 prefix');
  } else if (months === undefined) {
    return {date: new Date(Date.UTC(years, 0)), period: 'year'};
  } else if (days === undefined) {
    return {date: new Date(Date.UTC(years, months)), period: 'month'};
  } else if (hours === undefined) {
    return {date: new Date(Date.UTC(years, months, days)), period: 'day'};
  } else if (minutes === undefined) {
    return {date: new Date(Date.UTC(years, months, days, hours)), period: 'hour'};
  }
  return {date: new Date(Date.UTC(years, months, days, hours, minutes)), period: 'minute'};
}

//
// Start of time period (UTC and Local)
//

export function startOfUtcTenSeconds(date?: Date, offset = 0): Date {
  const newDate = new Date(date?.getTime() ?? Date.now());
  newDate.setUTCMilliseconds(0);
  newDate.setUTCSeconds(newDate.getUTCSeconds() - (newDate.getUTCSeconds() % 10) + offset * 10);
  return newDate;
}

export function startOfLocalTenSeconds(date?: Date, offset = 0): Date {
  const newDate = new Date(date?.getTime() ?? Date.now());
  newDate.setMilliseconds(0);
  newDate.setSeconds(newDate.getSeconds() - (newDate.getSeconds() % 10) + offset * 10);
  return newDate;
}

export function startOfUtcMinute(date?: Date, offset = 0): Date {
  const newDate = new Date(date?.getTime() ?? Date.now());
  newDate.setUTCSeconds(0);
  newDate.setUTCMilliseconds(0);
  if (offset !== 0) {
    newDate.setUTCMinutes(newDate.getUTCMinutes() + offset);
  }
  return newDate;
}

export function startOfLocalMinute(date?: Date, offset = 0): Date {
  const newDate = new Date(date?.getTime() ?? Date.now());
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  if (offset !== 0) {
    newDate.setMinutes(newDate.getMinutes() + offset);
  }
  return newDate;
}

export function startOfUtcHour(date?: Date, offset = 0): Date {
  const newDate = startOfUtcMinute(date);
  newDate.setUTCMinutes(0);
  if (offset !== 0) {
    newDate.setUTCHours(newDate.getUTCHours() + offset);
  }
  return newDate;
}

export function startOfLocalHour(date?: Date, offset = 0): Date {
  const newDate = startOfLocalMinute(date);
  newDate.setMinutes(0);
  if (offset !== 0) {
    newDate.setHours(newDate.getHours() + offset);
  }
  return newDate;
}

export function startOfUtcDay(date?: Date, offset = 0): Date {
  const newDate = startOfUtcHour(date);
  newDate.setUTCHours(0);
  if (offset !== 0) {
    newDate.setUTCDate(newDate.getUTCDate() + offset);
  }
  return newDate;
}

export function startOfLocalDay(date?: Date, offset = 0): Date {
  const newDate = startOfLocalHour(date);
  newDate.setHours(0);
  if (offset !== 0) {
    newDate.setDate(newDate.getDate() + offset);
  }
  return newDate;
}

export function startOfFranceDay(): Date {
  return franceToUtc(startOfUtcDay(utcToFrance(new Date())));
}

export function startOfUtcWeek(date?: Date, offset = 0): Date {
  const newDate = startOfUtcDay(date);
  const dayOfWeek = (newDate.getUTCDay() - 1 + DAYS_IN_WEEK) % DAYS_IN_WEEK; // Monday = 0, Sunday = 6
  newDate.setUTCDate(newDate.getUTCDate() - dayOfWeek + offset * DAYS_IN_WEEK);
  return newDate;
}

export function startOfLocalWeek(date?: Date, offset = 0): Date {
  const newDate = startOfLocalDay(date);
  const dayOfWeek = (newDate.getDay() - 1 + DAYS_IN_WEEK) % DAYS_IN_WEEK; // Monday = 0, Sunday = 6
  newDate.setDate(newDate.getDate() - dayOfWeek + offset * DAYS_IN_WEEK);
  return newDate;
}

export function startOfFranceWeek(): Date {
  return franceToUtc(startOfUtcWeek(utcToFrance(new Date())));
}

export function endOfFranceWeek(): Date {
  return franceToUtc(endOfUtcWeek(utcToFrance(new Date())));
}

export function startOfUtcMonth(date?: Date, offset = 0): Date {
  const newDate = startOfUtcDay(date);
  newDate.setUTCDate(1);
  if (offset !== 0) {
    newDate.setUTCMonth(newDate.getUTCMonth() + offset);
  }
  return newDate;
}

export function startOfLocalMonth(date?: Date, offset = 0): Date {
  const newDate = startOfLocalDay(date);
  newDate.setDate(1);
  if (offset !== 0) {
    newDate.setMonth(newDate.getMonth() + offset);
  }
  return newDate;
}

export function startOfUtcYear(date?: Date, offset = 0): Date {
  const newDate = startOfUtcMonth(date);
  newDate.setUTCMonth(0);
  if (offset !== 0) {
    newDate.setUTCFullYear(newDate.getUTCFullYear() + offset);
  }
  return newDate;
}

export function startOfLocalYear(date?: Date, offset = 0): Date {
  const newDate = startOfLocalMonth(date);
  newDate.setMonth(0);
  if (offset !== 0) {
    newDate.setFullYear(newDate.getFullYear() + offset);
  }
  return newDate;
}

export function startOfUtcYesterday(date?: Date): Date {
  const newDate = startOfUtcDay(date);
  newDate.setUTCDate(newDate.getUTCDate() - 1);
  return newDate;
}

export function startOfLocalYesterday(date?: Date): Date {
  const newDate = startOfLocalDay(date);
  newDate.setDate(newDate.getDate() - 1);
  return newDate;
}

export function startOfUtcPeriod(
  date: Date,
  period: S3PrefixPeriod | 'week',
  offset = 0 // offset the final result by `offset` periods
): number {
  if (period === 'year') {
    return startOfUtcYear(date, offset).getTime();
  } else if (period === 'month') {
    return startOfUtcMonth(date, offset).getTime();
  } else if (period === 'week') {
    return startOfUtcWeek(date, offset).getTime();
  } else if (period === 'day') {
    return startOfUtcDay(date, offset).getTime();
  } else if (period === 'hour') {
    return startOfUtcHour(date, offset).getTime();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return startOfUtcMinute(date, offset).getTime();
  }
  neverHappens(period, `Invalid period value "${period}"`);
}

export function startOfLocalPeriod(
  date: Date,
  period: S3PrefixPeriod | 'week',
  offset = 0 // offset the final result by `offset` periods
): number {
  if (period === 'year') {
    return startOfLocalYear(date, offset).getTime();
  } else if (period === 'month') {
    return startOfLocalMonth(date, offset).getTime();
  } else if (period === 'week') {
    return startOfLocalWeek(date, offset).getTime();
  } else if (period === 'day') {
    return startOfLocalDay(date, offset).getTime();
  } else if (period === 'hour') {
    return startOfLocalHour(date, offset).getTime();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return startOfLocalMinute(date, offset).getTime();
  }
  neverHappens(period, `Invalid period value "${period}"`);
}

//
// End of time period
//

export function endOfUtcMinute(date?: Date): Date {
  const newDate = startOfNextUtcMinute(date);
  newDate.setUTCMilliseconds(-1);
  return newDate;
}

export function endOfLocalMinute(date?: Date): Date {
  const newDate = startOfNextLocalMinute(date);
  newDate.setMilliseconds(-1);
  return newDate;
}

export function endOfUtcHour(date?: Date): Date {
  const newDate = startOfNextUtcHour(date);
  newDate.setUTCMilliseconds(-1);
  return newDate;
}

export function endOfLocalHour(date?: Date): Date {
  const newDate = startOfNextLocalHour(date);
  newDate.setMilliseconds(-1);
  return newDate;
}

export function endOfUtcDay(date?: Date): Date {
  const newDate = startOfNextUtcDay(date);
  newDate.setUTCMilliseconds(-1);
  return newDate;
}

export function endOfLocalDay(date?: Date): Date {
  const newDate = startOfNextLocalDay(date);
  newDate.setMilliseconds(-1);
  return newDate;
}

export function endOfUtcWeek(date?: Date): Date {
  const newDate = startOfNextUtcWeek(date);
  newDate.setUTCMilliseconds(-1);
  return newDate;
}

export function endOfLocalWeek(date?: Date): Date {
  const newDate = startOfNextLocalWeek(date);
  newDate.setMilliseconds(-1);
  return newDate;
}

export function endOfUtcMonth(date?: Date): Date {
  const newDate = startOfNextUtcMonth(date);
  newDate.setUTCMilliseconds(-1);
  return newDate;
}

export function endOfLocalMonth(date?: Date): Date {
  const newDate = startOfNextLocalMonth(date);
  newDate.setMilliseconds(-1);
  return newDate;
}

export function endOfUtcYear(date?: Date): Date {
  const newDate = startOfNextUtcYear(date);
  newDate.setUTCMilliseconds(-1);
  return newDate;
}

export function endOfLocalYear(date?: Date): Date {
  const newDate = startOfNextLocalYear(date);
  newDate.setMilliseconds(-1);
  return newDate;
}

export function endOfUtcPeriod(date: Date, period: S3PrefixPeriod | 'week'): number {
  if (period === 'year') {
    return endOfUtcYear(date).getTime();
  } else if (period === 'month') {
    return endOfUtcMonth(date).getTime();
  } else if (period === 'week') {
    return endOfUtcWeek(date).getTime();
  } else if (period === 'day') {
    return endOfUtcDay(date).getTime();
  } else if (period === 'hour') {
    return endOfUtcHour(date).getTime();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return endOfUtcMinute(date).getTime();
  }
  neverHappens(period, `Invalid period value "${period}"`);
}

//
// Start of next time period
//

export function startOfNextUtcMinute(date?: Date): Date {
  const newDate = startOfUtcMinute(date);
  newDate.setUTCMinutes(newDate.getUTCMinutes() + 1);
  return newDate;
}

export function startOfNextLocalMinute(date?: Date): Date {
  const newDate = startOfLocalMinute(date);
  newDate.setMinutes(newDate.getMinutes() + 1);
  return newDate;
}

export function startOfNextUtcHour(date?: Date): Date {
  const newDate = startOfUtcHour(date);
  newDate.setUTCHours(newDate.getUTCHours() + 1);
  return newDate;
}

export function startOfNextLocalHour(date?: Date): Date {
  const newDate = startOfLocalHour(date);
  newDate.setHours(newDate.getHours() + 1);
  return newDate;
}

export function startOfNextUtcDay(date?: Date): Date {
  const newDate = startOfUtcDay(date);
  newDate.setUTCDate(newDate.getUTCDate() + 1);
  return newDate;
}

export function startOfNextLocalDay(date?: Date): Date {
  const newDate = startOfLocalDay(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
}

// Midnight the night between Sunday and Monday
export function startOfNextUtcWeek(date?: Date): Date {
  const newDate = startOfUtcWeek(date);
  newDate.setUTCDate(newDate.getUTCDate() + DAYS_IN_WEEK);
  return newDate;
}

export function startOfNextLocalWeek(date?: Date): Date {
  const newDate = startOfLocalWeek(date);
  newDate.setDate(newDate.getDate() + DAYS_IN_WEEK);
  return newDate;
}

export function startOfNextUtcMonth(date?: Date): Date {
  const newDate = startOfUtcMonth(date);
  newDate.setUTCMonth(newDate.getUTCMonth() + 1);
  return newDate;
}

export function startOfNextLocalMonth(date?: Date): Date {
  const newDate = startOfLocalMonth(date);
  newDate.setMonth(newDate.getMonth() + 1);
  return newDate;
}

export function startOfNextUtcYear(date?: Date): Date {
  const newDate = startOfUtcYear(date);
  newDate.setUTCFullYear(newDate.getUTCFullYear() + 1);
  return newDate;
}

export function startOfNextLocalYear(date?: Date): Date {
  const newDate = startOfLocalYear(date);
  newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate;
}

export function startOfUtcDayOffset(date: Date, dayOffset: number): Date {
  const newDate = startOfUtcDay(date);
  newDate.setUTCDate(newDate.getUTCDate() + dayOffset);
  return newDate;
}

//
// Set to start of time period
//

export function setToStartOfUtcMinute(date: Date): void {
  date.setUTCMilliseconds(0);
  date.setUTCSeconds(0);
}

export function setToStartOfUtcHour(date: Date): void {
  setToStartOfUtcMinute(date);
  date.setUTCMinutes(0);
}

export function setToStartOfUtcDay(date: Date): void {
  setToStartOfUtcHour(date);
  date.setUTCHours(0);
}

export function setToStartOfUtcYesterday(date: Date): void {
  setToStartOfUtcDay(date);
  date.setUTCDate(date.getUTCDate() - 1);
}

export function setToStartOfUtcPeriod(date: Date, period: 'day' | 'hour' | 'minute'): void {
  if (period === 'day') {
    return setToStartOfUtcDay(date);
  } else if (period === 'hour') {
    return setToStartOfUtcHour(date);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return setToStartOfUtcMinute(date);
  }
  neverHappens(period, `Invalid period value "${period}"`);
}

//
// Set to previous/next periods
//

export function setToStartOfUtcDayOffset(date: Date, dayOffset: number): void {
  setToStartOfUtcDay(date);
  date.setUTCDate(date.getUTCDate() + dayOffset);
}

export function setToPreviousUtcYear(date: Date): void {
  date.setUTCFullYear(date.getUTCFullYear() - 1);
}
export function setToNextUtcYear(date: Date): void {
  date.setUTCFullYear(date.getUTCFullYear() + 1);
}

export function setToPreviousUtcMonth(date: Date): void {
  date.setUTCMonth(date.getUTCMonth() - 1);
}
export function setToNextUtcMonth(date: Date): void {
  date.setUTCMonth(date.getUTCMonth() + 1);
}

export function setToPreviousUtcDay(date: Date): void {
  date.setUTCDate(date.getUTCDate() - 1);
}
export function setToNextUtcDay(date: Date): void {
  date.setUTCDate(date.getUTCDate() + 1);
}

export function setToPreviousUtcHour(date: Date): void {
  date.setUTCHours(date.getUTCHours() - 1);
}
export function setToNextUtcHour(date: Date): void {
  date.setUTCHours(date.getUTCHours() + 1);
}

export function setToPreviousUtcMinute(date: Date): void {
  date.setUTCMinutes(date.getUTCMinutes() - 1);
}
export function setToNextUtcMinute(date: Date): void {
  date.setUTCMinutes(date.getUTCMinutes() + 1);
}

export function setToPreviousUtcPeriod(date: Date, period: S3PrefixPeriod): void {
  if (period === 'year') {
    return setToPreviousUtcYear(date);
  } else if (period === 'month') {
    return setToPreviousUtcMonth(date);
  } else if (period === 'day') {
    return setToPreviousUtcDay(date);
  } else if (period === 'hour') {
    return setToPreviousUtcHour(date);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return setToPreviousUtcMinute(date);
  }
  neverHappens(period, `Invalid period value "${period}"`);
}
export function setToNextUtcPeriod(date: Date, period: S3PrefixPeriod): void {
  if (period === 'year') {
    return setToNextUtcYear(date);
  } else if (period === 'month') {
    return setToNextUtcMonth(date);
  } else if (period === 'day') {
    return setToNextUtcDay(date);
  } else if (period === 'hour') {
    return setToNextUtcHour(date);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (period === 'minute') {
    return setToNextUtcMinute(date);
  }
  neverHappens(period, `Invalid period value "${period}"`);
}

//
// Date ranges
//

export function dateRangeByUtcDays(start: Date, end: Date): Date[] {
  const current = startOfUtcDay(new Date(start));
  const lastDayStart = startOfUtcDay(new Date(end));
  const allDayStarts: Date[] = [];
  while (current.getTime() <= lastDayStart.getTime()) {
    allDayStarts.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return allDayStarts;
}

//
// Miscellaneous
//

export function datesAreSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCDate() === d2.getUTCDate() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCFullYear() === d2.getUTCFullYear()
  );
}

//
// Timezone
//

export function parisTimezoneOffsetMs(val: number | Date): number {
  const d = typeof val === 'number' ? new Date(val) : val;
  return (
    new Date(d.toLocaleString('en-US', {timeZone: 'Europe/Paris'})).getTime() -
    new Date(d.toLocaleString('en-US', {timeZone: 'UTC'})).getTime()
  );
}

// const d = Date.UTC(2000, 0, 1, 10, 20); // 10h20 UTC time
// utcToFrance(d); // 10h20 in france
export function utcToFrance(date: Date): Date {
  return new Date(date.getTime() + parisTimezoneOffsetMs(date));
}

// Inverse of utcToFrance.
// const d = franceToUtc(Date.UTC(2000, 0, 1, 10, 20)); // 10h20 in france
// d.getUTCHour(); // 10
export function franceToUtc(date: Date): Date {
  return new Date(date.getTime() - parisTimezoneOffsetMs(date));
}
