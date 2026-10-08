import { useState } from 'react'
import { ChatScreen } from './components/ChatScreen'
import { LoginScreen } from './components/LoginScreen'
import { NewChatScreen } from './components/NewChatScreen'
import type { GreenApiCredentials } from './api/greenApi.types'
import { clearCredentials, loadCredentials, saveCredentials } from './storage'

type Screen =
  | { name: 'login' }
  | { name: 'newChat'; credentials: GreenApiCredentials }
  | { name: 'chat'; credentials: GreenApiCredentials; phone: string }

function initialScreen(): Screen {
  const credentials = loadCredentials()
  return credentials ? { name: 'newChat', credentials } : { name: 'login' }
}

function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen)

  if (screen.name === 'login') {
    return (
      <LoginScreen
        onLoggedIn={(credentials) => {
          saveCredentials(credentials)
          setScreen({ name: 'newChat', credentials })
        }}
      />
    )
  }

  if (screen.name === 'newChat') {
    return (
      <NewChatScreen
        onStartChat={(phone) => setScreen({ name: 'chat', credentials: screen.credentials, phone })}
        onChangeAccount={() => {
          clearCredentials()
          setScreen({ name: 'login' })
        }}
      />
    )
  }

  return (
    <ChatScreen
      credentials={screen.credentials}
      phone={screen.phone}
      onBack={() => setScreen({ name: 'newChat', credentials: screen.credentials })}
    />
  )
}

export default App
