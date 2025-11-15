import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { shouldFreezeScreen } from '../utils/freezeConfig';

/**
 * Hook to handle deferred freeze behavior
 * Screen is visible initially, but only freezes when explicit interactions trigger it
 * 
 * @param {string} screenName - Name of the screen
 * @returns {object} - control helpers and freeze handlers
 */
export function useDeferredFreeze(screenName) {
  const [isFrozen, setIsFrozen] = useState(false);
  const hasFrozenRef = useRef(false);

  const isWeb = Platform.OS === 'web';
  const isConfiguredToFreeze = shouldFreezeScreen(screenName);
  const shouldFreeze = isWeb && isConfiguredToFreeze;

  const freeze = useCallback(() => {
    if (!shouldFreeze || hasFrozenRef.current) {
      return;
    }
    hasFrozenRef.current = true;
    setIsFrozen(true);
  }, [shouldFreeze]);

  const unfreeze = useCallback(() => {
    if (!shouldFreeze) {
      return;
    }
    hasFrozenRef.current = false;
    setIsFrozen(false);
  }, [shouldFreeze]);

  const toggleFreeze = useCallback(() => {
    if (!shouldFreeze) {
      return;
    }
    setIsFrozen(prev => {
      const next = !prev;
      hasFrozenRef.current = next;
      return next;
    });
  }, [shouldFreeze]);

  const handlePressInteraction = useCallback((event) => {
    if (!shouldFreeze) {
      return;
    }

    if (!hasFrozenRef.current) {
      freeze();
    }

    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }

    return false;
  }, [freeze, shouldFreeze]);

  // Reset when screen changes or freezing disabled
  useEffect(() => {
    if (!shouldFreeze) {
      hasFrozenRef.current = false;
      setIsFrozen(false);
    }
  }, [shouldFreeze, screenName]);

  const freezeHandlers = useMemo(() => {
    if (!shouldFreeze) {
      return {};
    }

    return {
      onPress: handlePressInteraction,
      onLongPress: handlePressInteraction,
      ...(isWeb && {
        onClick: handlePressInteraction,
      }),
    };
  }, [handlePressInteraction, isWeb, shouldFreeze]);

  const isFrozenSync = useCallback(() => {
    return shouldFreeze && hasFrozenRef.current;
  }, [shouldFreeze]);

  return {
    isFrozen: shouldFreeze && isFrozen,
    isFrozenSync,
    handleInteraction: handlePressInteraction,
    freezeHandlers,
    freeze,
    unfreeze,
    toggleFreeze,
    shouldFreeze,
  };
}
