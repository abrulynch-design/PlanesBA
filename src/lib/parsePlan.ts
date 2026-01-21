import { TIMEZONE } from './constants';

const FREE_KEYWORDS = ['gratis', 'free', 'sin cargo'];
const PRICE_KEYWORDS = ['entrada', '$', 'ars'];

function parseDate(text: string) {
  const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  if (!dateMatch) return null;
  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const year = dateMatch[3] ? Number(dateMatch[3]) : new Date().getFullYear();
  const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
  return date;
}

function parseTime(text: string) {
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s?(hs|h|am|pm)?/i);
  if (!timeMatch) return null;
  let hour = Number(timeMatch[1]);
  const minutes = timeMatch[2] ? Number(timeMatch[2]) : 0;
  const meridiem = timeMatch[3]?.toLowerCase();
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return { hour, minutes };
}

function parsePrice(text: string) {
  const priceMatch = text.match(/(\$|ars)\s?([\d.,]+)/i);
  if (!priceMatch) return null;
  return `${priceMatch[1].toUpperCase()} ${priceMatch[2]}`;
}

export function parsePlanText(text: string) {
  const lower = text.toLowerCase();
  const isFree = FREE_KEYWORDS.some((keyword) => lower.includes(keyword));
  const mentionsPrice = PRICE_KEYWORDS.some((keyword) => lower.includes(keyword));
  const price = parsePrice(text);

  const date = parseDate(text);
  const time = parseTime(text);

  let startDt: Date | null = null;
  if (date && time) {
    startDt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), time.hour, time.minutes));
  }

  return {
    title: text.split('\n')[0]?.slice(0, 80) || 'New plan',
    startDt,
    isFree: isFree ? true : mentionsPrice ? false : null,
    price: price ?? null,
    timezone: TIMEZONE
  };
}
