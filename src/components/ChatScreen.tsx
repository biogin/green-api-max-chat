import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { buildChatId, pollForMessages, sendMessage } from '../api/greenApi'
import type { ChatMessage, GreenApiCredentials } from '../api/greenApi.types'
import { MessageBubble } from './MessageBubble'
import './ChatScreen.css'

interface ChatScreenProps {
  credentials: GreenApiCredentials
  phone: string
  onBack: () => void
}

export function ChatScreen({ credentials, phone, onBack }: ChatScreenProps) {
  const chatId = buildChatId(phone)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [connectionError, setConnectionError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()

    pollForMessages({
      credentials,
      chatId,
      signal: controller.signal,
      onIncomingText: (text, timestamp) => {
        setConnectionError(false)
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), direction: 'incoming', text, timestamp },
        ])
      },
      onError: () => setConnectionError(true),
    })

    return () => controller.abort()
  }, [credentials, chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    const id = crypto.randomUUID()
    const timestamp = Math.floor(Date.now() / 1000)
    setMessages((prev) => [
      ...prev,
      { id, direction: 'outgoing', text, timestamp, status: 'sending' },
    ])
    setDraft('')

    try {
      await sendMessage(credentials, chatId, text)
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'sent' } : m)))
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'failed' } : m)))
    }
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

      <div className="chat-messages">
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
        <button type="submit" className="chat-send" disabled={!draft.trim()}>
          ➤
        </button>
      </form>
    </div>
  )
}
