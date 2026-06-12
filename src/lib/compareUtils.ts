import type { CommuteResult, RankBy, RoutePreference } from '../types'

export function sortCommuteResults(
  results: CommuteResult[],
  rankBy: RankBy,
): CommuteResult[] {
  const sorted = [...results]
  if (rankBy === 'DISTANCE') {
    sorted.sort((a, b) => a.distanceMeters - b.distanceMeters)
  } else {
    sorted.sort((a, b) => a.durationSeconds - b.durationSeconds)
  }
  return sorted
}

export function routeTotalDistance(route: google.maps.DirectionsRoute): number {
  return route.legs?.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0) ?? 0
}

export function routeTotalDuration(route: google.maps.DirectionsRoute): number {
  return route.legs?.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0) ?? 0
}

export function pickDirectionsRoute(
  routes: google.maps.DirectionsRoute[],
  preference: RoutePreference,
): google.maps.DirectionsRoute {
  if (routes.length === 0) throw new Error('No routes returned')
  if (routes.length === 1 || preference === 'NORMAL') return routes[0]

  return routes.reduce((shortest, route) =>
    routeTotalDistance(route) < routeTotalDistance(shortest) ? route : shortest,
  )
}
