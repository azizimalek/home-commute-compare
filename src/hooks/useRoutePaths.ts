import { useApiIsLoaded } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import { pickDirectionsRoute } from '../lib/compareUtils'
import type {
  CommuteResult,
  LocationPoint,
  RoutePreference,
  TravelMode,
  TripDirection,
} from '../types'

export interface RoutePath {
  id: string
  path: google.maps.LatLngLiteral[]
  color: string
  durationText: string
  isBest: boolean
  direction: TripDirection
}

const ROUTE_COLORS = ['#059669', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0891b2']

function travelModeToGoogle(mode: TravelMode): google.maps.TravelMode {
  const map: Record<TravelMode, google.maps.TravelMode> = {
    DRIVING: google.maps.TravelMode.DRIVING,
    TRANSIT: google.maps.TravelMode.TRANSIT,
    WALKING: google.maps.TravelMode.WALKING,
    BICYCLING: google.maps.TravelMode.BICYCLING,
  }
  return map[mode]
}

function supportsRouteAlternatives(travelMode: TravelMode): boolean {
  return travelMode === 'DRIVING' || travelMode === 'BICYCLING'
}

function extractPath(route: google.maps.DirectionsRoute): google.maps.LatLngLiteral[] {
  if (route.overview_path?.length) {
    return route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))
  }

  const polyline = route.overview_polyline
  const encoded =
    typeof polyline === 'string'
      ? polyline
      : (polyline as { points?: string } | undefined)?.points
  if (encoded && google.maps.geometry?.encoding) {
    return google.maps.geometry.encoding
      .decodePath(encoded)
      .map((p) => ({ lat: p.lat(), lng: p.lng() }))
  }

  const fromLegs: google.maps.LatLngLiteral[] = []
  route.legs?.forEach((leg) => {
    leg.steps?.forEach((step) => {
      step.path?.forEach((p) => fromLegs.push({ lat: p.lat(), lng: p.lng() }))
    })
  })
  return fromLegs
}

function straightLinePath(
  from: google.maps.LatLngLiteral,
  to: google.maps.LatLngLiteral,
): google.maps.LatLngLiteral[] {
  return [from, to]
}

function fetchRoute(
  service: google.maps.DirectionsService,
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  travelMode: TravelMode,
  routePreference: RoutePreference,
): Promise<google.maps.LatLngLiteral[]> {
  return new Promise((resolve) => {
    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      travelMode: travelModeToGoogle(travelMode),
      region: 'my',
      provideRouteAlternatives:
        routePreference === 'SHORTCUT' && supportsRouteAlternatives(travelMode),
    }

    if (travelMode === 'DRIVING') {
      request.drivingOptions = {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS,
      }
    }

    service.route(request, (response, status) => {
      if (status === 'OK' && response?.routes.length) {
        try {
          const route = pickDirectionsRoute(response.routes, routePreference)
          const path = extractPath(route)
          if (path.length > 0) {
            resolve(path)
            return
          }
        } catch {
          // fall through to straight line
        }
      }
      resolve(straightLinePath(origin, destination))
    })
  })
}

export function useRoutePaths(
  work: LocationPoint | null,
  homes: LocationPoint[],
  results: CommuteResult[],
  travelMode: TravelMode,
  routePreference: RoutePreference,
  showReturnTrip: boolean,
): RoutePath[] {
  const [routes, setRoutes] = useState<RoutePath[]>([])
  const apiLoaded = useApiIsLoaded()

  useEffect(() => {
    if (!apiLoaded || !work || results.length === 0) {
      setRoutes([])
      return
    }

    let cancelled = false
    const service = new google.maps.DirectionsService()
    const okResults = results.filter((r) => r.status === 'OK')
    const workPoint = { lat: work.lat, lng: work.lng }

    void (async () => {
      const fetched: RoutePath[] = []

      for (const [index, result] of okResults.entries()) {
        const home = homes.find((h) => h.id === result.homeId)
        if (!home) continue

        const color = ROUTE_COLORS[index % ROUTE_COLORS.length]
        const homePoint = { lat: home.lat, lng: home.lng }
        const isBest = index === 0

        const outboundPath = await fetchRoute(
          service,
          homePoint,
          workPoint,
          travelMode,
          routePreference,
        )
        fetched.push({
          id: `${result.homeId}-outbound`,
          path: outboundPath,
          color,
          durationText: result.durationText,
          isBest,
          direction: 'OUTBOUND',
        })

        if (showReturnTrip && result.returnStatus === 'OK') {
          const returnPath = await fetchRoute(
            service,
            workPoint,
            homePoint,
            travelMode,
            routePreference,
          )
          fetched.push({
            id: `${result.homeId}-return`,
            path: returnPath,
            color,
            durationText: result.returnDurationText ?? '—',
            isBest,
            direction: 'RETURN',
          })
        }
      }

      if (!cancelled) setRoutes(fetched)
    })()

    return () => {
      cancelled = true
    }
  }, [apiLoaded, work, homes, results, travelMode, routePreference, showReturnTrip])

  return routes
}
