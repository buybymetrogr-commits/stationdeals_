/**
 * Calculate distance between two points on Earth using Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lng1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lng2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Format distance in a human-readable way
 * @param distanceInMeters Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(distanceInMeters: number | undefined): string {
  if (distanceInMeters === undefined) {
    return 'Άγνωστη απόσταση';
  }
  
  // Always show in meters for distances under 1000m
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}μ`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}χλμ`;
  }
}

/**
 * Find the closest metro station to a business
 * @param businessLat Business latitude
 * @param businessLng Business longitude
 * @param metroStations Array of metro stations
 * @returns Closest station with distance or null if no stations
 */
export function findClosestStationToBusiness(
  businessLat: number,
  businessLng: number,
  metroStations: any[]
): any | null {
  if (metroStations.length === 0) return null;
  
  let closestStation = null;
  let minDistance = Infinity;
  
  metroStations.forEach(station => {
    if (station.active !== false) {
      const distance = calculateDistance(
        station.location.lat,
        station.location.lng,
        businessLat,
        businessLng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = {
          ...station,
          distance: distance
        };
      }
    }
  });
  
  return closestStation;
}