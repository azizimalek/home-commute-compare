import type { TravelMode } from '../types'

function travelModeToGoogle(mode: TravelMode): google.maps.TravelMode {
  const map: Record<TravelMode, google.maps.TravelMode> = {
    DRIVING: google.maps.TravelMode.DRIVING,
    TRANSIT: google.maps.TravelMode.TRANSIT,
    WALKING: google.maps.TravelMode.WALKING,
    BICYCLING: google.maps.TravelMode.BICYCLING,
  }
  return map[mode]
}

export function fetchDistanceMatrix(
  origins: google.maps.LatLngLiteral[],
  destinations: google.maps.LatLngLiteral[],
  travelMode: TravelMode,
): Promise<google.maps.DistanceMatrixResponse> {
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService()

    const request: google.maps.DistanceMatrixRequest = {
      origins,
      destinations,
      travelMode: travelModeToGoogle(travelMode),
      unitSystem: google.maps.UnitSystem.METRIC,
    }

    if (travelMode === 'DRIVING') {
      request.drivingOptions = {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS,
      }
    }

    service.getDistanceMatrix(request, (response, status) => {
      if (status === 'OK' && response) resolve(response)
      else reject(new Error(`Distance Matrix request failed: ${status}`))
    })
  })
}
