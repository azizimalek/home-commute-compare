import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { sortCommuteResults } from '../lib/compareUtils'
import { fetchDistanceMatrix } from '../lib/distanceMatrix'
import type { CommuteResult, LocationPoint, RankBy, TravelMode } from '../types'

interface UseDistanceMatrixReturn {
  results: CommuteResult[]
  loading: boolean
  error: string | null
  compare: (
    homes: LocationPoint[],
    work: LocationPoint,
    travelMode: TravelMode,
    rankBy: RankBy,
    showReturnTrip: boolean,
  ) => void
  clearResults: () => void
  setResults: Dispatch<SetStateAction<CommuteResult[]>>
}

function parseElement(
  element: google.maps.DistanceMatrixResponseElement | undefined,
): Pick<
  CommuteResult,
  | 'durationText'
  | 'durationSeconds'
  | 'distanceText'
  | 'distanceMeters'
  | 'status'
  | 'errorMessage'
> {
  if (!element || element.status !== 'OK') {
    return {
      durationText: '—',
      durationSeconds: Infinity,
      distanceText: '—',
      distanceMeters: 0,
      status: 'ERROR',
      errorMessage: element?.status ?? 'No route found',
    }
  }

  const duration = element.duration_in_traffic ?? element.duration

  return {
    durationText: duration.text,
    durationSeconds: duration.value,
    distanceText: element.distance.text,
    distanceMeters: element.distance.value,
    status: 'OK',
  }
}

export function useDistanceMatrix(initialResults: CommuteResult[] = []): UseDistanceMatrixReturn {
  const [results, setResults] = useState<CommuteResult[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = useCallback(
    (
      homes: LocationPoint[],
      work: LocationPoint,
      travelMode: TravelMode,
      rankBy: RankBy,
      showReturnTrip: boolean,
    ) => {
      if (homes.length === 0) {
        setError('Add at least one home location to compare.')
        return
      }

      setLoading(true)
      setError(null)

      const homePoints = homes.map((h) => ({ lat: h.lat, lng: h.lng }))
      const workPoint = { lat: work.lat, lng: work.lng }

      void (async () => {
        try {
          const toWorkResponse = await fetchDistanceMatrix(homePoints, [workPoint], travelMode)

          let returnElements: google.maps.DistanceMatrixResponseElement[] = []
          if (showReturnTrip) {
            const returnResponse = await fetchDistanceMatrix([workPoint], homePoints, travelMode)
            returnElements = returnResponse.rows[0]?.elements ?? []
          }

          const commuteResults: CommuteResult[] = homes.map((home, index) => {
            const outbound = parseElement(toWorkResponse.rows[index]?.elements[0])
            const result: CommuteResult = {
              homeId: home.id,
              homeLabel: home.label,
              ...outbound,
            }

            if (showReturnTrip) {
              const ret = parseElement(returnElements[index])
              result.returnDurationText = ret.durationText
              result.returnDurationSeconds = ret.durationSeconds
              result.returnDistanceText = ret.distanceText
              result.returnDistanceMeters = ret.distanceMeters
              result.returnStatus = ret.status
              result.returnErrorMessage = ret.errorMessage
            }

            return result
          })

          setResults(sortCommuteResults(commuteResults, rankBy))
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Compare failed')
        } finally {
          setLoading(false)
        }
      })()
    },
    [],
  )

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, compare, clearResults, setResults }
}
