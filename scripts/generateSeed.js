#!/usr/bin/env node

/**
 * Generates a Postgres seed file (db/seed.sql) using the existing frontend data.
 *
 * The seed contains:
 * - CREATE TABLE statements for neighborhoods, venues, events
 * - INSERT statements for all records in data/barrios.js, data/venues.js, data/events.js
 *
 * Assumptions:
 * - Neighborhood IDs are derived from their order (since frontend uses string IDs)
 * - Venue IDs follow their order in data/venues.js (after filtering active venues)
 * - Venue neighborhood assignment is determined by testing if a venue's coordinates fall within a barrio polygon
 * - Event venue assignment tries to match the location string with known venue names (best-effort)
 * - Missing optional fields (stars, schedule, type, keywords, price_range) default to NULL or empty arrays
 */

const fs = require('fs');
const path = require('path');

// Allow requiring project files that use ESM syntax
require('@babel/register')({
  extensions: ['.js'],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
  ignore: [/node_modules/],
});

// Stub static asset imports used inside the data files
['.png', '.jpg', '.jpeg', '.gif', '.webp'].forEach((ext) => {
  require.extensions[ext] = function stub(module, filename) {
    module.exports = filename;
  };
});

const barrios = require('../data/barrios').default;
const venues = require('../data/venues').default;
const events = require('../data/events').default;

const OUTPUT_PATH = path.join(__dirname, '..', 'db', 'seed.sql');

if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const escapeLiteral = (value) => {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const formatFloatArray = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return "'{}'::double precision[]";
  }
  const cleaned = values
    .map((value) => {
      const num = toNumber(value);
      return num === null ? null : num;
    })
    .filter((value) => value !== null);

  if (cleaned.length === 0) {
    return "'{}'::double precision[]";
  }

  return `'{${cleaned.join(',')}}'::double precision[]`;
};

const formatCoordinatePairs = (pairs) => {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return "'{}'::double precision[]";
  }
  const rows = pairs
    .map((pair) => {
      if (!pair) return null;
      const lat = toNumber(pair.latitude ?? pair[0]);
      const lon = toNumber(pair.longitude ?? pair[1]);
      if (lat === null || lon === null) return null;
      return `{${lat},${lon}}`;
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return "'{}'::double precision[]";
  }

  return `'{${
    rows.join(',')
  }}'::double precision[]`;
};

const formatTextArray = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return "'{}'";
  }
  const escaped = values.map((value) => {
    const sanitized = String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    return `"${sanitized}"`;
  });
  return `'{{${escaped.join(',')}}}'`.replace('{{', '{').replace('}}', '}');
};

const toTextArrayLiteral = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return "'{}'";
  }
  const escaped = values.map((value) => {
    const sanitized = String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    return `"${sanitized}"`;
  });
  return `'${`{${escaped.join(',')}}`}'`;
};

const normalizeString = (value) => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

