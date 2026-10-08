export interface GreenApiCredentials {
  idInstance: string
  apiTokenInstance: string
}

export interface SendMessageResponse {
  idMessage: string
}

export interface StateInstanceResponse {
  stateInstance: string
}

export interface ReceiveNotificationResponse {
  receiptId: number
  body: unknown
}

export interface IncomingTextMessage {
  chatId: string
  text: string
  timestamp: number
}

export type MessageDirection = 'outgoing' | 'incoming'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage {
  id: string
  direction: MessageDirection
  text: string
  timestamp: number
  status?: MessageStatus
}
