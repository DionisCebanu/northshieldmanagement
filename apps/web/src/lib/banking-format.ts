export function money(value: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(value);
}
export function dateLabel(value: string): string {
  // Mock transaction timestamps have no zone; treat them consistently as UTC for display.
  const normalized = value.length === 10 ? `${value}T00:00:00Z` : value.endsWith('Z') ? value : `${value}Z`;
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(normalized));
}
export function maskedAccount(value: string): string { return `•••• ${value.slice(-4)}`; }
export function humanize(value: string): string {
  return value.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
export function maskedCardNumber(value: string): string {
  return `•••• •••• •••• ${value.slice(-4)}`;
}
export function cardLast4(value: string): string {
  return value.slice(-4);
}
export function expiryLabel(value: string): string {
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  return `${month}/${year.slice(2)}`;
}
