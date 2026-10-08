import { describe, expect, it } from 'vitest'
import { extractIncomingTextMessage } from './greenApi'

// Real payload shape captured from a live, authorized MAX instance.
// senderData.chatId is an opaque internal id, NOT "{phone}@c.us" — the
// actual phone number lives in senderData.senderPhoneNumber, sent as a
// JSON number. A prior version of this parser matched on chatId and
// silently dropped every incoming reply.
const realMaxNotification = {
  typeWebhook: 'incomingMessageReceived',
  instanceData: { idInstance: 310022759776, wid: '79136988255@c.us', typeInstance: 'v3' },
  timestamp: 1791451817,
  idMessage: '117404586282651078',
  senderData: {
    chatId: '468995439',
    chatName: 'Igor',
    chatType: 'user',
    sender: '468995439',
    senderName: 'Igor',
    senderType: 'user',
    senderContactName: 'Igor',
    senderPhoneNumber: 79234245964,
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Yes', forwardingScore: 0, isForwarded: false },
  },
}

describe('extractIncomingTextMessage', () => {
  it('parses the real MAX payload shape, keeping both the opaque chatId and senderPhoneNumber', () => {
    expect(extractIncomingTextMessage(realMaxNotification)).toEqual({
      chatId: '468995439',
      senderPhoneNumber: '79234245964',
      text: 'Yes',
      timestamp: 1791451817,
    })
  })

  it('returns null when senderPhoneNumber is missing (the old, wrong assumption)', () => {
    const wrongShape = {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1791451817,
      senderData: { chatId: '468995439' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Yes' } },
    }
    expect(extractIncomingTextMessage(wrongShape)).toBeNull()
  })

  it('returns null for a non-text notification', () => {
    const imageNotification = {
      ...realMaxNotification,
      messageData: { typeMessage: 'imageMessage' },
    }
    expect(extractIncomingTextMessage(imageNotification)).toBeNull()
  })

  it('returns null for a notification of a different webhook type', () => {
    expect(extractIncomingTextMessage({ typeWebhook: 'stateInstanceChanged' })).toBeNull()
  })

  it('returns null for a malformed or partial body', () => {
    expect(extractIncomingTextMessage(null)).toBeNull()
    expect(extractIncomingTextMessage(undefined)).toBeNull()
    expect(extractIncomingTextMessage('not an object')).toBeNull()
    expect(extractIncomingTextMessage({ typeWebhook: 'incomingMessageReceived' })).toBeNull()
  })
})
