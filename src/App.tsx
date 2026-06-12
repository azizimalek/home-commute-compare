import { APIProvider } from '@vis.gl/react-google-maps'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { CommuteMap } from './components/CommuteMap'
import { ComparisonPanel } from './components/ComparisonPanel'
import { LocationSearch, type PlaceSelection } from './components/LocationSearch'
import { useDistanceMatrix } from './hooks/useDistanceMatrix'
import { useGeocoder } from './hooks/useGeocoder'
import { sortCommuteResults } from './lib/compareUtils'
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
} from './lib/storage'
import type {
  LocationPoint,
  MapInteractionMode,
  MapType,
  MarkerMode,
  RankBy,
  RoutePreference,
  TravelMode,
} from './types'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

const TRAVEL_MODES: { value: TravelMode; label: string }[] = [
  { value: 'DRIVING', label: 'Driving' },
  { value: 'TRANSIT', label: 'Transit' },
  { value: 'WALKING', label: 'Walking' },
  { value: 'BICYCLING', label: 'Cycling' },
]

function createId() {
  return crypto.randomUUID()
}

function nextDefaultHomeLabel(homes: LocationPoint[]): string {
  const used = new Set(homes.map((h) => h.label))
  let n = 1
  while (used.has(`Home ${n}`)) n++
  return `Home ${n}`
}

