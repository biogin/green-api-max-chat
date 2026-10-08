import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useChatSession } from '../hooks/useChatSession'
import type { GreenApiCredentials } from '../api/greenApi.types'
import { MessageBubble } from './MessageBubble'
import './ChatScreen.css'

interface ChatScreenProps {
  credentials: GreenApiCredentials
  phone: string
  onBack: () => void
}

export function ChatScreen({ credentials, phone, onBack }: ChatScreenProps) {
  const { messages, connectionError, sendText } = useChatSession(credentials, phone)
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    sendText(draft)
    setDraft('')
  }

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <button type="button" className="chat-back" onClick={onBack} aria-label="Назад">
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
