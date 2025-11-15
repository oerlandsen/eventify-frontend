const ACCENT_MARKS_REGEX = /\p{Diacritic}/gu;

function stripAccents(value) {
  if (typeof value !== 'string') return value;
  return value.normalize('NFD').replace(ACCENT_MARKS_REGEX, '');
}

export const VENUE_TYPES = Object.freeze([
  'Bar',
  'Sala de Concierto',
  'Club',
  'Teatro',
  'Arena',
  'Museo',
  'Centro Cultural',
  'Galería',
  'Cine',
]);

export const VENUE_TYPE_SLUG_MAP = Object.freeze(
  VENUE_TYPES.reduce((acc, label) => {
    const slug = stripAccents(label).toLowerCase().replace(/\s+/g, '-');
    acc[label] = slug;
    return acc;
  }, {})
);

export const LEGACY_VENUE_TYPE_MAP = Object.freeze({
  // Bars & jazz clubs
  'bar': 'Bar',
  'bar de jazz': 'Bar',
  'bar / club de jazz': 'Bar',
  'bar/club de jazz': 'Bar',
  'bar / club': 'Bar',
  'bar/club': 'Bar',
  'club de jazz': 'Bar',
  'clubes de jazz': 'Bar',
  // Clubs & nightlife
  'club': 'Club',
  'clubes': 'Club',
  'club nocturno': 'Club',
  'club nocturnos': 'Club',
  'discotheque': 'Club',
  'discoteca': 'Club',
  'centro de eventos': 'Club',
  // Concert halls
  'sala de concierto': 'Sala de Concierto',
  'sala de conciertos': 'Sala de Concierto',
  // Theaters
  'teatro': 'Teatro',
  'teatros': 'Teatro',
  // Arenas / stadiums
  'arena': 'Arena',
  'arenas': 'Arena',
  'estadio': 'Arena',
  'estadios': 'Arena',
  // Museums & cultural centres
  'museo': 'Museo',
  'museos': 'Museo',
  'casa museo': 'Museo',
  'centro cultural': 'Centro Cultural',
  'centros culturales': 'Centro Cultural',
  // Galleries
  'galeria': 'Galería',
  'galerias': 'Galería',
  'galería': 'Galería',
  'galerías': 'Galería',
  // Cinemas
  'cine': 'Cine',
  'cines': 'Cine',
});

export function isAllowedVenueType(type) {
  return VENUE_TYPES.includes(type);
}

export function normalizeVenueType(type, { context, allowLegacy = true } = {}) {
  const original = typeof type === 'string' ? type.trim() : '';

  if (!original) {
    throw new Error(
      `Invalid or missing venue type${context ? ` for ${context}` : ''}. ` +
        `Expected one of: ${VENUE_TYPES.join(', ')}.`
    );
  }

  const comparable = stripAccents(original).toLowerCase();

  if (allowLegacy) {
    const legacyMatch = LEGACY_VENUE_TYPE_MAP[comparable];
    if (legacyMatch) {
      return legacyMatch;
    }
  }

  const canonicalMatch = VENUE_TYPES.find(
    (label) => stripAccents(label).toLowerCase() === comparable
  );

  if (canonicalMatch) {
    return canonicalMatch;
  }

  throw new Error(
    `Unknown venue type "${original}"${context ? ` for ${context}` : ''}. ` +
      `Allowed values are: ${VENUE_TYPES.join(', ')}.`
  );
}

export const VENUE_TYPE_OPTIONS = Object.freeze(
  VENUE_TYPES.map((label) => ({
    label,
    value: VENUE_TYPE_SLUG_MAP[label],
  }))
);


