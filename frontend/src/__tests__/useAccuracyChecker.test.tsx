import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useAccuracyChecker from '@/hooks/services/useAccuracyChecker'
import type { Location } from '@/models/location'

describe('useAccuracyChecker', () => {
  const makeLoc = (accuracy: number): Location => ({
    latitude: 0,
    longitude: 0,
    accuracy,
    speed: 0,
    timestamp: new Date(),
  })

  it('drops to level 0 when accuracy > 50 and level >= 1', () => {
    const setAlert = vi.fn()
    const { rerender } = renderHook(({ level, loc }) => useAccuracyChecker(loc, level, setAlert), {
      initialProps: { level: 1, loc: makeLoc(60) },
    })

    expect(setAlert).toHaveBeenCalledWith(0)

    setAlert.mockClear()
    rerender({ level: 3, loc: makeLoc(80) })
    expect(setAlert).toHaveBeenCalledWith(0)
  })

  it('raises from 0 to 1 when accuracy <= 50', () => {
    const setAlert = vi.fn()
    renderHook(() => useAccuracyChecker(makeLoc(30), 0, setAlert))
    expect(setAlert).toHaveBeenCalledWith(1)
  })

  it('does nothing for level -1 or no location', () => {
    const setAlert = vi.fn()
    renderHook(() => useAccuracyChecker(null, -1, setAlert))
    expect(setAlert).not.toHaveBeenCalled()
  })
})
