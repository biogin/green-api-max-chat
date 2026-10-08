import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useChatSession } from '../hooks/useChatSession'
import type { GreenApiCredentials } from '../api/greenApi.types'
import { routes } from '../routes'
import { MessageBubble } from './MessageBubble'
import './ChatScreen.css'

interface ChatScreenProps {
  credentials: GreenApiCredentials
}

export function ChatScreen({ credentials }: ChatScreenProps) {
  const { phone } = useParams<{ phone: string }>()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // phone is only ever empty if this route rendered without matching
  // "/chat/:phone", which the route config already excludes — a
  // defensive fallback, not an expected path.
  const { messages, connectionError, sendText } = useChatSession(credentials, phone ?? '')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!phone) {
    return <Navigate to={routes.newChat} replace />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    sendText(draft)
    setDraft('')
  }

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <button
          type="button"
          className="chat-back"
          onClick={() => navigate(routes.newChat)}
          aria-label="Назад"
        >
          ←
        </button>
        <div className="chat-header-info">
          <span className="chat-header-name">{phone}</span>
          {connectionError && <span className="chat-header-status">нет соединения…</span>}
        </div>
      </header>

      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-empty">Сообщений пока нет. Напишите первым!</p>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Сообщение"
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-send"
          disabled={!draft.trim()}
          aria-label="Отправить"
        >
          ➤
        </button>
      </form>
    </div>
  )
}
