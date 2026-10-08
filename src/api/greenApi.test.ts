import { describe, expect, it } from 'vitest'
import { extractIncomingTextMessage, isValidRussianPhone, normalizePhoneDigits } from './greenApi'

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

  it('survives gibberish/hostile shapes without throwing', () => {
    const garbageInputs: unknown[] = [
      42,
      true,
      [],
      [1, 2, 3],
      () => {},
      { typeWebhook: 'incomingMessageReceived', senderData: 'not an object' },
      { typeWebhook: 'incomingMessageReceived', messageData: null },
      {
        typeWebhook: 'incomingMessageReceived',
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 12345 } },
        senderData: { senderPhoneNumber: 'not actually a number' },
      },
      // numeric fields swapped to strings and vice versa
      {
        typeWebhook: 'incomingMessageReceived',
        timestamp: '1791451817',
        senderData: { chatId: 468995439, senderPhoneNumber: '79234245964' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'hi' } },
      },
      // a __proto__ key shouldn't do anything weird — we only ever read
      // named properties, never assign/merge this input anywhere
      JSON.parse('{"typeWebhook":"incomingMessageReceived","__proto__":{"polluted":true}}'),
    ]

    for (const input of garbageInputs) {
      expect(() => extractIncomingTextMessage(input)).not.toThrow()
      expect(extractIncomingTextMessage(input)).toBeNull()
    }
  })

  it('accepts an unusually long message body without truncating it', () => {
    const longText = 'a'.repeat(4000)
    const notification = {
      ...realMaxNotification,
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: longText },
      },
    }
    expect(extractIncomingTextMessage(notification)?.text).toHaveLength(4000)
  })
})

describe('normalizePhoneDigits', () => {
  it('strips formatting from an already-international number', () => {
    expect(normalizePhoneDigits('+7 999 123-45-67')).toBe('79991234567')
  })

  it('converts the Russian local-format leading 8 to the 7 country code', () => {
    expect(normalizePhoneDigits('8 999 123-45-67')).toBe('79991234567')
  })

  it('leaves non-Russian numbers alone', () => {
    expect(normalizePhoneDigits('+1 415 555 0132')).toBe('14155550132')
  })

  it('only applies the 8->7 swap at exactly 11 digits, never a different length', () => {
    // 12 digits starting with 8 — not the Russian local-format case, left alone
    expect(normalizePhoneDigits('8 999 123-45-678')).toBe('899912345678')
    // 10 digits starting with 8 — also not the local-format case
    expect(normalizePhoneDigits('8 99 123-45-67')).toBe('8991234567')
  })

  it('reduces to empty string for input with no digits at all', () => {
    expect(normalizePhoneDigits('')).toBe('')
    expect(normalizePhoneDigits('abc def')).toBe('')
    expect(normalizePhoneDigits('   ')).toBe('')
    expect(normalizePhoneDigits('+-() ')).toBe('')
  })

  it('strips gibberish, emoji, and script-tag-shaped input down to only its digits', () => {
    // the "1" inside "alert(1)" is a real digit too — normalizePhoneDigits
    // doesn't know about markup, it just keeps every ASCII digit it sees
    expect(normalizePhoneDigits('<script>alert(1)</script>7999123')).toBe('17999123')
    // keycap emoji ("7️⃣") are the ASCII digit "7" plus combining marks —
    // the digit survives, only the marks and the party emoji get stripped
    expect(normalizePhoneDigits('7️⃣9️⃣9️⃣9️⃣ 🎉🎉')).toBe('7999')
    expect(normalizePhoneDigits('7999!!!1234###5678@@@')).toBe('799912345678')
  })

  it('never throws regardless of input shape', () => {
    const inputs = ['a'.repeat(10000), '\u0000\u0000', 'NaN', 'Infinity', '-7999123456']
    for (const input of inputs) {
      expect(() => normalizePhoneDigits(input)).not.toThrow()
    }
  })
})

describe('isValidRussianPhone', () => {
  it('accepts exactly 11 digits starting with 7', () => {
    expect(isValidRussianPhone('79991234567')).toBe(true)
  })

  it('rejects anything shorter or longer than 11 digits', () => {
    expect(isValidRussianPhone('')).toBe(false)
    expect(isValidRussianPhone('7999123456')).toBe(false) // 10 — one short
    expect(isValidRussianPhone('799912345678')).toBe(false) // 12 — the reported bug case
    expect(isValidRussianPhone('7'.repeat(50))).toBe(false)
  })

  it('rejects 11 digits that start with anything other than 7', () => {
    expect(isValidRussianPhone('89991234567')).toBe(false) // pre-normalization 8-prefix
    expect(isValidRussianPhone('14155550132')).toBe(false) // a real US number, 11 digits
  })
})
