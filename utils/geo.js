// Normalizes various coordinate shapes into { latitude, longitude }
// Supports:
// - { latitude, longitude } or { lat, lng } (number or string)
// - [lat, lon] or [lon, lat] (heuristic to detect order)
export function normalizeLatLng(coords) {
  const toNum = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(',', '.'));
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };

  if (!coords) return null;

  if (typeof coords === 'object' && !Array.isArray(coords)) {
    const lat = toNum(coords.latitude ?? coords.lat);
    const lon = toNum(coords.longitude ?? coords.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { latitude: lat, longitude: lon };
    }
    return null;
  }

  if (Array.isArray(coords) && coords.length >= 2) {
    const a = toNum(coords[0]);
    const b = toNum(coords[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    const absA = Math.abs(a);
    const absB = Math.abs(b);

    const looksLonLat = absA > 60 && absB < 60; // [lon, lat]
    const looksLatLon = absA < 60 && absB > 60; // [lat, lon]

    if (looksLonLat) return { latitude: b, longitude: a };
    if (looksLatLon) return { latitude: a, longitude: b };

    if (absA < 60 && absB < 60) return { latitude: a, longitude: b };
    if (absA <= 90 && absB <= 180) return { latitude: a, longitude: b };
    if (absA <= 180 && absB <= 90) return { latitude: b, longitude: a };
    return null;
  }

  return null;
}

export function toLatLng(input) {
  if (Array.isArray(input) && input.length === 2) {
    const [lng, lat] = input;
    return { latitude: lat, longitude: lng };
  }
  if (input && typeof input === 'object') {
    if ('lat' in input && 'lng' in input) return { latitude: input.lat, longitude: input.lng };
    if ('latitude' in input && 'longitude' in input) return input;
  }
  return null;
}

// Haversine en km
export function distanceKm(aLat, aLng, bLat, bLng) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2 +
             Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
  return R * c;
}

export function withinRadius(eventCoords, userCoords, radiusKm) {
  if (!eventCoords || !userCoords || !radiusKm) return true;
  const a = { latitude: userCoords.latitude, longitude: userCoords.longitude };
  const e = toLatLng(eventCoords);
  if (!e) return true;
  return distanceKm(a.latitude, a.longitude, e.latitude, e.longitude) <= radiusKm;
}

// Calculate the centroid (center point) of a polygon
export function getPolygonCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;
  
  let sumLat = 0;
  let sumLng = 0;
  
  coordinates.forEach(coord => {
    sumLat += coord.latitude;
    sumLng += coord.longitude;
  });
  
  return {
    latitude: sumLat / coordinates.length,
    longitude: sumLng / coordinates.length,
  };
}

// Find a point on the boundary/edge of a polygon (preferably at the top-center)
export function getPolygonBoundaryPoint(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;
  
  // Find the topmost (northernmost) latitude
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;
  
  coordinates.forEach(coord => {
    if (coord.latitude > maxLat) maxLat = coord.latitude;
    if (coord.longitude < minLng) minLng = coord.longitude;
    if (coord.longitude > maxLng) maxLng = coord.longitude;
  });
  
  // Find all points at or near the top edge
  const topEdgePoints = coordinates.filter(coord => 
    Math.abs(coord.latitude - maxLat) < 0.001
  );
  
  if (topEdgePoints.length > 0) {
    // Use the topmost point, or average of top edge points
    let sumLng = 0;
    topEdgePoints.forEach(coord => {
      sumLng += coord.longitude;
    });
    return {
      latitude: maxLat,
      longitude: sumLng / topEdgePoints.length,
    };
  }
  
  // Fallback: use the topmost point
  const topPoint = coordinates.reduce((max, coord) => 
    coord.latitude > max.latitude ? coord : max
  );
  
  return {
    latitude: topPoint.latitude,
    longitude: topPoint.longitude,
  };
}
