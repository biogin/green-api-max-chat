import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ChatScreen } from './components/ChatScreen'
import { LoginScreen } from './components/LoginScreen'
import { NewChatScreen } from './components/NewChatScreen'
import type { GreenApiCredentials } from './api/greenApi.types'
import { CHAT_ROUTE_PATTERN, routes } from './routes'
import { clearCredentials, loadCredentials, saveCredentials } from './storage'

function App() {
  const [credentials, setCredentials] = useState<GreenApiCredentials | null>(loadCredentials)

  function handleLoggedIn(creds: GreenApiCredentials) {
    saveCredentials(creds)
    setCredentials(creds)
  }

  function handleChangeAccount() {
    clearCredentials()
    setCredentials(null)
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={credentials ? routes.newChat : routes.login} replace />}
      />
      <Route
        path={routes.login}
        element={
          credentials ? (
            <Navigate to={routes.newChat} replace />
          ) : (
            <LoginScreen onLoggedIn={handleLoggedIn} />
          )
        }
      />
      <Route
        path={routes.newChat}
        element={
          credentials ? (
            <NewChatScreen onChangeAccount={handleChangeAccount} />
          ) : (
            <Navigate to={routes.login} replace />
          )
        }
      />
      <Route
        path={CHAT_ROUTE_PATTERN}
        element={
          credentials ? (
            <ChatScreen credentials={credentials} />
          ) : (
            <Navigate to={routes.login} replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
