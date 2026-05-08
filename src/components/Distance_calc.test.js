import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Calc_Distance_Multi } from './Distance_calc.js'

describe('Calc_Distance_Multi', () => {
  let getDistanceMatrix

  beforeEach(() => {
    getDistanceMatrix = vi.fn()
    globalThis.window = {
      google: {
        maps: {
          DistanceMatrixService: function () {
            this.getDistanceMatrix = getDistanceMatrix
          },
        },
      },
    }
  })

  afterEach(() => {
    delete globalThis.window
  })

  it('resolves with distance values when the API returns OK', async () => {
    getDistanceMatrix.mockImplementation((_req, cb) => {
      cb(
        { rows: [{ elements: [{ distance: { value: 1234 } }, { distance: { value: 5678 } }] }] },
        'OK',
      )
    })

    const result = await Calc_Distance_Multi('A', ['B', 'C'])

    expect(result).toEqual([1234, 5678])
  })

  it('rejects with the status when the API does not return OK', async () => {
    getDistanceMatrix.mockImplementation((_req, cb) => cb(null, 'ZERO_RESULTS'))

    await expect(Calc_Distance_Multi('A', ['B'])).rejects.toBe('ZERO_RESULTS')
  })

  it('passes origin and destinations through to the service', async () => {
    getDistanceMatrix.mockImplementation((_req, cb) => {
      cb({ rows: [{ elements: [{ distance: { value: 1 } }] }] }, 'OK')
    })

    await Calc_Distance_Multi('Origin Address', ['Dest 1'])

    expect(getDistanceMatrix).toHaveBeenCalledWith(
      { origins: ['Origin Address'], destinations: ['Dest 1'], travelMode: 'DRIVING' },
      expect.any(Function),
    )
  })
})
