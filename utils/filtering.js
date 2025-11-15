// utils/filtering.js
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { DATE_TAGS, CATEGORY_TYPES, SUBCATEGORIES, normalizeCategory, normalizeEventType, stripAccents } from "./filters.schema.js";
dayjs.extend(isoWeek);

// Helper: mapear categoría español a inglés para usar con CATEGORY_TYPES legacy
const CATEGORY_ES_TO_EN = {
  'Música': 'Music',
  'Teatro': 'Theater',
  'Comedia': 'Humor',
  'Arte': 'Art',
  'Cine': 'Cinema',
};

// ---- Helpers de tiempo para "Live" ----
function buildDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dt = dayjs(`${dateStr}T${timeStr}`);
  return dt.isValid() ? dt : null;
}

function coerceEndAfterStart(start, end) {
  if (start && end && end.isBefore(start)) return end.add(1, "day");
  return end;
}

/**
 * isLive(ev, now):
 *  - true si AHORA ∈ [start-1h, end] (si hay end),
 *  - o AHORA ∈ [start-1h, start+2h] si NO hay end (duración por defecto = 2h).
 * Requiere: ev.date (YYYY-MM-DD) y ev.timeStart (HH:mm). timeEnd es opcional.
 */
export function isLive(ev, now = dayjs()) {
  const start = buildDateTime(ev?.date, ev?.timeStart);
  if (!start) return false;

  let end = ev?.timeEnd ? buildDateTime(ev.date, ev.timeEnd) : start.add(2, "hour");
  end = coerceEndAfterStart(start, end);

  const preLive = start.subtract(1, "hour");
  return now.isAfter(preLive) && now.isBefore(end.add(1, "minute"));
}

// ---- Inferencias para Today / This Week / This Month (no consideran Live) ----
export function inferDateTag(dateStr) {
  if (!dateStr) return undefined;
  const d = dayjs(dateStr);
  if (!d.isValid()) return undefined;

  const today = dayjs();
  if (d.isSame(today, "day")) return "Today";

  const start = today.startOf("isoWeek");
  const end = today.endOf("isoWeek");
  if (d.isAfter(start.subtract(1, "ms")) && d.isBefore(end.add(1, "ms"))) {
    return "This Week";
  }

  if (d.isSame(today, "month")) return "This Month";
  return undefined;
}

export function effectiveDateTag(ev) {
  if (isLive(ev)) return "Live";
  return ev?.dateTag || inferDateTag(ev?.date);
}

/**
 * applyEventFilters(events, opts)
 *  Filtra por:
 *   - Date: Live | Today | This Week | This Month | ALL
 *   - Category: Music | Theater | Humor | Art | Cinema | ALL
 *   - Type: depende de Category | ALL
 *   - specificDay: 'YYYY-MM-DD' (prioridad sobre dateTag)
 */
export function applyEventFilters(
  events,
  { dateTag = "ALL", category = "ALL", type = "ALL", specificDay = null } = {}
) {
  const wantTag = DATE_TAGS.includes(dateTag) ? dateTag : "ALL";
  const wantCategory = category === "ALL" ? "ALL" : (normalizeCategory(category) || "ALL");
  const wantType = type && type !== "ALL" ? String(type).trim().toLowerCase() : "ALL";
  const dayPick = specificDay ? dayjs(specificDay) : null;

  // Para obtener tipos permitidos, usar la categoría normalizada (ya en español)
  // CATEGORY_TYPES ahora tiene tanto claves en inglés como en español
  const allowedTypes = wantCategory !== "ALL" 
    ? (CATEGORY_TYPES?.[wantCategory] || CATEGORY_TYPES?.[CATEGORY_ES_TO_EN[wantCategory]] || [])
    : null;
  const allowedTypesLower = allowedTypes ? allowedTypes.map(t => stripAccents(t).toLowerCase()) : [];

  return (events || []).filter((ev) => {
    // --- CATEGORY ---
    const evCatCanonical = normalizeCategory(ev?.category);
    const passCategory = (wantCategory === "ALL") ? true : (evCatCanonical === wantCategory);

    // --- TYPE (debe pertenecer al grupo cuando hay categoría seleccionada) ---
    // Normalizar el tipo del evento a su forma canónica en español
    const evTypeNormalized = normalizeEventType(ev?.type) || ev?.type || "";
    const evTypeLower = stripAccents(evTypeNormalized).toLowerCase();
    const passType =
      wantType === "ALL"
        ? (wantCategory === "ALL" ? true : allowedTypesLower.includes(evTypeLower))
        : (evTypeLower === wantType && (wantCategory === "ALL" ? true : allowedTypesLower.includes(wantType)));

    // --- DATE / DATETAG ---
    let passDate = true;

    if (dayPick) {
      passDate = ev?.date ? dayjs(ev.date).isSame(dayPick, "day") : false;

    } else if (wantTag !== "ALL") {
      if (wantTag === "Live") {
        passDate = isLive(ev);

      } else if (wantTag === "Today") {
        passDate = ev?.date ? dayjs(ev.date).isSame(dayjs(), "day") : false;

      } else if (wantTag === "This Week") {
        if (ev?.date) {
          const d = dayjs(ev.date);
          const start = dayjs().startOf("isoWeek");
          const end = dayjs().endOf("isoWeek");
          passDate = d.isAfter(start.subtract(1, "ms")) && d.isBefore(end.add(1, "ms"));
        } else {
          passDate = false;
        }

      } else if (wantTag === "This Month") {
        passDate = ev?.date ? dayjs(ev.date).isSame(dayjs(), "month") : false;
      }
    }

    return passCategory && passType && passDate;
  });
}

/** Opcional: escribe dateTag a partir de date (no afecta Live que es dinámico) */
export function assignDateTags(events) {
  return (events || []).map(ev => {
    if (ev?.dateTag === "Live") return ev;
    const inferred = inferDateTag(ev?.date);
    return inferred ? { ...ev, dateTag: inferred } : ev;
  });
}
