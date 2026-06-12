import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { sortCommuteResults } from '../lib/compareUtils'
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
  ) => void
  clearResults: () => void
  setResults: Dispatch<SetStateAction<CommuteResult[]>>
}

export function useDistanceMatrix(initialResults: CommuteResult[] = []): UseDistanceMatrixReturn {
  const [results, setResults] = useState<CommuteResult[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = useCallback(
    (homes: LocationPoint[], work: LocationPoint, travelMode: TravelMode, rankBy: RankBy) => {
      if (homes.length === 0) {
        setError('Add at least one home location to compare.')
        return
      }

      setLoading(true)
      setError(null)

      const travelModeMap: Record<TravelMode, google.maps.TravelMode> = {
        DRIVING: google.maps.TravelMode.DRIVING,
        TRANSIT: google.maps.TravelMode.TRANSIT,
        WALKING: google.maps.TravelMode.WALKING,
        BICYCLING: google.maps.TravelMode.BICYCLING,
      }

      const service = new google.maps.DistanceMatrixService()
      const origins = homes.map((h) => new google.maps.LatLng(h.lat, h.lng))
      const destination = new google.maps.LatLng(work.lat, work.lng)

      const request: google.maps.DistanceMatrixRequest = {
        origins,
        destinations: [destination],
        travelMode: travelModeMap[travelMode],
        unitSystem: google.maps.UnitSystem.METRIC,
      }

      if (travelMode === 'DRIVING') {
        request.drivingOptions = {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        }
      }

      service.getDistanceMatrix(request, (response, status) => {
        setLoading(false)

        if (status !== 'OK' || !response) {
          setError(`Distance Matrix request failed: ${status}`)
          return
        }

        const commuteResults: CommuteResult[] = homes.map((home, index) => {
          const element = response.rows[index]?.elements[0]

          if (!element || element.status !== 'OK') {
            return {
              homeId: home.id,
              homeLabel: home.label,
              durationText: '—',
              durationSeconds: Infinity,
              distanceText: '—',
              distanceMeters: 0,
              status: 'ERROR' as const,
              errorMessage: element?.status ?? 'No route found',
            }
          }

          const duration = element.duration_in_traffic ?? element.duration

          return {
            homeId: home.id,
            homeLabel: home.label,
            durationText: duration.text,
            durationSeconds: duration.value,
            distanceText: element.distance.text,
            distanceMeters: element.distance.value,
            status: 'OK' as const,
          }
        })

        setResults(sortCommuteResults(commuteResults, rankBy))
      })
    },
    [],
  )

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, compare, clearResults, setResults }
}
