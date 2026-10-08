import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useChatSession } from './useChatSession'
import type { PollOptions } from '../api/greenApi'

const credentials = { idInstance: '1', apiTokenInstance: 'tok' }

function createFakePoll() {
  let captured: PollOptions | null = null
  const pollForMessages = vi.fn((options: PollOptions) => {
    captured = options
    return new Promise<void>(() => {}) // mirrors the real loop: resolves only once aborted
  })
  return {
    pollForMessages,
    emitIncoming: (text: string, timestamp = 0, chatId = '468995439') => {
      act(() => {
        captured?.onIncomingText(text, timestamp, chatId)
      })
    },
  }
}

function createFakeReadChat() {
  return vi.fn().mockResolvedValue(undefined)
}

describe('useChatSession', () => {
  it('shows an incoming message and marks the chat read', () => {
    const { pollForMessages, emitIncoming } = createFakePoll()
    const readChat = createFakeReadChat()
    const { result } = renderHook(() =>
      useChatSession(credentials, '79991234567', { pollForMessages, readChat }),
    )

    emitIncoming('hello', 100)

    expect(result.current.messages).toEqual([
      expect.objectContaining({ direction: 'incoming', text: 'hello', timestamp: 100 }),
    ])
    // readChat must use the opaque chatId from the notification, not
    // "{phone}@c.us" — GREEN-API silently no-ops (setRead: false) on that.
    expect(readChat).toHaveBeenCalledWith(credentials, '468995439')
  })

  it('optimistically shows the outgoing message, then marks it sent once sendMessage resolves', async () => {
    const { pollForMessages } = createFakePoll()
    const sendMessage = vi.fn().mockResolvedValue({ idMessage: '1' })
    const readChat = createFakeReadChat()
    const { result } = renderHook(() =>
      useChatSession(credentials, '79991234567', { pollForMessages, sendMessage, readChat }),
    )

    await act(async () => {
      result.current.sendText('hi there')
    })

    expect(sendMessage).toHaveBeenCalledWith(credentials, '79991234567@c.us', 'hi there')
    expect(result.current.messages).toEqual([
      expect.objectContaining({ direction: 'outgoing', text: 'hi there', status: 'sent' }),
    ])
  })

  it('marks the message failed when sendMessage rejects', async () => {
    const { pollForMessages } = createFakePoll()
    const sendMessage = vi.fn().mockRejectedValue(new Error('network error'))
    const readChat = createFakeReadChat()
    const { result } = renderHook(() =>
      useChatSession(credentials, '79991234567', { pollForMessages, sendMessage, readChat }),
    )

    await act(async () => {
      result.current.sendText('hi there')
    })

    expect(result.current.messages).toEqual([
      expect.objectContaining({ direction: 'outgoing', text: 'hi there', status: 'failed' }),
    ])
  })

  it('ignores blank input', () => {
    const { pollForMessages } = createFakePoll()
    const sendMessage = vi.fn()
    const readChat = createFakeReadChat()
    const { result } = renderHook(() =>
      useChatSession(credentials, '79991234567', { pollForMessages, sendMessage, readChat }),
    )

    act(() => {
      result.current.sendText('   ')
    })

    expect(sendMessage).not.toHaveBeenCalled()
    expect(result.current.messages).toEqual([])
  })
})
