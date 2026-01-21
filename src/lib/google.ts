import { google } from 'googleapis';
import { TIMEZONE } from './constants';

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

export function buildEventDescription(input: {
  sourceUrl?: string | null;
  isFree?: boolean | null;
  price?: string | null;
  notes?: string | null;
}) {
  const parts = [
    input.sourceUrl ? `Source: ${input.sourceUrl}` : null,
    input.isFree != null ? `Free: ${input.isFree ? 'Yes' : 'No'}` : null,
    input.price ? `Price: ${input.price}` : null,
    input.notes ? `Notes: ${input.notes}` : null
  ].filter(Boolean);

  return parts.join('\n');
}

export function normalizeEventTimes(input: {
  start: Date;
  end?: Date | null;
}) {
  const end = input.end ?? new Date(input.start.getTime() + 2 * 60 * 60 * 1000);
  return {
    start: { dateTime: input.start.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: TIMEZONE }
  };
}
