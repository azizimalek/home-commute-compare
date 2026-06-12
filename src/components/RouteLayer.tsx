import { Marker, Polyline, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { useMemo } from 'react'
import { useRoutePaths } from '../hooks/useRoutePaths'
import type { CommuteResult, LocationPoint, RoutePreference, TravelMode } from '../types'

function createDurationLabelIcon(
  text: string,
  color: string,
  isReturn: boolean,
): google.maps.Icon | undefined {
  if (typeof google === 'undefined' || !google.maps?.Size) return undefined

  const label = isReturn ? `↩ ${text}` : text
  const width = Math.max(64, label.length * 7 + 20)
  const height = 26
  const fill = isReturn ? '#6b7280' : color
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="6"
        fill="${fill}" stroke="#ffffff" stroke-width="2"
        ${isReturn ? 'stroke-dasharray="4 2"' : ''}/>
      <text x="${width / 2}" y="17" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#ffffff">
        ${label}
      </text>
    </svg>
  `
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height / 2),
  }
}

function labelPosition(
  path: google.maps.LatLngLiteral[],
  isReturn: boolean,
): google.maps.LatLngLiteral {
  const ratio = isReturn ? 0.62 : 0.38
  const point = path[Math.floor(path.length * ratio)]
  return point ?? path[0]
}

function dashedLineSymbol(color: string): google.maps.Symbol {
  return {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    strokeColor: color,
    scale: 3,
  }
}

interface RouteLayerProps {
  work: LocationPoint | null
  homes: LocationPoint[]
  results: CommuteResult[]
  travelMode: TravelMode
  routePreference: RoutePreference
  showReturnTrip: boolean
}

export function RouteLayer({
  work,
  homes,
  results,
  travelMode,
  routePreference,
  showReturnTrip,
}: RouteLayerProps) {
  const apiLoaded = useApiIsLoaded()
  const routes = useRoutePaths(
    work,
    homes,
    results,
    travelMode,
    routePreference,
    showReturnTrip,
  )

  const labelIcons = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.id,
          createDurationLabelIcon(
            route.durationText,
            route.color,
            route.direction === 'RETURN',
          ),
        ]),
      ),
    [routes],
  )

  if (!apiLoaded || routes.length === 0) return null

  return (
    <>
      {routes.map((route) => {
        const isReturn = route.direction === 'RETURN'
        return (
          <Polyline
            key={route.id}
            path={route.path}
            strokeColor={route.color}
            strokeWeight={route.isBest ? (isReturn ? 4 : 6) : isReturn ? 3 : 4}
            strokeOpacity={isReturn ? 0 : route.isBest ? 0.95 : 0.75}
            zIndex={isReturn ? 1 : route.isBest ? 2 : 1}
            icons={
              isReturn
                ? [{ icon: dashedLineSymbol(route.color), offset: '0', repeat: '14px' }]
                : undefined
            }
          />
        )
      })}

      {routes.map((route) => {
        const icon = labelIcons[route.id]
        if (!icon) return null
        return (
          <Marker
            key={`label-${route.id}`}
            position={labelPosition(route.path, route.direction === 'RETURN')}
            icon={icon}
            zIndex={route.direction === 'RETURN' ? 2 : 3}
            clickable={false}
          />
        )
      })}
    </>
  )
}