const pointInPolygon = (point, polygon) => {
  if (!point || !polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const neighborhoodRecords = barrios.map((barrio, index) => {
  const description = barrio.shortDescription || barrio.name || barrio.id;
  return {
    id: index + 1,
    slug: barrio.id,
    description,
    coordinates: barrio.coordinates || [],
  };
});

const neighborhoodPolygons = neighborhoodRecords.map((record, idx) => ({
  id: record.id,
  slug: barrios[idx].id,
  polygon: barrios[idx].coordinates || [],
}));

const findNeighborhoodIdForVenue = (venue) => {
  const coords = venue.coordinates;
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return null;
  }
  const match = neighborhoodPolygons.find((candidate) =>
    pointInPolygon(
      { latitude: coords.latitude, longitude: coords.longitude },
      candidate.polygon
    )
  );
  return match ? match.id : null;
};

const venueRecords = venues.map((venue, index) => {
  const coordinatesArray = venue.coordinates
    ? [venue.coordinates.latitude, venue.coordinates.longitude].filter(
        (value) => typeof value === 'number'
      )
    : [];

  return {
    id: index + 1,
    name: venue.name,
    type: venue.type || null,
    description: venue.description || null,
    stars: venue.stars ?? null,
    coordinates: coordinatesArray,
    schedule: venue.schedule || null,
    neighborhoodId: findNeighborhoodIdForVenue(venue),
  };
});

const venueNameMap = new Map(
  venueRecords.map((record) => [normalizeString(record.name), record.id])
);

const findVenueIdForEvent = (location) => {
  if (!location) return null;
  const normalizedLocation = normalizeString(location);
  if (venueNameMap.has(normalizedLocation)) {
    return venueNameMap.get(normalizedLocation);
  }

  const commaParts = location.split(',').map((part) => part.trim());
  for (const part of commaParts) {
    const key = normalizeString(part);
    if (venueNameMap.has(key)) {
      return venueNameMap.get(key);
    }
  }

  return null;
};

const eventRecords = events.map((event) => {
  const venueId = findVenueIdForEvent(event.location);
  return {
    id: event.id,
    venueId,
    name: event.title,
    type: event.type || null,
    category: event.category || null,
    keywords: event.keywords || [],
    description: event.description || null,
    priceRange: event.priceRange || event.price_range || [],
    date: event.date,
  };
});

const unmatchedVenues = venueRecords.filter((venue) => !venue.neighborhoodId);
const unmatchedEvents = eventRecords.filter((event) => !event.venueId);

if (unmatchedVenues.length) {
  console.warn(
    `[seed] ${unmatchedVenues.length} venues do not fall inside a known barrio polygon. ` +
      `Their neighborhood_id will be NULL.`
  );
}

if (unmatchedEvents.length) {
  console.warn(
    `[seed] ${unmatchedEvents.length} events could not be matched to a venue via the location string. ` +
      `Their venue_id will be NULL.`
  );
}

const lines = [];

lines.push('-- Auto-generated by scripts/generateSeed.js');
lines.push('BEGIN;');
lines.push('');
lines.push('DROP TABLE IF EXISTS events;');
lines.push('DROP TABLE IF EXISTS venues;');
lines.push('DROP TABLE IF EXISTS neighborhoods;');
lines.push('');
lines.push(`CREATE TABLE neighborhoods (
  id INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  coordinates DOUBLE PRECISION[] NOT NULL
);`);
lines.push('');
lines.push(`CREATE TABLE venues (
  id INTEGER PRIMARY KEY,
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  stars NUMERIC(3,1),
  coordinates DOUBLE PRECISION[],
  schedule TIME,
  CHECK (stars IS NULL OR (stars >= 0 AND stars <= 10))
);`);
lines.push('');
lines.push(`CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  venue_id INTEGER REFERENCES venues(id),
  name TEXT NOT NULL,
  type TEXT,
  category TEXT,
  keywords TEXT[],
  description TEXT,
  price_range DOUBLE PRECISION[],
  event_date DATE
);`);
lines.push('');

neighborhoodRecords.forEach((record) => {
  lines.push(
    `INSERT INTO neighborhoods (id, description, coordinates) VALUES (${record.id}, ${escapeLiteral(
      record.description
    )}, ${formatCoordinatePairs(record.coordinates)});`
  );
});

lines.push('');

venueRecords.forEach((venue) => {
  const values = [
    venue.id,
    venue.neighborhoodId === null ? 'NULL' : venue.neighborhoodId,
    escapeLiteral(venue.name),
    escapeLiteral(venue.type),
    escapeLiteral(venue.description),
    venue.stars == null ? 'NULL' : venue.stars,
    formatFloatArray(venue.coordinates),
    venue.schedule ? escapeLiteral(venue.schedule) : 'NULL',
  ];

  lines.push(
    `INSERT INTO venues (id, neighborhood_id, name, type, description, stars, coordinates, schedule) VALUES (${values.join(
      ', '
    )});`
  );
});

lines.push('');

eventRecords.forEach((event) => {
  const values = [
    event.id,
    event.venueId === null ? 'NULL' : event.venueId,
    escapeLiteral(event.name),
    escapeLiteral(event.type),
    escapeLiteral(event.category),
    toTextArrayLiteral(event.keywords || []),
    escapeLiteral(event.description),
    formatFloatArray(event.priceRange || []),
    escapeLiteral(event.date),
  ];

  lines.push(
    `INSERT INTO events (id, venue_id, name, type, category, keywords, description, price_range, event_date) VALUES (${values.join(
      ', '
    )});`
  );
});

lines.push('');
lines.push('COMMIT;');

fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');

console.log(`[seed] SQL seed written to ${path.relative(process.cwd(), OUTPUT_PATH)}`);

