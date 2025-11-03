import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useWatchingDetection from '@/hooks/services/useWatchingDetection'

describe('useWatchingDetection', () => {
  it('activates watching and requests magnitude when alertLevel >= 0', () => {
    const setIsMag = vi.fn()
    const setAlert = vi.fn()
    const { rerender } = renderHook(({ magnitude, isActive, level, threshold }) =>
      useWatchingDetection(magnitude, isActive, setIsMag, threshold, level, setAlert),
      { initialProps: { magnitude: 0.8, isActive: false, level: 0, threshold: 1.2 } }
    )
    expect(setIsMag).toHaveBeenCalledWith(true)

    rerender({ magnitude: 0.9, isActive: true, level: 0, threshold: 1.2 })
    rerender({ magnitude: 1.0, isActive: true, level: 0, threshold: 1.2 })

    expect(setAlert).toHaveBeenCalledWith(1)
  })

  it('drops back to level 0 when magnitude avg outside window and level >= 1', () => {
    const setIsMag = vi.fn()
    const setAlert = vi.fn()
    const { rerender } = renderHook(({ magnitude, isActive, level, threshold }) =>
      useWatchingDetection(magnitude, isActive, setIsMag, threshold, level, setAlert),
      { initialProps: { magnitude: 1.0, isActive: true, level: 1, threshold: 0.8 } }
    )

    expect(setAlert).toHaveBeenCalledWith(0)

    setAlert.mockClear()
    rerender({ magnitude: 1.5, isActive: true, level: 1, threshold: 0.8 })
    expect(setAlert).toHaveBeenCalledWith(0)
  })
})
