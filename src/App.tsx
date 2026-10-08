import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ChatScreen } from './components/ChatScreen'
import { LoginScreen } from './components/LoginScreen'
import { NewChatScreen } from './components/NewChatScreen'
import type { GreenApiCredentials } from './api/greenApi.types'
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
      <Route path="/" element={<Navigate to={credentials ? '/new-chat' : '/login'} replace />} />
      <Route
        path="/login"
        element={
          credentials ? (
            <Navigate to="/new-chat" replace />
          ) : (
            <LoginScreen onLoggedIn={handleLoggedIn} />
          )
        }
      />
      <Route
        path="/new-chat"
        element={
          credentials ? (
            <NewChatScreen onChangeAccount={handleChangeAccount} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/chat/:phone"
        element={
          credentials ? <ChatScreen credentials={credentials} /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