function AppContent() {
  const saved = useRef(loadPersistedState()).current

  const [work, setWork] = useState<LocationPoint | null>(saved?.work ?? null)
  const [homes, setHomes] = useState<LocationPoint[]>(saved?.homes ?? [])
  const [markerMode, setMarkerMode] = useState<MarkerMode>(saved?.markerMode ?? 'work')
  const [interactionMode, setInteractionMode] = useState<MapInteractionMode>(
    saved?.interactionMode ?? 'pan',
  )
  const [travelMode, setTravelMode] = useState<TravelMode>(saved?.travelMode ?? 'DRIVING')
  const [rankBy, setRankBy] = useState<RankBy>(saved?.rankBy ?? 'TIME')
  const [routePreference, setRoutePreference] = useState<RoutePreference>(
    saved?.routePreference ?? 'NORMAL',
  )
  const [showReturnTrip, setShowReturnTrip] = useState(saved?.showReturnTrip ?? false)
  const [mapType, setMapType] = useState<MapType>(saved?.mapType ?? 'roadmap')
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number } | null>(null)

  const { reverseGeocode } = useGeocoder()
  const { results, loading, error, compare, clearResults, setResults } = useDistanceMatrix(
    saved?.results ?? [],
  )

  useEffect(() => {
    savePersistedState({
      work,
      homes,
      markerMode,
      interactionMode,
      travelMode,
      rankBy,
      routePreference,
      showReturnTrip,
      mapType,
      results,
    })
  }, [work, homes, markerMode, interactionMode, travelMode, rankBy, routePreference, showReturnTrip, mapType, results])

  const placeLocation = useCallback(
    async (lat: number, lng: number, address?: string) => {
      const resolvedAddress = address ?? (await reverseGeocode(lat, lng))

      if (markerMode === 'work') {
        setWork({
          id: 'work',
          lat,
          lng,
          label: 'Work',
          address: resolvedAddress,
        })
        clearResults()
        return
      }

      setHomes((prev) => [
        ...prev,
        {
          id: createId(),
          lat,
          lng,
          label: nextDefaultHomeLabel(prev),
          address: resolvedAddress,
        },
      ])
      clearResults()
    },
    [markerMode, reverseGeocode, clearResults],
  )

  const handleMapClick = useCallback(
    (lat: number, lng: number) => placeLocation(lat, lng),
    [placeLocation],
  )

  const handlePlaceSelect = useCallback(
    (place: PlaceSelection) => {
      setFocusPoint({ lat: place.lat, lng: place.lng })
      void placeLocation(place.lat, place.lng, place.address)
    },
    [placeLocation],
  )

  const handleWorkDrag = useCallback(
    async (lat: number, lng: number) => {
      const address = await reverseGeocode(lat, lng)
      setWork((prev) => (prev ? { ...prev, lat, lng, address } : null))
      clearResults()
    },
    [reverseGeocode, clearResults],
  )

  const handleHomeDrag = useCallback(
    async (id: string, lat: number, lng: number) => {
      const address = await reverseGeocode(lat, lng)
      setHomes((prev) =>
        prev.map((h) => (h.id === id ? { ...h, lat, lng, address } : h)),
      )
      clearResults()
    },
    [reverseGeocode, clearResults],
  )

  const handleRemoveHome = useCallback(
    (id: string) => {
      setHomes((prev) => prev.filter((h) => h.id !== id))
      clearResults()
    },
    [clearResults],
  )

  const handleRenameHome = useCallback(
    (id: string, label: string) => {
      setHomes((prev) => prev.map((h) => (h.id === id ? { ...h, label } : h)))
      clearResults()
    },
    [clearResults],
  )

  const handleCompare = useCallback(() => {
    if (!work) return
    compare(homes, work, travelMode, rankBy, showReturnTrip)
  }, [compare, homes, work, travelMode, rankBy, showReturnTrip])

  const handleClearAll = useCallback(() => {
    if (!window.confirm('Clear all locations, routes, and saved data?')) return

    clearPersistedState()
    setWork(null)
    setHomes([])
    setMarkerMode('work')
    setInteractionMode('pan')
    setTravelMode('DRIVING')
    setRankBy('TIME')
    setRoutePreference('NORMAL')
    setShowReturnTrip(false)
    setMapType('roadmap')
    setFocusPoint(null)
    clearResults()
  }, [clearResults])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Commute Compare</h1>
          <p className="app__tagline">
            Compare travel times from potential homes to work across Selangor.
          </p>
        </div>
        <button type="button" className="btn btn--danger btn--header" onClick={handleClearAll}>
          Clear all
        </button>
      </header>

      <div className="app__body">
        <aside className="app__sidebar">
          <div className="toolbar">
            <div className="toolbar__group">
              <span className="toolbar__label">Map mode</span>
              <div className="toolbar__toggle">
                <button
                  type="button"
                  className={`toolbar__btn ${interactionMode === 'pan' ? 'toolbar__btn--active toolbar__btn--pan' : ''}`}
                  onClick={() => setInteractionMode('pan')}
                >
                  Pan
                </button>
                <button
                  type="button"
                  className={`toolbar__btn ${interactionMode === 'select' ? 'toolbar__btn--active toolbar__btn--select' : ''}`}
                  onClick={() => setInteractionMode('select')}
                >
                  Select
                </button>
              </div>
            </div>

            <div className="toolbar__group">
              <span className="toolbar__label">Map view</span>
              <div className="toolbar__toggle">
                <button
                  type="button"
                  className={`toolbar__btn ${mapType === 'roadmap' ? 'toolbar__btn--active toolbar__btn--pan' : ''}`}
                  onClick={() => setMapType('roadmap')}
                >
                  Map
                </button>
                <button
                  type="button"
                  className={`toolbar__btn ${mapType === 'satellite' ? 'toolbar__btn--active toolbar__btn--satellite' : ''}`}
                  onClick={() => setMapType('satellite')}
                >
                  Satellite
                </button>
              </div>
            </div>

            <div className="toolbar__group">
              <span className="toolbar__label">Place marker as</span>
              <div className="toolbar__toggle">
                <button
                  type="button"
                  className={`toolbar__btn ${markerMode === 'work' ? 'toolbar__btn--active toolbar__btn--work' : ''}`}
                  onClick={() => setMarkerMode('work')}
                >
                  Work
                </button>
                <button
                  type="button"
                  className={`toolbar__btn ${markerMode === 'home' ? 'toolbar__btn--active toolbar__btn--home' : ''}`}
                  onClick={() => setMarkerMode('home')}
                >
                  Home
                </button>
              </div>
            </div>

            <LocationSearch markerMode={markerMode} onPlaceSelect={handlePlaceSelect} />

            <div className="toolbar__group">
              <label className="toolbar__label" htmlFor="travel-mode">
                Travel mode
              </label>
              <select
                id="travel-mode"
                className="toolbar__select"
                value={travelMode}
                onChange={(e) => {
                  setTravelMode(e.target.value as TravelMode)
                  clearResults()
                }}
              >
                {TRAVEL_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar__group">
              <label className="toolbar__label" htmlFor="rank-by">
                Rank homes by
              </label>
              <select
                id="rank-by"
                className="toolbar__select"
                value={rankBy}
                onChange={(e) => {
                  const next = e.target.value as RankBy
                  setRankBy(next)
                  if (results.length > 0) {
                    setResults(sortCommuteResults(results, next))
                  }
                }}
              >
                <option value="TIME">Travel time (fastest first)</option>
                <option value="DISTANCE">Distance (shortest first)</option>
              </select>
            </div>

            <div className="toolbar__group">
              <label className="toolbar__label" htmlFor="route-preference">
                Route on map
              </label>
              <select
                id="route-preference"
                className="toolbar__select"
                value={routePreference}
                onChange={(e) => setRoutePreference(e.target.value as RoutePreference)}
              >
                <option value="NORMAL">Normal (main roads, traffic-aware)</option>
                <option value="SHORTCUT">Shortcut (shortest distance)</option>
              </select>
            </div>

            <div className="toolbar__group">
              <label className="toolbar__checkbox">
                <input
                  type="checkbox"
                  checked={showReturnTrip}
                  onChange={(e) => {
                    setShowReturnTrip(e.target.checked)
                    clearResults()
                  }}
                />
                Show return trip (work → home) with time &amp; route
              </label>
            </div>
          </div>

          <ComparisonPanel
            results={results}
            homes={homes}
            work={work}
            rankBy={rankBy}
            showReturnTrip={showReturnTrip}
            loading={loading}
            error={error}
            onRemoveHome={handleRemoveHome}
            onRenameHome={handleRenameHome}
            onCompare={handleCompare}
            canCompare={!!work && homes.length > 0}
          />
        </aside>

        <main className="app__map">
          <CommuteMap
            work={work}
            homes={homes}
            results={results}
            travelMode={travelMode}
            routePreference={routePreference}
            showReturnTrip={showReturnTrip}
            markerMode={markerMode}
            interactionMode={interactionMode}
            mapType={mapType}
            onMapClick={handleMapClick}
            onWorkDrag={handleWorkDrag}
            onHomeDrag={handleHomeDrag}
            focusPoint={focusPoint}
          />
        </main>
      </div>
    </div>
  )
}

function MissingApiKey() {
  return (
    <div className="setup">
      <h1>Google Maps API key required</h1>
      <p>
        Create a <code>.env</code> file in the project root with your API key:
      </p>
      <pre>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</pre>
      <p>Enable these APIs in Google Cloud Console:</p>
      <ul>
        <li>Maps JavaScript API</li>
        <li>Distance Matrix API</li>
        <li>Directions API</li>
        <li>Geocoding API</li>
        <li>Places API</li>
      </ul>
      <p>Then restart the dev server with <code>npm run dev</code>.</p>
    </div>
  )
}

export default function App() {
  if (!API_KEY) return <MissingApiKey />

  return (
    <APIProvider apiKey={API_KEY} libraries={['geocoding', 'places', 'geometry']}>
      <AppContent />
    </APIProvider>
  )
}
