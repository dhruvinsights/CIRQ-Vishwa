/**
 * Boundary Formatting Utilities
 * Converts raw API values + units according to user preferences.
 */
import { UnitSystem, CurrencyCode } from '../stores/preferencesStore.ts';

// Exchange rate approximate multipliers relative to USD base
const FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  INR: 83.5,
  BRL: 5.4,
  KES: 130.0,
  THB: 36.2
};

export function formatCurrency(
  amount: number,
  sourceCurrency: string = 'USD',
  targetCurrency: CurrencyCode = 'USD',
  locale: string = 'en-US'
): string {
  const fromRate = FX_RATES[sourceCurrency.toUpperCase()] || 1.0;
  const toRate = FX_RATES[targetCurrency.toUpperCase()] || 1.0;
  const converted = (amount / fromRate) * toRate;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    maximumFractionDigits: converted > 1000 ? 0 : 2
  }).format(converted);
}

export function formatMass(
  amountTonnes: number,
  unitSystem: UnitSystem = 'METRIC',
  locale: string = 'en-US'
): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (unitSystem === 'IMPERIAL') {
    // 1 metric ton = 1.10231 short tons
    const shortTons = amountTonnes * 1.10231;
    return `${nf.format(shortTons)} short tons`;
  }
  return `${nf.format(amountTonnes)} t`;
}

export function formatDistance(
  km: number,
  unitSystem: UnitSystem = 'METRIC',
  locale: string = 'en-US'
): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (unitSystem === 'IMPERIAL') {
    return `${nf.format(km * 0.621371)} mi`;
  }
  return `${nf.format(km)} km`;
}

export function formatEnergy(mwh: number, locale: string = 'en-US'): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (mwh >= 1000) {
    return `${nf.format(mwh / 1000)} GWh`;
  }
  return `${nf.format(mwh)} MWh`;
}

export function formatCarbon(tonnesCo2: number, locale: string = 'en-US'): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return `${nf.format(tonnesCo2)} tCO₂e`;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}
