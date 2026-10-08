import { normalizePhoneDigits } from '../api/greenApi'

interface MaskedValue {
  unmaskedValue: string
}

/**
 * Normalizes a pasted chunk before IMask fills it into the mask. Only acts
 * on a multi-character insert into an empty field — i.e. an actual paste,
 * not a single keystroke. A real paste always arrives as one multi-char
 * `appended` string (IMask calls `prepare` once per batch insert, not per
 * character), so `appended.length <= 1` reliably means "this is normal
 * typing" and must always pass through untouched, regardless of how much
 * is already in the field.
 *
 * For a genuine paste into an empty field, handles the two realistic
 * full-number shapes (a bare 10-digit subscriber number, or 11 digits with
 * a "7"/"8" country or trunk prefix) by reusing normalizePhoneDigits.
 * Anything that doesn't resolve cleanly (wrong digit count, garbage) is
 * rejected outright — returning '' — rather than guessed at. Silently
 * truncating a too-long paste to *something* risks constructing a
 * plausible-looking but wrong number, which in a messaging app means
 * silently texting the wrong person.
 */
export function preparePhoneAppend(appended: string, masked: MaskedValue): string {
  const isPasteIntoEmptyField = appended.length > 1 && masked.unmaskedValue.length === 0
  if (!isPasteIntoEmptyField) return appended

  const normalized = normalizePhoneDigits(appended)
  if (normalized.length === 11 && normalized.startsWith('7')) return normalized.slice(1)
  if (normalized.length === 10) return normalized
  return ''
}
