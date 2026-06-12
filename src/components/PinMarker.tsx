import { Marker } from '@vis.gl/react-google-maps'
import { useMemo } from 'react'

interface PinMarkerProps {
  position: { lat: number; lng: number }
  label: string
  variant: 'work' | 'home'
  draggable?: boolean
  onDragEnd?: (lat: number, lng: number) => void
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function createPinWithLabelIcon(color: string, label: string): google.maps.Icon {
  const displayLabel = label.length > 14 ? `${label.slice(0, 13)}…` : label
  const labelWidth = Math.max(48, displayLabel.length * 6.5 + 14)
  const width = Math.max(labelWidth, 28)
  const labelHeight = 18
  const pinSize = 26
  const height = labelHeight + 4 + pinSize
  const pinX = (width - pinSize) / 2

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="${(width - labelWidth) / 2}" y="0" width="${labelWidth}" height="${labelHeight}" rx="4"
        fill="#ffffff" stroke="#d1d5db" stroke-width="1"/>
      <text x="${width / 2}" y="12" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="#111827">
        ${escapeXml(displayLabel)}
      </text>
      <g transform="translate(${pinX}, ${labelHeight + 2}) scale(${pinSize / 24})">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
      </g>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  }
}

export function PinMarker({
  position,
  label,
  variant,
  draggable = true,
  onDragEnd,
}: PinMarkerProps) {
  const icon = useMemo(
    () => createPinWithLabelIcon(variant === 'work' ? '#dc2626' : '#2563eb', label),
    [variant, label],
  )

  return (
    <Marker
      position={position}
      draggable={draggable}
      icon={icon}
      title={label}
      onDragEnd={(e) => {
        const lat = e.latLng?.lat()
        const lng = e.latLng?.lng()
        if (lat != null && lng != null) onDragEnd?.(lat, lng)
      }}
    />
  )
}
