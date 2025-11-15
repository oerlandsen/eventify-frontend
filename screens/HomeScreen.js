import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Modal,
  Platform,
  Keyboard,
} from 'react-native';
import WebMap from '../components/WebMap';
import Slider from '@react-native-community/slider';
import { MapView as NativeMapView, Marker as NativeMarker, Circle as NativeCircle, Polygon as NativePolygon } from '../components/NativeMap';
import BarrioDetailPanel from '../components/BarrioDetailPanel';
import { normalizeLatLng } from '../utils/geo';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import eventsData from '../data/events.js';
import venues from '../data/venues';
import barrios from '../data/barrios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/es';
dayjs.extend(isoWeek);
dayjs.locale('es');

// utils de filtros
import { applyEventFilters } from '../utils/filtering.js';
import { SUBCATEGORIES, normalizeCategory, normalizeEventType } from '../utils/filters.schema.js';
import { normalizeVenueType } from '../utils/venueTypes.js';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DAY_ITEM_HEIGHT = 48;
const DAYS_AHEAD = 365; // días futuros mostrados en el picker vertical

// Colores de pines
const PIN_PURPLE = '#9F7BFF';
const PIN_NAVY = '#5FA9FF'; // light, modern blue para venues
const PIN_NAVY_SELECTED = '#8BC4FF'; // brighter accent para venues
const PIN_TEATRO = '#3B82F6'; // vibrant bright blue para eventos de Teatro
const PIN_COMEDIA = '#FF69B4'; // vibrant pink para eventos de Comedia
const PIN_ARTE = '#00BCD4'; // vibrant cyan/turquoise para eventos de Arte
const PIN_CINE = '#3B52D8'; // deep blue para eventos de Cine

const DEFAULT_MAP_REGION = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.0027,
  longitudeDelta: 0.0027,
};
const DEFAULT_NATIVE_REGION = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
const CITY_ZOOM_DELTA = 0.0027;
const STREET_ZOOM_DELTA_WEB = 0.0001;
const STREET_ZOOM_DELTA_NATIVE = 0.0008;
const STREET_ZOOM_RELAX_FACTOR = 1.7;
const PIN_ZOOM_OUT_DELTA_WEB = 0.00022;
const PIN_ZOOM_OUT_DELTA_NATIVE = 0.0009;
const CAROUSEL_ZOOM_DELTA_WEB = 0.00012;
const CAROUSEL_ZOOM_DELTA_NATIVE = 0.0006;

const getStreetZoomDelta = () =>
  Platform.OS === 'web' ? STREET_ZOOM_DELTA_WEB : STREET_ZOOM_DELTA_NATIVE;

const getPinZoomOutDelta = () =>
  Platform.OS === 'web' ? PIN_ZOOM_OUT_DELTA_WEB : PIN_ZOOM_OUT_DELTA_NATIVE;

const getCarouselZoomDelta = () =>
  Platform.OS === 'web' ? CAROUSEL_ZOOM_DELTA_WEB : CAROUSEL_ZOOM_DELTA_NATIVE;
const PIN_VERTICAL_OFFSET_FACTOR = 0.22;

// Emojis por tipo de venue
const VENUE_TYPE_EMOJI = {
  Arena: '🏟️',
  Stadium: '🏟️',
  Theater: '🎭',
  Club: '🎶',
  Bar: '🍸',
  Cinema: '🎬',
  Art: '🖼️',
  Gallery: '🖼️',
  Museum: '🏛️',
};

// Helper para obtener el color del pin basado en la categoría del evento
const getEventPinColor = (event) => {
  const category = normalizeCategory(event?.category);
  if (category === 'Teatro') {
    return PIN_TEATRO;
  }
  if (category === 'Comedia') {
    return PIN_COMEDIA;
  }
  if (category === 'Arte') {
    return PIN_ARTE;
  }
  if (category === 'Cine') {
    return PIN_CINE;
  }
  return PIN_PURPLE; // Default color para otras categorías
};

