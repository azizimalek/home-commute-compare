import type {
  CommuteResult,
  LocationPoint,
  MapInteractionMode,
  MapType,
  MarkerMode,
  RankBy,
  RoutePreference,
  TravelMode,
} from '../types'

const STORAGE_KEY = 'commute-compare-state'
const VERSION = 3

export interface PersistedAppState {
  version: typeof VERSION
  work: LocationPoint | null
  homes: LocationPoint[]
  markerMode: MarkerMode
  interactionMode: MapInteractionMode
  travelMode: TravelMode
  mapType: MapType
  rankBy: RankBy
  routePreference: RoutePreference
  showReturnTrip: boolean
  results: CommuteResult[]
}

export function loadPersistedState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const version = parsed.version as number | undefined

    if (version === 1) {
      return {
        work: (parsed.work as LocationPoint | null) ?? null,
        homes: (parsed.homes as LocationPoint[]) ?? [],
        markerMode: (parsed.markerMode as MarkerMode) ?? 'work',
        interactionMode: (parsed.interactionMode as MapInteractionMode) ?? 'pan',
        travelMode: (parsed.travelMode as TravelMode) ?? 'DRIVING',
        mapType: (parsed.mapType as MapType) ?? 'roadmap',
        rankBy: 'TIME',
        routePreference: 'NORMAL',
        showReturnTrip: false,
        results: (parsed.results as CommuteResult[]) ?? [],
        version: VERSION,
      }
    }

    if (version === 2) {
      return {
        work: (parsed.work as LocationPoint | null) ?? null,
        homes: (parsed.homes as LocationPoint[]) ?? [],
        markerMode: (parsed.markerMode as MarkerMode) ?? 'work',
        interactionMode: (parsed.interactionMode as MapInteractionMode) ?? 'pan',
        travelMode: (parsed.travelMode as TravelMode) ?? 'DRIVING',
        mapType: (parsed.mapType as MapType) ?? 'roadmap',
        rankBy: (parsed.rankBy as RankBy) ?? 'TIME',
        routePreference: (parsed.routePreference as RoutePreference) ?? 'NORMAL',
        showReturnTrip: false,
        results: (parsed.results as CommuteResult[]) ?? [],
        version: VERSION,
      }
    }

    if (version !== VERSION) return null

    return parsed as unknown as PersistedAppState
  } catch {
    return null
  }
}

export function savePersistedState(state: Omit<PersistedAppState, 'version'>): void {
  try {
    const payload: PersistedAppState = { version: VERSION, ...state }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota or private browsing errors
  }
}

export function clearPersistedState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
