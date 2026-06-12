export type TravelMode = 'DRIVING' | 'TRANSIT' | 'WALKING' | 'BICYCLING'

export type MarkerMode = 'work' | 'home'

export type MapInteractionMode = 'pan' | 'select'

export type MapType = 'roadmap' | 'satellite'

/** How to rank home candidates after comparing */
export type RankBy = 'TIME' | 'DISTANCE'

/** NORMAL = Google recommended main-road route; SHORTCUT = shortest distance path */
export type RoutePreference = 'NORMAL' | 'SHORTCUT'

export interface LocationPoint {
  id: string
  lat: number
  lng: number
  label: string
  address?: string
}

export type TripDirection = 'OUTBOUND' | 'RETURN'

export interface CommuteResult {
  homeId: string
  homeLabel: string
  durationText: string
  durationSeconds: number
  distanceText: string
  distanceMeters: number
  status: 'OK' | 'ERROR'
  errorMessage?: string
  returnDurationText?: string
  returnDurationSeconds?: number
  returnDistanceText?: string
  returnDistanceMeters?: number
  returnStatus?: 'OK' | 'ERROR'
  returnErrorMessage?: string
}
