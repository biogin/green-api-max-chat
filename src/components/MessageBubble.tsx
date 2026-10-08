import type { ChatMessage } from '../api/greenApi.types'
import './MessageBubble.css'

function formatTime(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isOutgoing = message.direction === 'outgoing'

  return (
    <div className={`message-row ${isOutgoing ? 'message-row--out' : 'message-row--in'}`}>
      <div className={`message-bubble ${isOutgoing ? 'message-bubble--out' : 'message-bubble--in'}`}>
        <span className="message-text">{message.text}</span>
        <span className="message-meta">
          {formatTime(message.timestamp)}
          {message.status === 'sending' && ' · отправка…'}
          {message.status === 'failed' && ' · ошибка'}
        </span>
      </div>
    </div>
  )
}
