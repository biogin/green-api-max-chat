import { describe, expect, it } from 'vitest'
import { preparePhoneAppend } from './preparePhoneAppend'

const empty = { unmaskedValue: '' }
const midEdit = { unmaskedValue: '999' }

describe('preparePhoneAppend', () => {
  it('passes a bare 10-digit subscriber number through unchanged', () => {
    expect(preparePhoneAppend('9991234567', empty)).toBe('9991234567')
  })

  it('strips a leading 7 country code from an 11-digit paste', () => {
    expect(preparePhoneAppend('+7 999 123-45-67', empty)).toBe('9991234567')
  })

  it('normalizes a leading 8 trunk prefix the same as normalizePhoneDigits does', () => {
    expect(preparePhoneAppend('8 999 123-45-67', empty)).toBe('9991234567')
  })

  it('rejects the reported bug case: one digit too many', () => {
    expect(preparePhoneAppend('+792345654544', empty)).toBe('')
  })

  it('rejects anything too short', () => {
    expect(preparePhoneAppend('+7999', empty)).toBe('')
    expect(preparePhoneAppend('', empty)).toBe('')
  })

  it('rejects gibberish that resolves to the wrong digit count', () => {
    expect(preparePhoneAppend('hello world', empty)).toBe('')
    expect(preparePhoneAppend('🎉🎉🎉', empty)).toBe('')
  })

  it('does not touch a paste into a field that already has digits', () => {
    // mid-edit paste — pass through raw, let the mask handle it normally
    expect(preparePhoneAppend('123', midEdit)).toBe('123')
    expect(preparePhoneAppend('+79991234567', midEdit)).toBe('+79991234567')
  })

  it('never throws regardless of input', () => {
    const inputs = ['a'.repeat(10000), '\u0000', 'NaN', '-1', '+'.repeat(20)]
    for (const input of inputs) {
      expect(() => preparePhoneAppend(input, empty)).not.toThrow()
    }
  })
})