// Helper para obtener el color del pin basado en el tipo de venue
// Maps venue types to category pin colors
const getVenuePinColor = (venueType) => {
  if (!venueType) return PIN_PURPLE;
  
  // Normalize venue type to ensure exact match
  let normalizedType;
  try {
    normalizedType = normalizeVenueType(venueType, { allowLegacy: true });
  } catch (error) {
    // If normalization fails, use the original type trimmed
    normalizedType = venueType.trim();
  }
  
  // Teatro -> Teatro (blue)
  if (normalizedType === 'Teatro') {
    return PIN_TEATRO;
  }
  
  // Cine -> Cine (deep blue)
  if (normalizedType === 'Cine') {
    return PIN_CINE;
  }
  
  // Arte-related venues -> Arte (cyan)
  if (normalizedType === 'Museo' || normalizedType === 'Centro Cultural' || normalizedType === 'Galería') {
    return PIN_ARTE;
  }
  
  // Music-related venues -> Música (purple) - default
  // Bar, Sala de Concierto, Club, Arena
  return PIN_PURPLE;
};

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState(eventsData);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showPanel, setShowPanel] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showBarrios, setShowBarrios] = useState(false);
  const [selectedBarrio, setSelectedBarrio] = useState(null); // Selected barrio for detail panel

  // Panel de venue (pin azul)
  const [showVenuePanel, setShowVenuePanel] = useState(false);
  const [venueEvents, setVenueEvents] = useState([]);
  const [venueIndex, setVenueIndex] = useState(0);
  const [selectedVenueMeta, setSelectedVenueMeta] = useState(null); // {name, type}

  // Picker vertical de días (modal)
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Filtros canónicos
  const [selectedDateTag, setSelectedDateTag] = useState('ALL');
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set()); // Stores "category::type" strings
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Legacy single-select support for existing code
  const selectedCategory = selectedCategories.size > 0 ? Array.from(selectedCategories)[0] : 'ALL';
  const selectedType = selectedTypes.size > 0 ? Array.from(selectedTypes)[0] : 'ALL';
  
  // Selected independent days (applied after Apply button)
  const [selectedDays, setSelectedDays] = useState([]); // Array of 'YYYY-MM-DD' strings
  
  // Price filter (single value: 0-300,000 CLP, max price)
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [maxPrice, setMaxPrice] = useState(300000);

  // Fecha base para selector
  const [currentDate, setCurrentDate] = useState(dayjs());
  
  // Date selection (for modal - temporary until Apply is pressed)
  const [tempSelectedDays, setTempSelectedDays] = useState([]); // Array of 'YYYY-MM-DD' strings

  // Ubicación
  const [location, setLocation] = useState(null);

  // Resultados de búsqueda
  const [searchVenues, setSearchVenues] = useState([]);
  const [searchEvents, setSearchEvents] = useState([]);

  // Pines temporales del buscador
  const [selectedVenue, setSelectedVenue] = useState(null);      // { id?, name, latitude, longitude }
  const [selectedEventPin, setSelectedEventPin] = useState(null); // { title, latitude, longitude, category }

  // Animación “Find My”
  const pulse = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const mapRef = useRef(null);
  const mapRegionRef = useRef(Platform.OS === 'web' ? { ...DEFAULT_MAP_REGION } : { ...DEFAULT_NATIVE_REGION });
  const streetZoomNextRef = useRef(false);
  const centerTimeoutRef = useRef(null);
  const pan = useRef(new Animated.Value(0)).current;
  const [isCarouselScrolling, setIsCarouselScrolling] = useState(false);
  const handleBarriosButtonPress = useCallback(() => {
    setShowBarrios(prev => !prev);
  }, []);

  // Handle barrio polygon tap
  // When user taps a barrio polygon, open the detail panel
  const handleBarrioPress = useCallback((barrio) => {
    setSelectedBarrio(barrio);
    // Close other panels when opening barrio panel
    setShowPanel(false);
    setShowVenuePanel(false);
    setSelectedIndex(null);
    setSelectedEventPin(null);
    setSelectedVenue(null);
  }, []);

  // Close barrio detail panel
  const handleCloseBarrioPanel = useCallback(() => {
    setSelectedBarrio(null);
  }, []);

  // Filtros para UI
  const filters = {
    Date: ['Ahora', 'Hoy', 'Esta semana', 'Este mes'],
    Category: ['Música', 'Teatro', 'Comedia', 'Arte', 'Cine'],
  };

  // Colores para cada categoría
  const categoryColors = {
    'Música': '#6A3EF5',    // Purple
    'Teatro': '#1E91E8',    // Blue
    'Comedia': '#C814E1',   // Magenta
    'Arte': '#14D7D7',      // Cyan
    'Cine': '#003F9C',      // Dark Blue
  };

  // Helper para obtener el color de borde basado en la categoría
  const getCategoryBorderColor = (filterString) => {
    // Extraer la categoría del string (puede ser "Música" o "Música · Jazz")
    const category = filterString.split(' · ')[0];
    return categoryColors[category] || null;
  };

  // Todas las subcategorías en español
  const ALL_TYPES = Array.from(new Set(Object.values(SUBCATEGORIES).flat()));
  
  // Mapeo de nombres en español a canónicos en inglés (para compatibilidad con filtering logic)
  const mapSpanishToEnglishDateTag = (spanish) => {
    const mapping = { 'Ahora': 'Live', 'Hoy': 'Today', 'Esta semana': 'This Week', 'Este mes': 'This Month', 'ALL': 'ALL' };
    return mapping[spanish] || spanish;
  };

  // Pills visuales - computed from selectedCategories and selectedTypes
  const activeFilters = useMemo(() => {
    const filterPills = [];
    
    // Process categories and types
    // For each category in selectedCategories, check if it has subcategories
    selectedCategories.forEach(cat => {
      // Check if any subcategories of this category are in selectedTypes
      const subcats = SUBCATEGORIES[cat] ?? [];
      const hasSubcats = subcats.some(subcat => selectedTypes.has(`${cat}::${subcat}`));
      
      if (hasSubcats) {
        // Add one pill per subcategory
        subcats.forEach(subcat => {
          if (selectedTypes.has(`${cat}::${subcat}`)) {
            filterPills.push(`${cat} · ${subcat}`);
          }
        });
      } else {
        // Category-only pill
        filterPills.push(cat);
      }
    });
    
    // Check for any orphaned types (types without their parent category selected)
    selectedTypes.forEach(typeKey => {
      const [cat, type] = typeKey.split('::');
      if (!selectedCategories.has(cat)) {
        filterPills.push(`${cat} · ${type}`);
      }
    });
    
    return filterPills;
  }, [selectedCategories, selectedTypes]);

  // Price filter check
  const hasPriceFilter = maxPrice < 300000;

  // Format price helper function
  const formatPrice = (price) => {
    if (price === 0) return 'Gratis';
    return `$${price.toLocaleString('es-CL')}`;
  };

  // Check if category/type filters or price filter are active
  const hasCategoryOrTypeFilters = selectedCategories.size > 0 || selectedTypes.size > 0 || hasPriceFilter;

  // Compute display text for date selector based on selected date tag
  const activeDateFilterDisplay = useMemo(() => {
    if (selectedDateTag === 'ALL') return null;
    
    switch (selectedDateTag) {
      case 'Hoy':
        return dayjs().format('DD MMM');
      case 'Ahora':
        return 'Ahora';
      case 'Esta semana': {
        const today = dayjs();
        const weekEnd = today.add(6, 'day');
        return `${today.format('DD')}-${weekEnd.format('DD MMM')}`;
      }
      case 'Este mes':
        return 'Este Mes';
      default:
        return selectedDateTag;
    }
  }, [selectedDateTag]);

  // Combined filters carousel: Category/Type filters and Price filter (date filters show in date selector only)
  const allActiveFilters = useMemo(() => {
    const combined = [];
    
    // Category/Type filters - date filters are shown in the date selector, not as pills
    activeFilters.forEach(filter => {
      combined.push({ type: 'category', label: filter, value: filter });
    });
    
    // Price filter (if active)
    if (hasPriceFilter) {
      combined.push({ type: 'price', label: `Gratis - ${formatPrice(maxPrice)}`, value: 'price' });
    }
    
    return combined;
  }, [activeFilters, hasPriceFilter, maxPrice]);


  const mapSpanishToEnglishCategory = (spanish) => {
    if (spanish === 'ALL') return 'ALL';
    const normalized = normalizeCategory(spanish);
    // Ahora normalizeCategory devuelve español, necesitamos mapear a inglés para la lógica antigua
    const esToEn = {
      'Música': 'Music',
      'Teatro': 'Theater',
      'Comedia': 'Humor',
      'Arte': 'Art',
      'Cine': 'Cinema',
    };
    return esToEn[normalized] || normalized;
  };

  const getAvailableTypesForCategory = (cat) => {
    if (!cat || cat === 'ALL') return [];
    // Retornar las subcategorías en español directamente
    return SUBCATEGORIES[cat] ?? [];
  };

  // Extract numeric price from event (handles string like "30.000" or number)
  const getEventPrice = (event) => {
    if (!event?.price) return null;
    if (typeof event.price === 'number') return event.price;
    if (typeof event.price === 'string') {
      // Remove dots, commas, and currency symbols, then parse
      const cleaned = event.price.replace(/[.,$]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // =========================
  // HELPERS
  // =========================
  const clearPins = () => {
    setSelectedVenue(null);
    setSelectedEventPin(null);
  };

const getVenueLatLng = (v) => normalizeLatLng(v?.coordinates ?? { latitude: v?.latitude, longitude: v?.longitude });
const getEventLatLng = (e) => normalizeLatLng(e?.coordinates ?? { latitude: e?.latitude, longitude: e?.longitude });

  // Próximos eventos para una venue, ordenados por fecha (más próximo primero)
  const getUpcomingEventsForVenue = (venueName) => {
    const today = dayjs().startOf('day');
    return eventsData
      .filter((e) => {
        const loc = (e.location || '').toLowerCase();
        const vname = (e.venueName || '').toLowerCase();
        const match =
          loc.includes((venueName || '').toLowerCase()) ||
          vname === (venueName || '').toLowerCase();
        if (!match) return false;
        const d = e.date ? dayjs(e.date) : null;
        if (!d) return false;
        return d.isSame(today, 'day') || d.isAfter(today);
      })
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  };

  const emojiForVenue = (type) => VENUE_TYPE_EMOJI[type] || '📍';

  // Fecha/hora formateada estándar
  const formatEventDateTime = (e) => {
    const d = e?.date ? dayjs(e.date) : null;
    if (!d || !d.isValid()) return '';
    const datePart = d.format('DD MMM YYYY'); // ej: 23 oct 2025
    const timePart = e?.timeStart ? e.timeStart : null;
    return timePart ? `${datePart} · ${timePart}` : datePart;
  };

  // Lista de días futuros para el picker vertical
  const dayItems = useMemo(() => {
    const start = dayjs().startOf('day');
    return Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => start.add(i, 'day'));
  }, []);
  const dayIndexFor = (d) => {
    const start = dayjs().startOf('day');
    const diff = d.startOf('day').diff(start, 'day');
    return diff < 0 ? 0 : diff > DAYS_AHEAD ? DAYS_AHEAD : diff;
  };

  // =========================
  // EFFECTS
  // =========================
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (!location) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [location]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!location?.coords) return;
    if (!mapRef.current) return;

    mapRegionRef.current = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: CITY_ZOOM_DELTA,
      longitudeDelta: CITY_ZOOM_DELTA,
    };

    animateMapToLatLng(location.coords, { zoomDeltaOverride: CITY_ZOOM_DELTA, applyOffset: false });
  }, [location]);

  // ✅ Al limpiar el buscador NO borres la venue ni cierres la cartelera
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSelectedEventPin(null);
      // NO tocar selectedVenue ni showVenuePanel
    }
  }, [searchQuery]);

  // Animar mapa cuando se selecciona una venue
  useEffect(() => {
    if (selectedVenue && selectedVenue.latitude && selectedVenue.longitude && mapRef.current) {
      const latlng = { latitude: selectedVenue.latitude, longitude: selectedVenue.longitude };
      // Dismiss keyboard before animating
      Keyboard.dismiss();
      // Usar requestAnimationFrame para asegurar que el DOM está actualizado
      requestAnimationFrame(() => {
        if (mapRef.current) {
          animateMapToLatLng(latlng, { streetZoom: true });
        }
      });
    }
  }, [selectedVenue]);

  // Búsqueda (venues + eventos futuros)
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q === '') {
      setSearchVenues([]);
      setSearchEvents([]);
      return;
    }

    const today = dayjs().startOf('day');

    setSearchVenues(
      venues.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.type?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q)
      )
    );

    setSearchEvents(
      eventsData.filter((e) => {
        const isFuture = e.date && (dayjs(e.date).isSame(today, 'day') || dayjs(e.date).isAfter(today));
        if (!isFuture) return false;
        const haystack = [e.title, e.description, e.location, e.category, e.type, e.dateTag]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
    );
  }, [searchQuery]);

  // Si no hay Date-tag, manda el día específico
  useEffect(() => {
    if (selectedDateTag === 'ALL') setSelectedDay(currentDate.format('YYYY-MM-DD'));
  }, [currentDate, selectedDateTag]);

  // Filtrado principal
  useEffect(() => {
    let base;
    
    // Handle independent days filtering (show ONLY exact selected days, not range)
    if (selectedDays.length > 0) {
      // Filter by exact selected days only (not range)
      const selectedDaysSet = new Set(selectedDays);
      
      base = eventsData.filter((e) => {
        if (!e?.date) return false;
        const eventDateStr = dayjs(e.date).format('YYYY-MM-DD');
        // Check if event date matches exactly one of the selected days
        return selectedDaysSet.has(eventDateStr);
      });
      
      // Apply category and type filters with OR logic
      const hasCategoryFilters = selectedCategories.size > 0;
      const hasTypeFilters = selectedTypes.size > 0;

      if (hasCategoryFilters || hasTypeFilters) {
        base = base.filter((e) => {
          const evCatCanonical = normalizeCategory(e?.category);
          const evTypeNormalized = normalizeEventType(e?.type);
          
          // Check if event matches category filter
          const matchesCategory = hasCategoryFilters && selectedCategories.has(evCatCanonical);
          
          // Check if event matches type filter - need to check for "category::type" key
          const eventTypeKey = `${evCatCanonical}::${evTypeNormalized}`;
          const matchesType = hasTypeFilters && selectedTypes.has(eventTypeKey);
          
          // Match if either category or type matches
          return matchesCategory || matchesType;
        });
      }
    } else {
      // Use existing filter logic for single date or date tags
      base = applyEventFilters(eventsData, {
        dateTag: mapSpanishToEnglishDateTag(selectedDateTag),
        category: 'ALL', // Don't pass category here, we'll filter manually after
        type: 'ALL', // Don't pass type here, we'll filter manually after
        specificDay: selectedDateTag === 'ALL' ? selectedDay : null,
      });
      
      // Apply category/type filters after applyEventFilters with OR logic
      const hasCategoryFilters = selectedCategories.size > 0;
      const hasTypeFilters = selectedTypes.size > 0;

      if (hasCategoryFilters || hasTypeFilters) {
        base = base.filter((e) => {
          const evCatCanonical = normalizeCategory(e?.category);
          const evTypeNormalized = normalizeEventType(e?.type);
          
          // Check if event matches category filter
          const matchesCategory = hasCategoryFilters && selectedCategories.has(evCatCanonical);
          
          // Check if event matches type filter - need to check for "category::type" key
          const eventTypeKey = `${evCatCanonical}::${evTypeNormalized}`;
          const matchesType = hasTypeFilters && selectedTypes.has(eventTypeKey);
          
          // Match if either category or type matches
          return matchesCategory || matchesType;
        });
      }
    }

    const q = (searchQuery || '').trim().toLowerCase();
    const byText = q
      ? base.filter((e) => {
          const haystack = [e.title, e.description, e.location, e.venueName, e.type]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : base;

    // Apply price filter (single value: filter events <= maxPrice)
    const byPrice = byText.filter((e) => {
      const price = getEventPrice(e);
      // Events with no price are treated as free, include them
      if (price === null || price === undefined) {
        // If maxPrice is 0, only show free events (including no price)
        // If maxPrice > 0, show free events anyway
        return true;
      }
      return price <= maxPrice;
    });

    // Sort events by date (earliest to latest)
    const sorted = byPrice.sort((a, b) => {
      const dateA = dayjs(a?.date);
      const dateB = dayjs(b?.date);
      if (!dateA.isValid()) return 1;
      if (!dateB.isValid()) return -1;
      return dateA.valueOf() - dateB.valueOf();
    });

    setFilteredEvents(sorted);
  }, [selectedDateTag, selectedCategories, selectedTypes, selectedDay, selectedDays, searchQuery, maxPrice]);

  // Track previous selectedDays to detect when Apply is pressed
  const prevSelectedDays = useRef(JSON.stringify(selectedDays));
  const prevSelectedDay = useRef(selectedDay);
  
  // Sincronía lista filtrada (DO NOT reset price filter when empty)
  useEffect(() => {
    const selectedDaysChanged = prevSelectedDays.current !== JSON.stringify(selectedDays);
    const dayChanged = prevSelectedDay.current !== selectedDay;
    prevSelectedDays.current = JSON.stringify(selectedDays);
    prevSelectedDay.current = selectedDay;

    if (Platform.OS === 'web') {
      if (!filteredEvents || filteredEvents.length === 0) {
        setSelectedIndex(null);
        if (!showVenuePanel) clearPins();
        return;
      }
      setShowPanel(true);

      const shouldReset = selectedDaysChanged ||
                          selectedIndex == null ||
                          selectedIndex >= filteredEvents.length ||
                          (filteredEvents.length > 0 && selectedIndex < 0);

      if (shouldReset) {
        if (selectedDaysChanged || (dayChanged && selectedDays.length === 0)) {
          setSelectedIndex(null);
          return;
        }
        setSelectedIndex(0);
        if (Platform.OS !== 'web') {
          streetZoomNextRef.current = true;
        }
        setTimeout(() => {
          if (flatListRef.current && filteredEvents.length > 0) {
            try {
              flatListRef.current.scrollToIndex({ index: 0, animated: false });
            } catch (error) {
              try {
                flatListRef.current.scrollToOffset({ offset: 0, animated: false });
              } catch (err) {
                // Ignore
              }
            }
          }
        }, 100);
      }
      return;
    }

    // Native behavior (unchanged)
    if (!filteredEvents || filteredEvents.length === 0) {
      setSelectedIndex(null);
      if (!showVenuePanel) clearPins();
      return;
    }
    setShowPanel(true);

    const shouldReset = selectedDaysChanged ||
                        selectedIndex == null ||
                        selectedIndex >= filteredEvents.length ||
                        (filteredEvents.length > 0 && selectedIndex < 0);

    if (shouldReset) {
      setSelectedIndex(0);
      streetZoomNextRef.current = true;
      setTimeout(() => {
        if (flatListRef.current && filteredEvents.length > 0) {
          try {
            flatListRef.current.scrollToIndex({ index: 0, animated: false });
          } catch (error) {
            try {
              flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            } catch (err) {
              // Ignore
            }
          }
        }
      }, 100);
    }
  }, [filteredEvents, selectedDays, selectedDay, selectedIndex]);

  useEffect(() => {
    if (centerTimeoutRef.current) {
      clearTimeout(centerTimeoutRef.current);
      centerTimeoutRef.current = null;
    }

    if (selectedIndex == null || selectedIndex < 0 || selectedIndex >= filteredEvents.length) {
      return;
    }
    const eventToCenter = filteredEvents[selectedIndex];
    if (!eventToCenter) return;

    centerTimeoutRef.current = setTimeout(() => {
      if (Platform.OS === 'web') {
        centerMapOnEvent(eventToCenter, { force: true, zoomDeltaOverride: getCarouselZoomDelta() });
      } else {
        const shouldStreetZoom = streetZoomNextRef.current;
        streetZoomNextRef.current = false;
        if (shouldStreetZoom) {
          centerMapOnEvent(eventToCenter, { force: true, streetZoom: true });
        } else {
          centerMapOnEvent(eventToCenter, { force: true, zoomDeltaOverride: getCarouselZoomDelta() });
        }
      }
    }, 60);

    return () => {
      if (centerTimeoutRef.current) {
        clearTimeout(centerTimeoutRef.current);
        centerTimeoutRef.current = null;
      }
    };
  }, [selectedIndex, filteredEvents]);

  // =========================
  // UI handlers
  // =========================
  const toggleFilter = (filter) => {
    const isDate = typeof filter === 'string' && filters.Date.includes(filter);
    const isCategory = typeof filter === 'string' && filters.Category.includes(filter);
    const isType = typeof filter === 'object' && filter.type ? true : (typeof filter === 'string' && ALL_TYPES.includes(filter));

    if (isDate) {
      const nextTag = selectedDateTag === filter ? 'ALL' : filter;
      setSelectedDateTag(nextTag);
      setSelectedDay(nextTag === 'ALL' ? currentDate.format('YYYY-MM-DD') : null);

      clearPins();
      setShowVenuePanel(false);
      return;
    }

    if (isCategory) {
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(filter)) {
          next.delete(filter);
        } else {
          next.add(filter);
        }
        return next;
      });

      clearPins();
      setShowVenuePanel(false);
      return;
    }

    if (isType) {
      // Handle both object {category, type} and legacy string format
      const typeKey = typeof filter === 'object' ? `${filter.category}::${filter.type}` : filter;
      
      setSelectedTypes((prev) => {
        const next = new Set(prev);
        if (next.has(typeKey)) {
          next.delete(typeKey);
        } else {
          next.add(typeKey);
        }
        return next;
      });

      clearPins();
      setShowVenuePanel(false);
    }
  };

  const removeFilter = (filter) => {
    if (filters.Date.includes(filter)) {
      setSelectedDateTag('ALL');
      setSelectedDay(currentDate.format('YYYY-MM-DD'));
      setSelectedDays([]);
    } else if (filter.includes(' · ')) {
      // Remove "Category · Subcategory" pill - remove both category and subcategory in one click
      const [cat, subcat] = filter.split(' · ');
      const typeKey = `${cat}::${subcat}`;
      
      // Remove the subcategory
      setSelectedTypes((prev) => {
        const next = new Set(prev);
        next.delete(typeKey);
        return next;
      });
      
      // Also remove the category if it's selected
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        next.delete(cat);
        return next;
      });
    } else if (filters.Category.includes(filter)) {
      // Remove category-only pill
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        next.delete(filter);
        return next;
      });
    }
    clearPins();
    setShowVenuePanel(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) pan.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -150) {
          clearPins();
          setShowVenuePanel(false);
          navigation.navigate('Events', {
            filters: {
              dateTag: selectedDateTag,
              category: selectedCategory,
              type: selectedType,
              specificDay: selectedDateTag === 'ALL' ? selectedDay : null,
            },
          });
        }
        Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handleMarkerPress = (event) => {
    const index = filteredEvents.findIndex((e) => e.id === event.id);
    if (index !== -1) {
      clearPins();
      setShowVenuePanel(false);
      setSelectedIndex(index);
      setShowPanel(true);
      flatListRef.current?.scrollToIndex({ index, animated: true });
      centerMapOnEvent(filteredEvents[index], { force: true, zoomDeltaOverride: getPinZoomOutDelta() });
    }
  };

  const handleEventInfoPress = () => {
    if (selectedIndex === null) return;
    const event = filteredEvents[selectedIndex];
    if (event) navigation.navigate('EventDetail', { event });
  };

  const lastCenteredEventId = useRef(null);

  const animateMapToLatLng = (latlng, { streetZoom = false, zoomDeltaOverride = null, applyOffset = true } = {}) => {
    if (!mapRef.current || !latlng) return;

    const baseLatDelta = Platform.OS === 'web' ? DEFAULT_MAP_REGION.latitudeDelta : DEFAULT_NATIVE_REGION.latitudeDelta;
    const baseLonDelta = Platform.OS === 'web' ? DEFAULT_MAP_REGION.longitudeDelta : DEFAULT_NATIVE_REGION.longitudeDelta;
    const currentLatDelta = mapRegionRef.current?.latitudeDelta ?? baseLatDelta;
    const currentLonDelta = mapRegionRef.current?.longitudeDelta ?? baseLonDelta;

    const ratio = currentLatDelta > 0 ? currentLonDelta / currentLatDelta : 1;
    const streetZoomDelta = getStreetZoomDelta();

    let targetLatDelta = currentLatDelta;
    let targetLonDelta = currentLonDelta;

    if (zoomDeltaOverride != null) {
      targetLatDelta = zoomDeltaOverride;
      targetLonDelta = ratio * targetLatDelta;
    } else if (streetZoom && currentLatDelta > streetZoomDelta) {
      targetLatDelta = streetZoomDelta;
      targetLonDelta = ratio * targetLatDelta;
    } else if (streetZoom) {
      const relaxedLatDelta = Math.min(currentLatDelta * STREET_ZOOM_RELAX_FACTOR, DEFAULT_NATIVE_REGION.latitudeDelta);
      targetLatDelta = Math.max(relaxedLatDelta, streetZoomDelta);
      targetLonDelta = ratio * targetLatDelta;
    }

    const verticalOffset = applyOffset ? targetLatDelta * PIN_VERTICAL_OFFSET_FACTOR : 0;
    const adjustedLatitude = Math.max(-89.9, Math.min(89.9, latlng.latitude - verticalOffset));

    const targetRegion = {
      latitude: adjustedLatitude,
      longitude: latlng.longitude,
      latitudeDelta: targetLatDelta,
      longitudeDelta: targetLonDelta,
    };

    mapRef.current.animateToRegion(targetRegion, 350);
    mapRegionRef.current = { ...targetRegion };
  };

  const centerMapOnEvent = (event, { force = false, streetZoom = false, zoomDeltaOverride = null } = {}) => {
    if (!event || !event.id) return;
    if (!force && lastCenteredEventId.current === event.id) return;

    const latlng = getEventLatLng(event);
    if (!latlng) return;

    lastCenteredEventId.current = event.id;
    animateMapToLatLng(latlng, { streetZoom, zoomDeltaOverride });
  };

  const focusVenueOnMap = (v) => {
    const latlng = getVenueLatLng(v);
    if (!latlng) return;

    // preparar cartelera
    const list = getUpcomingEventsForVenue(v.name);
    setSelectedVenue({ id: v.id, name: v.name, ...latlng });
    setSelectedVenueMeta({ name: v.name, type: v.type });
    setVenueEvents(list);
    setVenueIndex(0);

    // mostrar panel de venue y ocultar resultados de búsqueda
    setShowVenuePanel(true);
    setShowPanel(false);
    setSearchQuery('');     // oculta panel de resultados
    setSelectedEventPin(null);
    setShowFilters(false);
    // La animación del mapa se maneja en el useEffect que observa selectedVenue
  };

  const focusEventOnMap = (e) => {
    const latlng = getEventLatLng(e);
    if (!latlng || !mapRef.current) return;

    setSelectedEventPin({ title: e.title, category: e.category, ...latlng });
    setSelectedVenue(null);

    centerMapOnEvent(e, { force: true, zoomDeltaOverride: getCarouselZoomDelta() });

    setShowPanel(false);
    setShowVenuePanel(false);
  };

  const goToEventDetailClearingPins = (event) => {
    clearPins();
    setShowVenuePanel(false);
    navigation.navigate('EventDetail', { event });
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSelectedEventPin(null);
      // mantener venue/cartelera si ya estaban
    }
  };

  // =========== RENDER CARD ESTÁNDAR (para ambos carruseles) ===========
  const renderStandardEventCard = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => {
        if (typeof index === 'number') setSelectedIndex(index);
        centerMapOnEvent(item, { force: true, zoomDeltaOverride: getCarouselZoomDelta() });
        clearPins();
        setShowVenuePanel(false);
        navigation.navigate('EventDetail', { event: item });
      }}
      activeOpacity={0.9}
      style={{ width: 250, marginHorizontal: 10 }}
    >
      <View style={styles.card}>
        {!!item.image && <Image source={{ uri: item.image }} style={styles.cardImage} />}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardDate}>{formatEventDateTime(item)}</Text>
          {!!item.location && <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (selectedIndex == null || selectedIndex < 0 || selectedIndex >= filteredEvents.length) {
      return;
    }
    const eventToCenter = filteredEvents[selectedIndex];
    if (!eventToCenter) return;
    centerMapOnEvent(eventToCenter, { force: true, zoomDeltaOverride: getCarouselZoomDelta() });
  }, [selectedIndex, filteredEvents]);

  const hasSelectedCategory = selectedCategories.size > 0;
  // Get all available types from all selected categories with their parent category info
  const availableTypes = useMemo(() => {
    if (hasSelectedCategory) {
      const allTypesWithCategory = [];
      selectedCategories.forEach(cat => {
        const types = SUBCATEGORIES[cat] ?? [];
        types.forEach(type => {
          allTypesWithCategory.push({ category: cat, type });
        });
      });
      return allTypesWithCategory;
    }
    return [];
  }, [selectedCategories, hasSelectedCategory]);

  const resultsTop = showFilters ? 240 : 170;

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  // =========================
  // Day Picker (Modal)
  // =========================
  const openDayPicker = () => {
    // Initialize with current selection if exists
    setTempSelectedDays([...selectedDays]);
    setShowDayPicker(true);
  };
  const closeDayPicker = () => setShowDayPicker(false);

  const handleDayToggle = (d) => {
    const dateStr = d.format('YYYY-MM-DD');
    setTempSelectedDays((prev) => {
      if (prev.includes(dateStr)) {
        // Remove if already selected
        return prev.filter((day) => day !== dateStr);
      } else {
        // Add if not selected
        return [...prev, dateStr].sort(); // Keep sorted for consistency
      }
    });
  };

  const handleClearDays = () => {
    setTempSelectedDays([]);
    // Reset to current day
    setCurrentDate(dayjs());
    setSelectedDay(null);
    setSelectedDays([]);
  };

  const handleApplyDays = () => {
    setSelectedDays([...tempSelectedDays]);
    setSelectedDateTag('ALL');
    if (tempSelectedDays.length === 1) {
      setSelectedDay(tempSelectedDays[0]);
    } else {
      setSelectedDay(null);
    }
    if (tempSelectedDays.length > 0) {
      setCurrentDate(dayjs(tempSelectedDays[0]));
    }
    // Reset selected index to force carousel update - the useEffect will handle scrolling
    setSelectedIndex(null);
    closeDayPicker();
  };

  const initialDayIndex = useMemo(() => dayIndexFor(currentDate), [currentDate]);

  // Altura dinámica del panel inferior (más alto para venues)
  const panelHeight = showVenuePanel ? SCREEN_HEIGHT * 0.32 : SCREEN_HEIGHT * 0.25;

  const apiKey = "AIzaSyBJymkbeUvctbb43PnnTUZ9GQNo6IeEwd0";

  const eventMarkers = useMemo(() => {
    if (showVenuePanel) return [];
    const pins = (filteredEvents || [])
      .map((ev, idx) => {
        const latlng = getEventLatLng(ev);
        if (!latlng) return null;
        return {
          id: ev.id,
          title: ev.title,
          latitude: latlng.latitude,
          longitude: latlng.longitude,
          pinColor: selectedIndex === idx ? '#FFFFFF' : getEventPinColor(ev),
        };
      })
      .filter(Boolean);
    // Temporary logging for debugging
    if (__DEV__ && Platform.OS === 'web') {
      console.log('[HomeScreen] eventMarkers:', pins.length, 'pins');
      if (pins.length > 0) {
        console.log('[HomeScreen] First 3 pins:', pins.slice(0, 3).map(p => ({ id: p.id, lat: p.latitude, lng: p.longitude })));
      }
    }
    return pins;
  }, [filteredEvents, selectedIndex, showVenuePanel]);

  const initialRegion = Platform.OS === 'web'
    ? {
        latitude: location?.coords?.latitude ?? DEFAULT_MAP_REGION.latitude,
        longitude: location?.coords?.longitude ?? DEFAULT_MAP_REGION.longitude,
        latitudeDelta: CITY_ZOOM_DELTA,
        longitudeDelta: CITY_ZOOM_DELTA,
      }
    : {
        latitude: location?.coords?.latitude ?? DEFAULT_NATIVE_REGION.latitude,
        longitude: location?.coords?.longitude ?? DEFAULT_NATIVE_REGION.longitude,
        latitudeDelta: DEFAULT_NATIVE_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_NATIVE_REGION.longitudeDelta,
      };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <WebMap
          ref={mapRef}
          apiKey={apiKey}
          style={[styles.map, Platform.OS === 'web' && { minHeight: '100vh', height: '100%' }]}
          initialRegion={initialRegion}
          onPress={() => {
            setShowPanel(false);
            setSelectedIndex(null);
            setShowVenuePanel(false);
            clearPins();
          }}
          userLocation={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null}
          circleRadius={location ? Math.max(location.coords.accuracy || 50, 30) : null}
          eventMarkers={eventMarkers}
          onEventMarkerPress={(id) => {
            const evIdx = filteredEvents.findIndex((e) => e.id === id);
            if (evIdx !== -1) {
              handleMarkerPress(filteredEvents[evIdx]);
              setShowPanel(true);
            }
          }}
          selectedEventPin={!showVenuePanel && selectedEventPin ? { 
            latitude: selectedEventPin.latitude, 
            longitude: selectedEventPin.longitude,
            pinColor: getEventPinColor({ category: selectedEventPin.category })
          } : null}
          selectedVenuePin={selectedVenue ? { 
            latitude: selectedVenue.latitude, 
            longitude: selectedVenue.longitude,
            pinColor: getVenuePinColor(selectedVenueMeta?.type)
          } : null}
          pinColors={{ default: PIN_PURPLE, selected: '#FFFFFF', venue: PIN_NAVY, venueSelected: PIN_NAVY_SELECTED }}
          barrios={showBarrios ? barrios : []}
          onBarrioPress={handleBarrioPress}
          onRegionChange={(region) => {
            if (!region) return;
            mapRegionRef.current = {
              ...mapRegionRef.current,
              latitude: region.latitude ?? mapRegionRef.current.latitude,
              longitude: region.longitude ?? mapRegionRef.current.longitude,
              latitudeDelta: region.latitudeDelta ?? mapRegionRef.current.latitudeDelta,
              longitudeDelta: region.longitudeDelta ?? mapRegionRef.current.longitudeDelta,
            };
          }}
        />
      ) : (
          <NativeMapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              scrollEnabled={!isCarouselScrolling}
              zoomEnabled={!isCarouselScrolling}
              rotateEnabled={!isCarouselScrolling}
              pitchEnabled={!isCarouselScrolling}
              onPress={() => {
                setShowPanel(false);
                setSelectedIndex(null);
                setShowVenuePanel(false);
                clearPins();
              }}
              onRegionChangeComplete={(region) => {
                if (!region) return;
                mapRegionRef.current = {
                  ...mapRegionRef.current,
                  latitude: region.latitude,
                  longitude: region.longitude,
                  latitudeDelta: region.latitudeDelta,
                  longitudeDelta: region.longitudeDelta,
                };
              }}
            >
              {/* Barrios polygons (render first so they appear under markers) */}
              {/* Tap handler: Single tap on polygon opens barrio detail panel */}
              {showBarrios && barrios.map((barrio) => (
                <NativePolygon
                  key={barrio.id}
                  coordinates={barrio.coordinates}
                  fillColor={barrio.fillColor || 'rgba(159, 123, 255, 0.2)'}
                  strokeColor={barrio.strokeColor || 'rgba(159, 123, 255, 0.6)'}
                  strokeWidth={2}
                  zIndex={1}
                  onPress={() => handleBarrioPress(barrio)}
                  tappable={true}
                />
              ))}

              {location && (
                <>
                  <NativeCircle
                    center={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    radius={Math.max(location.coords.accuracy || 50, 30)}
                    strokeColor="rgba(24,119,242,0.25)"
                    fillColor="rgba(24,119,242,0.15)"
                  />
                  <NativeMarker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={styles.findMyDotWrapper}>
                      <Animated.View
                        style={[
                          styles.pulseRing,
                          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                        ]}
                      />
                      <View style={styles.findMyDotOuter}>
                        <View style={styles.findMyDotInner} />
                      </View>
                    </View>
                  </NativeMarker>
                </>
              )}

              {!showVenuePanel &&
                filteredEvents.map((event, index) => {
                  const latlng = getEventLatLng(event);
                  if (!latlng) return null;
                  return (
                    <NativeMarker
                      key={event.id}
                      coordinate={latlng}
                      pinColor={selectedIndex === index ? '#FFFFFF' : getEventPinColor(event)}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMarkerPress(event);
                        setShowPanel(true);
                      }}
                      zIndex={10}
                    />
                  );
                })}

              {!showVenuePanel && selectedEventPin && (
                <NativeMarker
                  coordinate={{
                    latitude: selectedEventPin.latitude,
                    longitude: selectedEventPin.longitude,
                  }}
                  title={selectedEventPin.title}
                  pinColor={getEventPinColor({ category: selectedEventPin.category })}
                  zIndex={998}
                />
              )}

              {selectedVenue && (
                <NativeMarker
                  coordinate={{
                    latitude: selectedVenue.latitude,
                    longitude: selectedVenue.longitude,
                  }}
                  title={selectedVenue.name}
                  pinColor={getVenuePinColor(selectedVenueMeta?.type)}
                  zIndex={999}
                />
              )}
          </NativeMapView>
      )}

      {/* Buscador + botón filtros */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar en Santiago"
          placeholderTextColor="#ccc"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSelectedEventPin(null);
              // mantener venue/cartelera si ya estaban
            }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      <TouchableOpacity
        style={[styles.barriosButton, showBarrios && styles.barriosButtonActive]}
        onPress={handleBarriosButtonPress}
        activeOpacity={0.7}
      >
        <Ionicons name="storefront-outline" size={22} color="#fff" />
      </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowFilters(!showFilters)} 
          style={[styles.filterIcon, showFilters && styles.filterIconActive]}
        >
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Row fecha + filtros activos */}
      <View style={styles.filterRow}>
        {hasCategoryOrTypeFilters ? (
          <>
            {/* Left: Date selector (when Category/Type filters are active) */}
            <View style={styles.dateSelectorContainerLeft}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={openDayPicker}
                style={styles.dateSelectorWrapper}
              >
                <View style={styles.dateSelector}>
                  {activeDateFilterDisplay ? (
                    <>
                      <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                        <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.dateText}>{activeDateFilterDisplay}</Text>
                      <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                        <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                    </>
                  ) : selectedDays.length > 0 ? (
                      // Show date range (earliest - latest) with arrows
                      (() => {
                        if (selectedDays.length === 1) {
                          return (
                            <>
                              <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                                <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                              </TouchableOpacity>
                              <Text style={styles.dateText}>{dayjs(selectedDays[0]).format('DD MMM')}</Text>
                              <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                                <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                              </TouchableOpacity>
                            </>
                          );
                        } else {
                          // Show range: "31 Oct - 5 Nov" (earliest to latest) with arrows
                          const sortedDays = [...selectedDays].sort();
                          const earliest = dayjs(sortedDays[0]);
                          const latest = dayjs(sortedDays[sortedDays.length - 1]);
                          return (
                            <>
                              <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                                <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                              </TouchableOpacity>
                              <Text style={styles.dateText}>{earliest.format('DD MMM')} - {latest.format('DD MMM')}</Text>
                              <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                                <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                              </TouchableOpacity>
                            </>
                          );
                        }
                      })()
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                          <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.dateText}>{currentDate.format('DD MMM')}</Text>
                        <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                          <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Right: Horizontal carousel of all active filters (Date first, then Category/Type) */}
            <View style={styles.filtersCarousel}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersCarouselContent}
              >
                {allActiveFilters.map((filterItem, index) => {
                  const borderColor = filterItem.type === 'category' ? getCategoryBorderColor(filterItem.value) : null;
                  return (
                    <View 
                      key={`${filterItem.type}-${filterItem.value}-${index}`} 
                      style={[
                        styles.activeFilter, 
                        index > 0 && { marginLeft: 8 },
                        borderColor && { borderWidth: 2, borderColor }
                      ]}
                    >
                      <Text style={styles.filterText}>{filterItem.label}</Text>
                      <TouchableOpacity onPress={() => {
                        if (filterItem.type === 'price') {
                          // Remove price filter
                          setMaxPrice(300000);
                        } else {
                          // Remove category/type filter
                          removeFilter(filterItem.value);
                        }
                      }}>
                        <Text style={styles.removeX}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </>
        ) : (
          <>
            {/* Left: Active filter pills (when no Category/Type filters) */}
        <View style={styles.filtersLeft}>
          {activeFilters.map((filter) => {
            const borderColor = getCategoryBorderColor(filter);
            return (
              <View 
                key={filter} 
                style={[
                  styles.activeFilter,
                  borderColor && { borderWidth: 2, borderColor }
                ]}
              >
                <Text style={styles.filterText}>{filter}</Text>
                <TouchableOpacity onPress={() => removeFilter(filter)}>
                  <Text style={styles.removeX}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {hasPriceFilter && (
            <View style={styles.activeFilter}>
              <Text style={styles.filterText}>
                Gratis - {formatPrice(maxPrice)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMaxPrice(300000);
                }}
              >
                <Text style={styles.removeX}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

            {/* Center: Date selector */}
        <View style={styles.dateSelectorContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openDayPicker}
            style={styles.dateSelectorWrapper}
          >
            <View style={styles.dateSelector}>
              {activeDateFilterDisplay ? (
                <>
                  <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                    <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.dateText}>{activeDateFilterDisplay}</Text>
                  <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                    <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : selectedDays.length > 0 ? (
                // Show date range (earliest - latest) with arrows
                (() => {
                  if (selectedDays.length === 1) {
                    return (
                      <>
                        <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                          <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.dateText}>{dayjs(selectedDays[0]).format('DD MMM')}</Text>
                        <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                          <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                      </>
                    );
                  } else {
                    // Show range: "31 Oct - 5 Nov" (earliest to latest) with arrows
                    const sortedDays = [...selectedDays].sort();
                    const earliest = dayjs(sortedDays[0]);
                    const latest = dayjs(sortedDays[sortedDays.length - 1]);
                    return (
                      <>
                        <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                          <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.dateText}>{earliest.format('DD MMM')} - {latest.format('DD MMM')}</Text>
                        <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                          <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                      </>
                    );
                  }
                })()
              ) : (
                <>
                  <TouchableOpacity onPress={() => setCurrentDate((p) => p.subtract(1, 'day'))}>
                    <Ionicons name="chevron-back-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.dateText}>{currentDate.format('DD MMM')}</Text>
                  <TouchableOpacity onPress={() => setCurrentDate((p) => p.add(1, 'day'))}>
                    <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Right: Empty for now */}
        <View style={styles.filtersRight} />
          </>
        )}
      </View>

      {/* Panel de filtros */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Date */}
          <View>
              <Text style={styles.filterSection}>Fecha</Text>
            <View style={styles.filterOptions}>
              {filters.Date.map((option) => (
                <TouchableOpacity
                  key={`date-${option}`}
                  onPress={() => toggleFilter(option)}
                  style={[
                    styles.filterOption,
                    selectedDateTag === option && styles.activeFilterOption,
                  ]}
                >
                  <Text style={styles.filterOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View>
            <Text style={styles.filterSection}>Categoría</Text>
            <View style={styles.filterOptions}>
              {filters.Category.map((option) => (
                <TouchableOpacity
                  key={`category-${option}`}
                  onPress={() => toggleFilter(option)}
                  style={[
                    styles.filterOption,
                    selectedCategories.has(option) && styles.activeFilterOption,
                  ]}
                >
                  <Text style={styles.filterOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type */}
          {hasSelectedCategory && availableTypes.length > 0 && (
            <View>
              <Text style={styles.filterSection}>Tipo</Text>
              <View style={styles.filterOptions}>
                {availableTypes.map((option) => {
                  const displayType = typeof option === 'object' ? option.type : option;
                  const typeKey = typeof option === 'object' ? `${option.category}::${option.type}` : option;
                  return (
                    <TouchableOpacity
                      key={`type-${typeKey}`}
                      onPress={() => toggleFilter(option)}
                      style={[
                        styles.filterOption,
                        selectedTypes.has(typeKey) && styles.activeFilterOption,
                      ]}
                    >
                      <Text style={styles.filterOptionText}>{displayType}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Price */}
          <View>
            <TouchableOpacity
              onPress={() => setShowPricePanel(!showPricePanel)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}
            >
              <Text style={styles.filterSection}>Precio</Text>
              <Ionicons
                name={showPricePanel ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
            {showPricePanel && (
              <View style={styles.pricePanel}>
                {/* Live label above slider */}
                <Text style={styles.priceSliderLabel}>
                  Gratis - {formatPrice(maxPrice)}
                </Text>
                {/* Single-handle slider matching SearchScreen radius slider */}
                <View style={{ paddingHorizontal: 10 }}>
                  <Slider
                    minimumValue={0}
                    maximumValue={300000}
                    step={500}
                    value={maxPrice}
                    onValueChange={(value) => setMaxPrice(value)}
                    minimumTrackTintColor="#6A39FF"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#6A39FF"
                  />
                </View>
                {/* Range labels (min/max) */}
                <View style={styles.priceRangeLabels}>
                  <Text style={styles.priceRangeLabel}>Gratis</Text>
                  <Text style={styles.priceRangeLabel}>{formatPrice(300000)}</Text>
                </View>
                {/* Quick action buttons */}
                <View style={styles.priceActions}>
                  <TouchableOpacity
                    style={styles.priceActionButton}
                    onPress={() => {
                      setMaxPrice(0);
                    }}
                  >
                    <Text style={styles.priceActionText}>Solo Gratis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.priceActionButton}
                    onPress={() => {
                      setMaxPrice(300000);
                    }}
                  >
                    <Text style={styles.priceActionText}>Restablecer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Panel de resultados del BUSCADOR (venues + eventos futuros) */}
      {searchQuery.length > 0 && (searchVenues.length > 0 || searchEvents.length > 0) && (
        <View style={[styles.resultSection, { top: resultsTop }]}>
          <ScrollView>
            {searchEvents.length > 0 && (
              <View>
                <Text style={styles.resultTitle}>Próximos Eventos</Text>
                {searchEvents.map((e, i) => (
                  <View
                    key={`ev-${i}`}
                    style={[styles.venueCard, { flexDirection: 'row', alignItems: 'center' }]}
                  >
                    {/* Tap en el nombre centra el mapa y pone pin morado */}
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => focusEventOnMap(e)}>
                      <Text style={styles.venueName}>{e.title}</Text>
                      <Text style={styles.venueType}>{e.location}</Text>
                    </TouchableOpacity>

                    {/* Botón + -> ir a EventDetail limpiando pines */}
                    <TouchableOpacity
                      onPress={() => goToEventDetailClearingPins(e)}
                      style={styles.moreIcon}
                    >
                      <Ionicons name="add-circle-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {searchVenues.length > 0 && (
              <View>
                <Text style={styles.resultTitle}>Venues</Text>
                {searchVenues.map((v, i) => (
                  <View
                    key={`venue-${i}`}
                    style={[styles.venueCard, { flexDirection: 'row', alignItems: 'center' }]}
                  >
                    {/* Tap en el título: oculta resultados, deja pin azul + cartelera */}
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => focusVenueOnMap(v)}>
                      <Text style={styles.venueName}>{v.name}</Text>
                      <Text style={styles.venueType}>
                        {v.type}
                        {v.city ? ` · ${v.city}` : ''}
                      </Text>
                    </TouchableOpacity>

                    {/* Botón + para ir a VenueScreen (opcional) */}
                    <TouchableOpacity
                      onPress={() => {
                        clearPins();
                        setShowVenuePanel(false);
                        navigation.navigate('VenueScreen', {
                          venueName: v.name,
                          venueType: v.type,
                          venueCity: v.city,
                          coverImage: v.coverImage,
                          profileImage: v.profileImage,
                          menuPdfUrl: v.menuPdfUrl,
                        });
                      }}
                      style={styles.moreIcon}
                    >
                      <Ionicons name="add-circle-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Panel inferior de tarjetas (según filtros) */}
      {!showVenuePanel && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.panelContainer, { height: panelHeight, transform: [{ translateY: pan }] }]}
        >
          <View style={styles.swipeBar} />
          {/* Filter chips above carousel */}
          {activeFilters.length > 0 && (() => {
            // Filter out category-only pills (keep only category::type pills)
            const carouselFilters = activeFilters.filter(filter => {
              // If it contains " · ", it's a category::type pill, keep it
              if (filter.includes(' · ')) return true;
              // If it's a pure category name (Música, Teatro, etc.), exclude it
              return !categoryColors.hasOwnProperty(filter);
            });
            
            if (carouselFilters.length === 0) return null;
            
            return (
              <View style={styles.carouselFilterChips}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselFilterChipsContent}
                >
                  {carouselFilters.map((filter, index) => {
                    const borderColor = getCategoryBorderColor(filter);
                    return (
                      <View 
                        key={filter} 
                        style={[
                          styles.carouselFilterChip, 
                          index > 0 && styles.carouselFilterChipMargin,
                          borderColor && { borderWidth: 2, borderColor }
                        ]}
                      >
                        <Text style={styles.carouselFilterChipText}>{filter}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })()}
          {filteredEvents.length > 0 ? (
            <FlatList
              ref={flatListRef}
              horizontal
              data={filteredEvents}
              renderItem={renderStandardEventCard}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              snapToInterval={270}
              snapToAlignment="start"
              decelerationRate={Platform.OS === 'web' ? 0.985 : 'fast'}
              pagingEnabled={Platform.OS === 'web'}
              scrollEventThrottle={16}
              getItemLayout={(data, index) => ({
                length: 270,
                offset: 270 * index,
                index,
              })}
              initialScrollIndex={0}
              onScrollBeginDrag={() => {
                setIsCarouselScrolling(true);
                // Temporarily disable map gestures during carousel scroll
                if (Platform.OS === 'web' && mapRef.current?.setOptions) {
                  mapRef.current.setOptions({ gestureHandling: 'none' });
                }
              }}
              onScrollEndDrag={(e) => {
                setIsCarouselScrolling(false);
                const index = Math.round(e.nativeEvent.contentOffset.x / 270);
                if (index >= 0 && index < filteredEvents.length) {
                  setSelectedIndex(index);
                }
                if (Platform.OS === 'web' && mapRef.current?.setOptions) {
                  mapRef.current.setOptions({ gestureHandling: 'greedy' });
                }
              }}
              onScroll={(e) => {
                if (Platform.OS !== 'web') return;
                const index = Math.round(e.nativeEvent.contentOffset.x / 270);
                if (index !== selectedIndex && index >= 0 && index < filteredEvents.length) {
                  setSelectedIndex(index);
                  // Don't recenter map during scroll - only on momentum end
                }
              }}
              onMomentumScrollEnd={(e) => {
                setIsCarouselScrolling(false);
                const index = Math.round(e.nativeEvent.contentOffset.x / 270);
                if (index >= 0 && index < filteredEvents.length) {
                  setSelectedIndex(index);
                }
                if (Platform.OS === 'web' && mapRef.current?.setOptions) {
                  mapRef.current.setOptions({ gestureHandling: 'greedy' });
                }
              }}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No events in this price range</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try adjusting the price filter to see more events
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Panel inferior de cartelera de la venue (horizontal, más alto + emoji) */}
      {showVenuePanel && selectedVenue && (
        <Animated.View
          style={[styles.panelContainer, { height: panelHeight, transform: [{ translateY: pan }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.swipeBar} />
          <View style={{ paddingHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {selectedVenueMeta ? `${emojiForVenue(selectedVenueMeta.type)} ${selectedVenueMeta.name}` : selectedVenue.name}
            </Text>
          </View>

          <FlatList
            horizontal
            data={venueEvents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => renderStandardEventCard({ item, index })}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={270}
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: 270,
              offset: 270 * index,
              index,
            })}
            initialScrollIndex={venueEvents.length > 0 ? venueIndex : 0}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / 270);
              setVenueIndex(idx);
              const ev = venueEvents[idx];
              if (ev) centerMapOnEvent(ev, { force: true, streetZoom: true, zoomDeltaOverride: getPinZoomOutDelta() });
            }}
          />
        </Animated.View>
      )}

      {/* ===== Modal: Selector vertical de días ===== */}
      <Modal visible={showDayPicker} transparent animationType="fade" onRequestClose={closeDayPicker}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDayPicker}>
          <View />
        </TouchableOpacity>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {tempSelectedDays.length === 0
                ? 'Selecciona días'
                : tempSelectedDays.length === 1
                ? dayjs(tempSelectedDays[0]).format('DD MMM')
                : `${tempSelectedDays.length} días seleccionados`}
            </Text>
            <TouchableOpacity onPress={closeDayPicker} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={dayItems}
            keyExtractor={(d) => d.format('YYYY-MM-DD')}
            renderItem={({ item }) => {
              const dateStr = item.format('YYYY-MM-DD');
              const isSelected = tempSelectedDays.includes(dateStr);

              return (
                <View
                  style={[
                    styles.dayRow,
                    isSelected && styles.dayRowSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayRowText,
                      isSelected && styles.dayRowTextBold,
                    ]}
                  >
                    {item.format('ddd DD MMM YYYY')}
                  </Text>
                  <TouchableOpacity
                    style={styles.dayAddButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDayToggle(item);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={24}
                      color={isSelected ? '#6A39FF' : '#fff'}
                    />
                  </TouchableOpacity>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={initialDayIndex}
            getItemLayout={(data, index) => ({
              length: DAY_ITEM_HEIGHT,
              offset: DAY_ITEM_HEIGHT * index,
              index,
            })}
          />
          
          {/* Clear and Apply buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClear]}
              onPress={handleClearDays}
            >
              <Text style={styles.modalButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonApply]}
              onPress={handleApplyDays}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextApply]}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barrio Detail Panel */}
      {/* This panel appears when user taps a barrio polygon on the map */}
      <BarrioDetailPanel
        barrio={selectedBarrio}
        visible={!!selectedBarrio}
        onClose={handleCloseBarrioPanel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  map: { 
    flex: 1,
  },

  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 15,
    right: 15,
    zIndex: 12,
    backgroundColor: '#2C005F',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterIcon: { marginLeft: 10 },
  filterIconActive: {
    backgroundColor: '#6A39FF',
    borderRadius: 6,
  },
  barriosButton: {
    marginLeft: 10,
    backgroundColor: '#3E2670',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barriosButtonActive: {
    backgroundColor: '#6A39FF',
  },
  barrioLabelContainer: {
    backgroundColor: 'rgba(159, 123, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(159, 123, 255, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  barrioLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  filterRow: {
    position: 'absolute',
    top: 88,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 11,
  },

  filtersLeft: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: 8,
  },

  dateSelectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorContainerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 8,
  },
  filtersCarousel: {
    flex: 1,
    marginLeft: 8,
  },
  filtersCarouselContent: {
    alignItems: 'center',
    paddingRight: 8,
  },

  dateSelectorWrapper: {
    borderRadius: 22,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C005F',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 22,
  },
  dateText: { color: '#fff', fontSize: 13, marginHorizontal: 8 },

  filtersRight: {
    flex: 1,
    maxWidth: '45%',
  },
  activeFilter: {
    backgroundColor: '#2C005F',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: { color: '#fff', fontSize: 15 },
  removeX: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },

  filterPanel: {
    position: 'absolute',
    top: 126,
    left: 15,
    right: 15,
    backgroundColor: '#2C005F',
    padding: 10,
    borderRadius: 10,
    zIndex: 11,
  },
  filterSection: { color: '#fff', marginBottom: 5, fontWeight: '600' },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  filterOption: {
    backgroundColor: '#3E2670',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeFilterOption: { backgroundColor: '#6A39FF' },
  filterOptionText: { color: '#fff' },

  // Resultados del buscador
  resultSection: {
    position: 'absolute',
    left: 15,
    right: 15,
    zIndex: 13,
    backgroundColor: '#2C005F',
    borderRadius: 10,
    padding: 12,
    maxHeight: 300,
  },
  resultTitle: { color: '#ccc', fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  venueCard: { backgroundColor: '#3E2670', padding: 12, borderRadius: 10, marginBottom: 10 },
  venueName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  venueType: { color: '#ccc', fontSize: 14, marginTop: 2 },
  moreIcon: { marginLeft: 10, padding: 4 },

  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2C005F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  swipeBar: {
    width: 40,
    height: 5,
    backgroundColor: '#aaa',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#3E2670',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 100 },
  cardText: { padding: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  cardDate: { fontSize: 13, color: '#ccc' },
  cardLocation: { fontSize: 13, color: '#bbb' },

  // Estilo “Find My”
  findMyDotWrapper: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(24,119,242,0.35)',
  },
  findMyDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1877F2',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  findMyDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // ===== Modal day picker =====
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#2C005F',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
  },
  dayRow: {
    height: DAY_ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dayRowSelected: {
    backgroundColor: '#3E2670',
  },
  dayRowText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  dayRowTextBold: {
    fontWeight: '700',
  },
  dayAddButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonClear: {
    backgroundColor: '#3E2670',
  },
  modalButtonApply: {
    backgroundColor: '#6A39FF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextApply: {
    fontWeight: '700',
  },

  // Price filter styles
  pricePanel: {
    backgroundColor: '#3E2670',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  priceSliderLabel: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  priceRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  priceRangeLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  priceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 12,
  },
  priceActionButton: {
    flex: 1,
    backgroundColor: '#2C005F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Empty state styles
  carouselFilterChips: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  carouselFilterChipsContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  carouselFilterChip: {
    backgroundColor: '#2C005F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselFilterChipMargin: {
    marginLeft: 6,
  },
  carouselFilterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
