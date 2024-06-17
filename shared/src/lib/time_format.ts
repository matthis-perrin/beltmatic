import {Tuple6} from '@shared/lib/tuple_utils';

export function localeDateString(date: Date): string {
  const dateStr = [
    date.getFullYear().toString(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
  ].join('-');
  return dateStr;
}

export function localeTimeString(date: Date): string {
  const timeStr = [
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0'),
    date.getSeconds().toString().padStart(2, '0'),
  ].join(':');
  return timeStr;
}

export function localeDateTimeString(date: Date): string {
  const dateStr = localeDateString(date);
  const timeStr = localeTimeString(date);
  return [dateStr, timeStr].join(' ');
}

export function localeDate(str: string): Date {
  const [yearStr, monthStr, dayStr] = str.split('-');

  const dateComponents: number[] = [];
  for (const val of [yearStr, monthStr, dayStr]) {
    if (val === undefined) {
      return new Date(NaN);
    }
    const component = parseFloat(val);
    if (isNaN(component)) {
      return new Date(NaN);
    }
    dateComponents.push(component);
  }

  const [year = 0, month = 0, day] = dateComponents;
  return new Date(year, month - 1, day);
}

export function localeDateTime(str: string): Date {
  const [dateStr, timeStr] = str.split(' ');
  if (dateStr === undefined || timeStr === undefined) {
    return new Date(NaN);
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hoursStr, minutesStr, secondsStr] = timeStr.split(':');

  const dateComponents: number[] = [];
  for (const val of [yearStr, monthStr, dayStr, hoursStr, minutesStr, secondsStr]) {
    if (val === undefined) {
      return new Date(NaN);
    }
    const component = parseFloat(val);
    if (isNaN(component)) {
      return new Date(NaN);
    }
    dateComponents.push(component);
  }

  const [year, month, day, hours, minutes, seconds] = dateComponents as Tuple6<number>;
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
