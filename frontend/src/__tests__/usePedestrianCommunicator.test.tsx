import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import usePedestrianCommunicator from '@/hooks/services/usePedestrianCommunicator'

// Minimal evented socket mock
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
    id: 'sock',
    connected: true,
    on(event, cb) {
      handlers[event] = handlers[event] || []
      handlers[event].push(cb)
    },
    off(event, cb) {
      if (!handlers[event]) return
      if (!cb) delete handlers[event]
      else handlers[event] = handlers[event].filter(h => h !== cb)
    },
    emit: vi.fn(),
    __trigger(event, ...args) {
      for (const h of handlers[event] || []) h(...args)
    }
  }
}

describe('usePedestrianCommunicator', () => {
  afterEach(() => cleanup())
  it('presence: 2 -> 3 when drivers present; 3+ -> 2 when none', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const { rerender } = renderHook(({ level }) =>
      usePedestrianCommunicator(
        123,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 2 } }
    )

    socket.__trigger('presence', { crosswalk_id: 123, driver_count: 1 })
    expect(setAlert).toHaveBeenCalledWith(3)

    setAlert.mockClear()
    rerender({ level: 3 })
    socket.__trigger('presence', { crosswalk_id: 123, driver_count: 0 })
    expect(setAlert).toHaveBeenCalledWith(2)
  })

  it('critical: 2/3 -> 4, alert_end: 4 -> 3', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const { rerender } = renderHook(({ level }) =>
      usePedestrianCommunicator(
        123,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 3 } }
    )

    socket.__trigger('ped_critical', { crosswalk_id: 123, min_distance: 5 })
    expect(setAlert).toHaveBeenCalledWith(4)

    setAlert.mockClear()
    rerender({ level: 4 })
    socket.__trigger('alert_end', { crosswalk_id: 123 })
    expect(setAlert).toHaveBeenCalledWith(3)
  })

  it('re-joins on socket connect when active and valid crosswalk', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    renderHook(() =>
      usePedestrianCommunicator(
        123,
        socket as unknown as import('socket.io-client').Socket,
        2,
        setAlert
      )
    )

    // initial enter
    expect(socket.emit).toHaveBeenCalledWith('ped_enter', { crosswalk_id: 123 })

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()

    // simulate reconnect
    socket.__trigger('connect')
    expect(socket.emit).toHaveBeenCalledWith('ped_enter', { crosswalk_id: 123 })
  })

  it('leaves on alert drop below 2', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const { rerender } = renderHook(({ level }) =>
      usePedestrianCommunicator(
        123,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 2 } }
    )

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()
    rerender({ level: 1 })
    expect(socket.emit).toHaveBeenCalledWith('ped_leave', { crosswalk_id: 123 })
  })

  it('changes crosswalk: leaves old and enters new', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const { rerender } = renderHook(({ id }) =>
      usePedestrianCommunicator(
        id,
        socket as unknown as import('socket.io-client').Socket,
        2,
        setAlert
      ),
      { initialProps: { id: 123 } }
    )

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()

    rerender({ id: 999 })

    expect(socket.emit).toHaveBeenCalledWith('ped_leave', { crosswalk_id: 123 })
    expect(socket.emit).toHaveBeenCalledWith('ped_enter', { crosswalk_id: 999 })
  })

  it('ignores presence for different crosswalk id', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    renderHook(() =>
      usePedestrianCommunicator(
        123,
        socket as unknown as import('socket.io-client').Socket,
        2,
        setAlert
      )
    )

    // presence for other id should be ignored
    socket.__trigger('presence', { crosswalk_id: 999, driver_count: 1 })
    expect(setAlert).not.toHaveBeenCalled()
  })

  it('cleanup on unmount emits ped_leave', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const { unmount } = renderHook(() =>
      usePedestrianCommunicator(
        123,
        socket as unknown as import('socket.io-client').Socket,
        2,
        setAlert
      )
    )

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()
    unmount()

    expect(socket.emit).toHaveBeenCalledWith('ped_leave', { crosswalk_id: 123 })
  })
})
