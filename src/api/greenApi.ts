import type {
  GreenApiCredentials,
  IncomingTextMessage,
  ReceiveNotificationResponse,
  SendMessageResponse,
  StateInstanceResponse,
} from './greenApi.types'

const API_BASE_URL = 'https://api.green-api.com'

// GREEN-API's public docs only confirm the "@c.us" chatId suffix for
// WhatsApp personal chats. The MAX-specific suffix wasn't documented at
// the time this was written — verify against a live MAX instance and
// update this constant if it differs.
const CHAT_ID_SUFFIX = '@c.us'

function instanceUrl(credentials: GreenApiCredentials, method: string): string {
  return `${API_BASE_URL}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}`
}

export function buildChatId(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '')
  return `${digitsOnly}${CHAT_ID_SUFFIX}`
}

export async function getStateInstance(
  credentials: GreenApiCredentials,
): Promise<StateInstanceResponse> {
  const response = await fetch(instanceUrl(credentials, 'getStateInstance'))
  if (!response.ok) {
    throw new Error(`getStateInstance failed: ${response.status}`)
  }
  return response.json()
}

export async function sendMessage(
  credentials: GreenApiCredentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const response = await fetch(instanceUrl(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  if (!response.ok) {
    throw new Error(`sendMessage failed: ${response.status}`)
  }
  return response.json()
}

async function receiveNotification(
  credentials: GreenApiCredentials,
  receiveTimeoutSeconds: number,
): Promise<ReceiveNotificationResponse | null> {
  const url = `${instanceUrl(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeoutSeconds}`
  const response = await fetch(url)
  if (response.status === 204) return null
  if (!response.ok) {
    throw new Error(`receiveNotification failed: ${response.status}`)
  }
  const data: ReceiveNotificationResponse | null = await response.json()
  return data ?? null
}

async function deleteNotification(
  credentials: GreenApiCredentials,
  receiptId: number,
): Promise<void> {
  const url = `${instanceUrl(credentials, 'deleteNotification')}/${receiptId}`
  const response = await fetch(url, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(`deleteNotification failed: ${response.status}`)
  }
}

/**
 * Defensively parses a notification body into an incoming text message,
 * or returns null for every other notification shape (status updates,
 * non-text messages, etc). The exact payload shape isn't fully confirmed
 * against GREEN-API's public docs, so this never trusts the shape blindly.
 */
export function extractIncomingTextMessage(body: unknown): IncomingTextMessage | null {
  if (typeof body !== 'object' || body === null) return null
  const webhook = body as Record<string, unknown>
  if (webhook.typeWebhook !== 'incomingMessageReceived') return null

  const messageData = webhook.messageData as Record<string, unknown> | undefined
  if (messageData?.typeMessage !== 'textMessage') return null

  const textMessageData = messageData.textMessageData as Record<string, unknown> | undefined
  const senderData = webhook.senderData as Record<string, unknown> | undefined

  const text = textMessageData?.textMessage
  const chatId = senderData?.chatId
  const timestamp = webhook.timestamp

  if (typeof text !== 'string' || typeof chatId !== 'string' || typeof timestamp !== 'number') {
    return null
  }

  return { chatId, text, timestamp }
}

export interface PollOptions {
  credentials: GreenApiCredentials
  chatId: string
  onIncomingText: (text: string, timestamp: number) => void
  onError?: (error: unknown) => void
  signal: AbortSignal
}

/**
 * Long-polls GREEN-API's notification queue and forwards text messages
 * from the given chat. Every notification is deleted after being read,
 * regardless of type, so the queue doesn't back up with status updates.
 */
export async function pollForMessages({
  credentials,
  chatId,
  onIncomingText,
  onError,
  signal,
}: PollOptions): Promise<void> {
  while (!signal.aborted) {
    try {
      const notification = await receiveNotification(credentials, 10)
      if (signal.aborted) return

      if (notification) {
        const incoming = extractIncomingTextMessage(notification.body)
        if (incoming && incoming.chatId === chatId) {
          onIncomingText(incoming.text, incoming.timestamp)
        }
        await deleteNotification(credentials, notification.receiptId)
      }
    } catch (error) {
      if (signal.aborted) return
      onError?.(error)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }
}
