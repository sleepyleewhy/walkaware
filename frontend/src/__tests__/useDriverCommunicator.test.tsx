import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import useDriverCommunicator from '@/hooks/services/useDriverCommunicator'
import type { CrosswalkCoordinates } from '@/models/crosswalkCoordinates'

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

describe('useDriverCommunicator alert transitions', () => {
  it('presence: <3 -> 3 when ped present; >=3 -> 2 when none', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const dangered: CrosswalkCoordinates[] = [{ id: 1, lat: 0, lon: 0, distance: 10 }]

    const { rerender } = renderHook(({ level }) =>
      useDriverCommunicator(
        dangered,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 2 } }
    )

    socket.__trigger('presence', { crosswalk_id: 1, ped_count: 1, driver_count: 1, ts: Date.now() })
    expect(setAlert).toHaveBeenCalledWith(3)

    setAlert.mockClear()
    rerender({ level: 3 })
    socket.__trigger('presence', { crosswalk_id: 1, ped_count: 0, driver_count: 1, ts: Date.now() })
    expect(setAlert).toHaveBeenCalledWith(2)
  })

  it('driver_critical: -> 4, alert_end: 4 -> 3 when no criticals left', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const dangered: CrosswalkCoordinates[] = [{ id: 1, lat: 0, lon: 0, distance: 10 }]

    const { rerender } = renderHook(({ level }) =>
      useDriverCommunicator(
        dangered,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 3 } }
    )

    socket.__trigger('driver_critical', { crosswalk_id: 1, ts: Date.now() })
    expect(setAlert).toHaveBeenCalledWith(4)

    setAlert.mockClear()
    rerender({ level: 4 })
    socket.__trigger('alert_end', { crosswalk_id: 1, ts: Date.now() })
    expect(setAlert).toHaveBeenCalledWith(3)
  })
})

describe('useDriverCommunicator extra cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
    cleanup()
  })

  it('leaves all when alert drops below 2', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const dangered: CrosswalkCoordinates[] = [{ id: 1, lat: 0, lon: 0, distance: 10 }]

    const { rerender } = renderHook(({ level }) =>
      useDriverCommunicator(
        dangered,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 3 } }
    )

    expect(socket.emit).toHaveBeenCalledWith('driver_enter', expect.objectContaining({ crosswalk_id: 1 }))

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()

    rerender({ level: 1 })
    expect(socket.emit).toHaveBeenCalledWith('driver_leave', { crosswalk_id: 1 })
  })

  it('leaves removed crosswalk IDs when dangered list shrinks', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    let dangered: CrosswalkCoordinates[] = [
      { id: 1, lat: 0, lon: 0, distance: 10 },
      { id: 2, lat: 0, lon: 0, distance: 20 },
    ]

    const { rerender } = renderHook(({ level, list }) =>
      useDriverCommunicator(
        list,
        socket as unknown as import('socket.io-client').Socket,
        level,
        setAlert
      ),
      { initialProps: { level: 3, list: dangered } }
    )

    expect(socket.emit).toHaveBeenCalledWith('driver_enter', expect.objectContaining({ crosswalk_id: 1 }))
    expect(socket.emit).toHaveBeenCalledWith('driver_enter', expect.objectContaining({ crosswalk_id: 2 }))

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()

    dangered = [{ id: 2, lat: 0, lon: 0, distance: 20 }]
    rerender({ level: 3, list: dangered })

    expect(socket.emit).toHaveBeenCalledWith('driver_leave', { crosswalk_id: 1 })
  })

  it('emits periodic driver_update with distance and speed payload', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const dangered: CrosswalkCoordinates[] = [{ id: 1, lat: 0, lon: 0, distance: 12, speed: null }]

    renderHook(() =>
      useDriverCommunicator(
        dangered,
        socket as unknown as import('socket.io-client').Socket,
        3,
        setAlert
      )
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(socket.emit).toHaveBeenCalledWith(
      'driver_update',
      expect.objectContaining({ crosswalk_id: 1, distance: 12, speed: null })
    )
  })

  it('presence ignored while there are active criticals', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const dangered: CrosswalkCoordinates[] = [{ id: 1, lat: 0, lon: 0, distance: 10 }]

    renderHook(() =>
      useDriverCommunicator(
        dangered,
        socket as unknown as import('socket.io-client').Socket,
        3,
        setAlert
      )
    )

    socket.__trigger('driver_critical', { crosswalk_id: 1, ts: Date.now() })

    setAlert.mockClear()
    socket.__trigger('presence', { crosswalk_id: 1, ped_count: 0, driver_count: 1, ts: Date.now() })

    expect(setAlert).not.toHaveBeenCalledWith(2)
  })

  it('cleanup on unmount emits driver_leave for all joined', () => {
    const socket = createSocketMock()
    const setAlert = vi.fn()

    const dangered: CrosswalkCoordinates[] = [
      { id: 1, lat: 0, lon: 0, distance: 10 },
      { id: 2, lat: 0, lon: 0, distance: 20 },
    ]

    const { unmount } = renderHook(() =>
      useDriverCommunicator(
        dangered,
        socket as unknown as import('socket.io-client').Socket,
        3,
        setAlert
      )
    )

    ;(socket.emit as unknown as { mockClear: () => void }).mockClear()
    unmount()

    expect(socket.emit).toHaveBeenCalledWith('driver_leave', { crosswalk_id: 1 })
    expect(socket.emit).toHaveBeenCalledWith('driver_leave', { crosswalk_id: 2 })
  })
})
