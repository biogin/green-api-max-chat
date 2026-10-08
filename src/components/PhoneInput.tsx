import { IMaskInput } from 'react-imask'
import { preparePhoneAppend } from './preparePhoneAppend'
import './PhoneInput.css'

interface PhoneInputProps {
  /** Full phone digits including the "7" country code, e.g. "79991234567", or "". */
  value: string
  onChange: (digits: string) => void
  disabled?: boolean
}

/**
 * A Russian-only phone input: "+7 " is a fixed, non-editable prefix, the
 * remaining 10 digits are masked as "(000) 000-00-00". Structurally caps
 * input to exactly 10 subscriber digits, so a too-long paste can't produce
 * an 11+-digit number in the first place.
 */
export function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  const subscriberDigits = value.startsWith('7') ? value.slice(1) : value

  return (
    <IMaskInput
      mask="+7 (000) 000-00-00"
      unmask
      prepare={preparePhoneAppend}
      value={subscriberDigits}
      onAccept={(unmaskedValue: string) => onChange(unmaskedValue ? `7${unmaskedValue}` : '')}
      placeholder="+7 (999) 123-45-67"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      disabled={disabled}
      className="phone-input"
    />
  )
}
