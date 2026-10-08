import { useState } from 'react'
import type { FormEvent } from 'react'
import { getStateInstance } from '../api/greenApi'
import type { GreenApiCredentials } from '../api/greenApi.types'
import './LoginScreen.css'

interface LoginScreenProps {
  onLoggedIn: (credentials: GreenApiCredentials) => void
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const credentials: GreenApiCredentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }

    if (!credentials.idInstance || !credentials.apiTokenInstance) {
      setError('Заполните оба поля')
      return
    }

    setIsChecking(true)
    try {
      const { stateInstance } = await getStateInstance(credentials)
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (статус: ${stateInstance})`)
        return
      }
      onLoggedIn(credentials)
    } catch {
      setError('Не удалось подключиться. Проверьте idInstance и apiTokenInstance')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">MAX Chat</h1>
        <p className="login-subtitle">Войдите с учётными данными GREEN-API</p>

        <label className="login-field">
          <span>idInstance</span>
          <input
            type="text"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000001"
            autoComplete="off"
            disabled={isChecking}
          />
        </label>

        <label className="login-field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d319...6f1a"
            autoComplete="off"
            disabled={isChecking}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-submit" disabled={isChecking}>
          {isChecking ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
