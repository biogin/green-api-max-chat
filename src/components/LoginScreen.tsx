import { useActionState } from 'react'
import { getStateInstance } from '../api/greenApi'
import type { GreenApiCredentials } from '../api/greenApi.types'
import './LoginScreen.css'

interface LoginScreenProps {
  onLoggedIn: (credentials: GreenApiCredentials) => void
}

async function submitLogin(
  _previousError: string | null,
  formData: FormData,
  onLoggedIn: (credentials: GreenApiCredentials) => void,
): Promise<string | null> {
  const credentials: GreenApiCredentials = {
    idInstance: String(formData.get('idInstance') ?? '').trim(),
    apiTokenInstance: String(formData.get('apiTokenInstance') ?? '').trim(),
  }

  if (!credentials.idInstance || !credentials.apiTokenInstance) {
    return 'Заполните оба поля'
  }

  try {
    const { stateInstance } = await getStateInstance(credentials)
    if (stateInstance !== 'authorized') {
      return `Инстанс не авторизован (статус: ${stateInstance})`
    }
  } catch {
    return 'Не удалось подключиться. Проверьте idInstance и apiTokenInstance'
  }

  onLoggedIn(credentials)
  return null
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [error, submitAction, isChecking] = useActionState(
    (previousError: string | null, formData: FormData) =>
      submitLogin(previousError, formData, onLoggedIn),
    null,
  )

  return (
    <div className="login-screen">
      <form className="login-card" action={submitAction}>
        <h1 className="login-title">MAX Chat</h1>
        <p className="login-subtitle">Войдите с учётными данными GREEN-API</p>

        <label className="login-field">
          <span>idInstance</span>
          <input
            type="text"
            name="idInstance"
            placeholder="1101000001"
            autoComplete="off"
            disabled={isChecking}
          />
        </label>

        <label className="login-field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            name="apiTokenInstance"
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
