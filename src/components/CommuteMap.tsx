import { Map, useMap } from '@vis.gl/react-google-maps'
import { useCallback, useEffect } from 'react'
import type {
  CommuteResult,
  LocationPoint,
  MapInteractionMode,
  MapType,
  MarkerMode,
  RoutePreference,
  TravelMode,
} from '../types'
import { PinMarker } from './PinMarker'
import { RouteLayer } from './RouteLayer'

// Shah Alam, Selangor, Malaysia
export const DEFAULT_CENTER = { lat: 3.0738, lng: 101.5183 }
const DEFAULT_ZOOM = 11

interface CommuteMapProps {
  work: LocationPoint | null
  homes: LocationPoint[]
  results: CommuteResult[]
  travelMode: TravelMode
  routePreference: RoutePreference
  markerMode: MarkerMode
  interactionMode: MapInteractionMode
  mapType: MapType
  onMapClick: (lat: number, lng: number) => void
  onWorkDrag: (lat: number, lng: number) => void
  onHomeDrag: (id: string, lat: number, lng: number) => void
  focusPoint: { lat: number; lng: number } | null
}

function MapClickHandler({
  interactionMode,
  onMapClick,
}: {
  interactionMode: MapInteractionMode
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || interactionMode !== 'select') return

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat()
      const lng = e.latLng?.lng()
      if (lat != null && lng != null) onMapClick(lat, lng)
    })

    return () => listener.remove()
  }, [map, interactionMode, onMapClick])

  useEffect(() => {
    if (!map) return
    map.setOptions({
      draggableCursor: interactionMode === 'select' ? 'crosshair' : undefined,
      draggingCursor: interactionMode === 'select' ? 'crosshair' : undefined,
    })
  }, [map, interactionMode])

  return null
}

function MapTypeController({ mapType }: { mapType: MapType }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    map.setMapTypeId(mapType === 'satellite' ? 'hybrid' : 'roadmap')
  }, [map, mapType])

  return null
}

function FitBounds({ work, homes }: { work: LocationPoint | null; homes: LocationPoint[] }) {
  const map = useMap()

  const fit = useCallback(() => {
    if (!map) return
    const points = [...homes, ...(work ? [work] : [])]
    if (points.length === 0) return

    if (points.length === 1) {
      map.setCenter({ lat: points[0].lat, lng: points[0].lng })
      map.setZoom(14)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
    map.fitBounds(bounds, 80)
  }, [map, work, homes])

  useEffect(() => {
    fit()
  }, [fit])

  return null
}

function FocusPoint({ point }: { point: { lat: number; lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !point) return
    map.panTo(point)
    const zoom = map.getZoom()
    if (zoom != null && zoom < 14) map.setZoom(14)
  }, [map, point])

  return null
}

function overlayMessage(interactionMode: MapInteractionMode, markerMode: MarkerMode): string {
  if (interactionMode === 'pan') {
    return 'Pan mode — drag the map to explore'
  }
  return markerMode === 'work'
    ? 'Select mode — click the map to set work'
    : 'Select mode — click the map to add a home'
}

export function CommuteMap({
  work,
  homes,
  results,
  travelMode,
  routePreference,
  markerMode,
  interactionMode,
  mapType,
  onMapClick,
  onWorkDrag,
  onHomeDrag,
  focusPoint,
}: CommuteMapProps) {
  return (
    <div className="map-container">
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        fullscreenControl
        mapTypeControl={false}
        streetViewControl={false}
      >
        <MapTypeController mapType={mapType} />
        <MapClickHandler interactionMode={interactionMode} onMapClick={onMapClick} />
        <FitBounds work={work} homes={homes} />
        <FocusPoint point={focusPoint} />
        <RouteLayer
          work={work}
          homes={homes}
          results={results}
          travelMode={travelMode}
          routePreference={routePreference}
        />

        {work && (
          <PinMarker
            position={{ lat: work.lat, lng: work.lng }}
            label="Work"
            variant="work"
            onDragEnd={onWorkDrag}
          />
        )}

        {homes.map((home) => (
          <PinMarker
            key={home.id}
            position={{ lat: home.lat, lng: home.lng }}
            label={home.label}
            variant="home"
            onDragEnd={(lat, lng) => onHomeDrag(home.id, lat, lng)}
          />
        ))}
      </Map>

      <div className={`map-overlay map-overlay--${interactionMode}`}>
        {overlayMessage(interactionMode, markerMode)}
      </div>
    </div>
  )
}
