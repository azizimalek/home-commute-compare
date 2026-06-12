import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useRef } from 'react'
import type { MarkerMode } from '../types'

export interface PlaceSelection {
  lat: number
  lng: number
  address: string
}

interface LocationSearchProps {
  markerMode: MarkerMode
  onPlaceSelect: (place: PlaceSelection) => void
}

export function LocationSearch({ markerMode, onPlaceSelect }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const places = useMapsLibrary('places')

  useEffect(() => {
    if (!places || !inputRef.current) return

    const autocomplete = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'my' },
      fields: ['geometry', 'formatted_address', 'name'],
    })

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const lat = place.geometry?.location?.lat()
      const lng = place.geometry?.location?.lng()
      if (lat == null || lng == null) return

      onPlaceSelect({
        lat,
        lng,
        address: place.formatted_address ?? place.name ?? '',
      })

      if (inputRef.current) inputRef.current.value = ''
    })

    return () => listener.remove()
  }, [places, onPlaceSelect])

  const placeholder =
    markerMode === 'work'
      ? 'Search for work location…'
      : 'Search for a home location…'

  return (
    <div className="search">
      <input
        ref={inputRef}
        type="text"
        className="search__input"
        placeholder={placeholder}
        autoComplete="off"
      />
      <p className="search__hint">
        Search is limited to Malaysia. Results add a {markerMode} marker.
      </p>
    </div>
  )
}
