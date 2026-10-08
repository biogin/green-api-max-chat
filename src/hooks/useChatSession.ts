import { useEffect, useOptimistic, useState, useTransition } from 'react'
import {
  buildChatId,
  pollForMessages as defaultPollForMessages,
  readChat as defaultReadChat,
  sendMessage as defaultSendMessage,
} from '../api/greenApi'
import type { ChatMessage, GreenApiCredentials } from '../api/greenApi.types'

interface UseChatSessionDeps {
  sendMessage?: typeof defaultSendMessage
  pollForMessages?: typeof defaultPollForMessages
  readChat?: typeof defaultReadChat
}

interface UseChatSessionResult {
  messages: ChatMessage[]
  connectionError: boolean
  sendText: (text: string) => void
}

/**
 * Owns a single chat's message state: polls for incoming text, sends
 * outgoing text, and shows an optimistic "sending" bubble via useOptimistic
 * until the real send settles. Dependencies are injectable so this can be
 * tested with fakes instead of mocking the greenApi module.
 */
export function useChatSession(
  credentials: GreenApiCredentials,
  phone: string,
  deps: UseChatSessionDeps = {},
): UseChatSessionResult {
  const sendMessageImpl = deps.sendMessage ?? defaultSendMessage
  const pollForMessagesImpl = deps.pollForMessages ?? defaultPollForMessages
  const readChatImpl = deps.readChat ?? defaultReadChat

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionError, setConnectionError] = useState(false)
  const [, startTransition] = useTransition()
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: ChatMessage[], message: ChatMessage) => [...state, message],
  )
  const chatId = buildChatId(phone)

  useEffect(() => {
    const controller = new AbortController()

    pollForMessagesImpl({
      credentials,
      phone,
      signal: controller.signal,
      onIncomingText: (text, timestamp, incomingChatId) => {
        setConnectionError(false)
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), direction: 'incoming', text, timestamp },
        ])
        // Mark it read since the chat screen showing it is the only one the
        // user can be looking at. Best-effort: a failed read receipt
        // shouldn't surface as a connection error. Uses the opaque id from
        // the notification itself — ReadChat rejects "{phone}@c.us".
        readChatImpl(credentials, incomingChatId).catch(() => {})
      },
      onError: () => setConnectionError(true),
    })

    return () => controller.abort()
  }, [credentials, phone, pollForMessagesImpl, readChatImpl])

  function sendText(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      direction: 'outgoing',
      text: trimmed,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'sending',
    }

    startTransition(async () => {
      addOptimisticMessage(message)
      try {
        await sendMessageImpl(credentials, chatId, trimmed)
        setMessages((prev) => [...prev, { ...message, status: 'sent' }])
      } catch {
        setMessages((prev) => [...prev, { ...message, status: 'failed' }])
      }
    })
  }

  return { messages: optimisticMessages, connectionError, sendText }
}
