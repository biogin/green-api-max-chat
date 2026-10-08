import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { isValidRussianPhone } from '../api/greenApi'
import { routes } from '../routes'
import { PhoneInput } from './PhoneInput'
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
    if (!isValidRussianPhone(phone)) {
      setError('Введите номер телефона полностью')
      return
    }
    setError(null)
    navigate(routes.chat(phone))
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
          <PhoneInput value={phone} onChange={setPhone} />
        </label>

        {error && <p className="new-chat-error">{error}</p>}

        <button type="submit" className="new-chat-submit">
          Создать чат
        </button>
      </form>
    </div>
  )
}
