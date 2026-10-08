import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { isValidPhoneDigits, normalizePhoneDigits } from '../api/greenApi'
import { routes } from '../routes'
import './NewChatScreen.css'

interface NewChatScreenProps {
  onChangeAccount: () => void
}

export function NewChatScreen({ onChangeAccount }: NewChatScreenProps) {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizePhoneDigits(phone)
    if (!isValidPhoneDigits(normalized)) {
      setError('Введите номер телефона в международном формате')
      return
    }
    setError(null)
    navigate(routes.chat(normalized))
  }

  return (
    <div className="new-chat-screen">
      <div className="new-chat-header">
        <h1>Новый чат</h1>
        <button type="button" className="change-account" onClick={onChangeAccount}>
          Сменить аккаунт
        </button>
      </div>

      <form className="new-chat-form" onSubmit={handleSubmit}>
        <label className="new-chat-field">
          <span>Номер телефона получателя</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 999 123-45-67"
            autoComplete="off"
            maxLength={30}
          />
        </label>

        {error && <p className="new-chat-error">{error}</p>}

        <button type="submit" className="new-chat-submit">
          Создать чат
        </button>
      </form>
    </div>
  )
}
