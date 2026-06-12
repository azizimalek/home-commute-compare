import { Marker, Polyline, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { useMemo } from 'react'
import { useRoutePaths } from '../hooks/useRoutePaths'
import type { CommuteResult, LocationPoint, RoutePreference, TravelMode } from '../types'

function createDurationLabelIcon(text: string, color: string): google.maps.Icon | undefined {
  if (typeof google === 'undefined' || !google.maps?.Size) return undefined
  const width = Math.max(56, text.length * 7 + 20)
  const height = 26
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="6"
        fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <text x="${width / 2}" y="17" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#ffffff">
        ${text}
      </text>
    </svg>
  `
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height / 2),
  }
}

function midpoint(path: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral {
  const point = path[Math.floor(path.length / 2)]
  return point ?? path[0]
}

interface RouteLayerProps {
  work: LocationPoint | null
  homes: LocationPoint[]
  results: CommuteResult[]
  travelMode: TravelMode
  routePreference: RoutePreference
}

export function RouteLayer({
  work,
  homes,
  results,
  travelMode,
  routePreference,
}: RouteLayerProps) {
  const apiLoaded = useApiIsLoaded()
  const routes = useRoutePaths(work, homes, results, travelMode, routePreference)

  const labelIcons = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.id,
          createDurationLabelIcon(route.durationText, route.color),
        ]),
      ),
    [routes],
  )

  if (!apiLoaded || routes.length === 0) return null

  return (
    <>
      {routes.map((route) => (
        <Polyline
          key={route.id}
          path={route.path}
          strokeColor={route.color}
          strokeWeight={route.isBest ? 6 : 4}
          strokeOpacity={route.isBest ? 0.95 : 0.75}
          zIndex={route.isBest ? 2 : 1}
        />
      ))}

      {routes.map((route) => {
        const icon = labelIcons[route.id]
        if (!icon) return null
        return (
          <Marker
            key={`label-${route.id}`}
            position={midpoint(route.path)}
            icon={icon}
            zIndex={3}
            clickable={false}
          />
        )
      })}
    </>
  )
}
