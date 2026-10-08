import type { GreenApiCredentials } from './api/greenApi.types'

const STORAGE_KEY = 'green-api-max-chat:credentials'

export function loadCredentials(): GreenApiCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GreenApiCredentials>
    if (typeof parsed.idInstance !== 'string' || typeof parsed.apiTokenInstance !== 'string') {
      return null
    }
    return { idInstance: parsed.idInstance, apiTokenInstance: parsed.apiTokenInstance }
  } catch {
    return null
  }
}

export function saveCredentials(credentials: GreenApiCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY)
}
