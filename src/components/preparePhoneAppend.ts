import { normalizePhoneDigits } from '../api/greenApi'

interface MaskedValue {
  unmaskedValue: string
}

/**
 * Normalizes a pasted/appended chunk before IMask fills it into the mask.
 * Only acts on a paste into an empty field — normal typing and mid-edit
 * pastes pass through untouched. Handles the two realistic full-number
 * paste shapes (a bare 10-digit subscriber number, or 11 digits with a
 * "7"/"8" country or trunk prefix) by reusing normalizePhoneDigits.
 *
 * Anything that doesn't resolve cleanly (wrong digit count, garbage) is
 * rejected outright — returning '' — rather than guessed at. Silently
 * truncating a too-long paste to *something* risks constructing a
 * plausible-looking but wrong number, which in a messaging app means
 * silently texting the wrong person.
 */
export function preparePhoneAppend(appended: string, masked: MaskedValue): string {
  if (masked.unmaskedValue.length > 0) return appended

  const normalized = normalizePhoneDigits(appended)
  if (normalized.length === 11 && normalized.startsWith('7')) return normalized.slice(1)
  if (normalized.length === 10) return normalized
  return ''
}
