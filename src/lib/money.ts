// ─── Money: exact decimal handling via minor units (cents) ────────────────────
// All sums are done on cents; floats never touch storage or math.

/** Parse user input into exact cents. Accepts "12", "12.5", "1,234.56", "$12". */
export function toCents(input: string | number): number {
  if (typeof input === 'number') input = String(input);
  const cleaned = input.replace(/[$,\s]/g, '');
  if (cleaned === '' || Number.isNaN(Number(cleaned))) return NaN;
  const neg = cleaned.startsWith('-');
  const [whole, frac = ''] = cleaned.replace('-', '').split('.');
  const cents = Number(whole || '0') * 100 + Number((frac + '00').slice(0, 2));
  return neg ? -cents : cents;
}

export function centsToNumber(cents: number): number {
  return cents / 100;
}

/** Round-half-up to cents from any float (e.g. 0.1+0.2 cases, JMD conversions). */
export function toCentsRounded(v: number): number {
  return Math.round(v * 100);
}

export function fmtCents(cents: number, currency = 'JMD'): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100).toLocaleString('en-US');
  const frac = String(abs % 100).padStart(2, '0');
  const sign = neg ? '−' : '';
  const sym = currency === 'JMD' ? '$' : `${currency} `;
  return `${sign}${sym}${whole}.${frac}`;
}
