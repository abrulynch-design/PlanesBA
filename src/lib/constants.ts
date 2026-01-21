export const CATEGORIES = [
  'Music/Party',
  'Food/Drink',
  'Market/Fair',
  'Culture/Theatre',
  'Outdoors',
  'Sports',
  'Workshop/Class',
  'Kids/Family',
  'Other'
] as const;

export const TAGS = [
  'free',
  'paid',
  'reservation_required',
  'tickets',
  'daytime',
  'night',
  'indoors',
  'outdoors',
  'accessible',
  'pet_friendly'
] as const;

export const TIMEZONE = 'America/Argentina/Buenos_Aires';

export const STATUS_OPTIONS = ['DRAFT', 'CREATED', 'FAILED'] as const;
