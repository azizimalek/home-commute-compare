import { useCallback, useRef } from 'react'

export function useGeocoder() {
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder()
    }

    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } })
      return response.results[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }, [])

  return { reverseGeocode }
}
