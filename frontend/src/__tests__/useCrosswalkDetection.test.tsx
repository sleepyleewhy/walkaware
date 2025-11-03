import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useCrosswalkDetection from '@/hooks/services/useCrosswalkDetection'

type Handler = (...args: unknown[]) => void
interface MinimalSocket {
  id: string
  connected: boolean
  on(event: string, cb: Handler): void
  off(event: string, cb?: Handler): void
  emit: (event: string, ...args: unknown[]) => void
  __trigger(event: string, ...args: unknown[]): void
}

function createSocketMock(): MinimalSocket {
  const handlers: Record<string, Handler[]> = {}
  return {
    id: 'sock1',
    connected: true,
    on: (event: string, cb: Handler) => {
      handlers[event] = handlers[event] || []
      handlers[event].push(cb)
    },
    off: (event: string, cb?: Handler) => {
      if (!handlers[event]) return
      if (!cb) delete handlers[event]
      else handlers[event] = handlers[event].filter(h => h !== cb)
    },
    emit: vi.fn(),
    __trigger(event: string, ...args: unknown[]) {
      for (const h of handlers[event] || []) h(...args)
    }
  }
}

describe('useCrosswalkDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.setItem('user_guid', 'u1')
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('raises 1->2 on true prediction, and back to 1 after 5 falses', () => {
  const socket = createSocketMock()
    const setAlert = vi.fn()
    const setCam = vi.fn()

    renderHook(() =>
      useCrosswalkDetection(
        socket as unknown as import('socket.io-client').Socket,
        '',
        1,
        setAlert,
        false,
        setCam,
        false
      )
    )

  socket.__trigger('predict_result_u1', true)
    expect(setAlert).toHaveBeenCalledWith(2)

    setAlert.mockClear()
    for (let i = 0; i < 5; i++) {
      socket.__trigger('predict_result_u1', false)
    }
    expect(setAlert).toHaveBeenCalledWith(1)
  })
})
