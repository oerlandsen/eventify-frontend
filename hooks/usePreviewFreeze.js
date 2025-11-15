import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { shouldFreezeScreen } from '../utils/freezeConfig';

/**
 * Hook to handle preview-only mode with tap-to-toggle overlay
 * Screen is always non-interactive, but overlay can be toggled on/off
 * 
 * @param {string} screenName - Name of the screen
 * @returns {object} - { showOverlay, toggleOverlay, freezeHandlers, isPreviewMode }
 */
export function usePreviewFreeze(screenName) {
  const [showOverlay, setShowOverlay] = useState(false);
  const scrollStartRef = useRef({ x: 0, y: 0 });
  const isScrollingRef = useRef(false);
  
  // Check if this screen should use preview freeze (web only)
  const shouldFreeze = shouldFreezeScreen(screenName);
  const isWeb = Platform.OS === 'web';
  const isPreviewMode = shouldFreeze && isWeb;

  // Toggle overlay visibility
  const toggleOverlay = useCallback(() => {
    if (!isPreviewMode) return;
    setShowOverlay(prev => !prev);
  }, [isPreviewMode]);

  // Handle tap/click (non-scroll interaction) - block it and show overlay if hidden
  const handleTapInteraction = useCallback((event) => {
    if (!isPreviewMode || showOverlay) {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      return false;
    }
    
    // Don't show overlay if user is scrolling
    if (isScrollingRef.current) {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      return false;
    }
    
    // Always prevent interactions
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    
    // Show overlay on tap (not scroll)
    setShowOverlay(true);
    return false;
  }, [isPreviewMode, showOverlay]);

  // Handle any interaction - always block it
  const handleInteraction = useCallback((event) => {
    if (!isPreviewMode) return;
    
    // Always prevent interactions
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    
    // If overlay is not shown and not scrolling, show overlay
    if (!showOverlay && !isScrollingRef.current) {
      setShowOverlay(true);
    }
    return false;
  }, [isPreviewMode, showOverlay]);

  // Reset overlay when screen changes
  useEffect(() => {
    if (!isPreviewMode) {
      setShowOverlay(false);
    }
  }, [isPreviewMode, screenName]);

  // Create comprehensive interaction handlers that always block
  const freezeHandlers = {
    // Touch/Click handlers - block and show overlay if hidden (only if not scrolling)
    onPress: (e) => {
      if (!isPreviewMode) return;
      if (showOverlay || isScrollingRef.current) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        return false;
      }
      handleTapInteraction(e);
      return false;
    },
    onPressIn: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return false;
    },
    onPressOut: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return false;
    },
    onLongPress: (e) => {
      if (!isPreviewMode) return;
      if (!showOverlay && !isScrollingRef.current) {
        handleTapInteraction(e);
      }
      return false;
    },
    
    // Scroll handlers - allow vertical scrolling in preview mode when overlay is hidden
    // Don't attach these handlers - let ScrollView handle scrolling naturally
    // We only control scrollEnabled prop
    onScroll: undefined, // Allow scroll events to pass through
    onScrollBeginDrag: (e) => {
      if (!isPreviewMode) return;
      // Block scroll drag when overlay is visible
      if (showOverlay) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        return false;
      }
      // Track that scrolling is happening
      isScrollingRef.current = true;
    },
    onScrollEndDrag: (e) => {
      if (!isPreviewMode) return;
      // Block scroll drag when overlay is visible
      if (showOverlay) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        return false;
      }
      // Reset scrolling flag after a delay
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    },
    onMomentumScrollBegin: (e) => {
      if (!isPreviewMode) return;
      // Block momentum scroll when overlay is visible
      if (showOverlay) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        return false;
      }
      isScrollingRef.current = true;
    },
    onMomentumScrollEnd: (e) => {
      if (!isPreviewMode) return;
      // Block momentum scroll when overlay is visible
      if (showOverlay) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        return false;
      }
      // Reset scrolling flag after a delay
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    },
    
    // Text input handlers - always block
    onFocus: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      handleInteraction(e);
      return false;
    },
    onBlur: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return false;
    },
    onChange: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return false;
    },
    onChangeText: (text) => {
      if (!isPreviewMode) return;
      handleInteraction();
      return '';
    },
    onSelectionChange: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return false;
    },
    
    // Drag/Swipe handlers - always block
    onPanResponderGrant: handleInteraction,
    onPanResponderMove: (e) => {
      if (!isPreviewMode) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return false;
    },
    onPanResponderRelease: handleInteraction,
    
    // Web-specific handlers
    ...(isWeb && {
      onClick: (e) => {
        if (!isPreviewMode) return;
        if (showOverlay || isScrollingRef.current) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Click (not scroll) - show overlay
        handleTapInteraction(e);
        return false;
      },
      onMouseDown: (e) => {
        if (!isPreviewMode) return;
        if (showOverlay) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Reset scroll state on mouse down
        isScrollingRef.current = false;
        scrollStartRef.current = { 
          x: e.nativeEvent?.clientX || 0, 
          y: e.nativeEvent?.clientY || 0 
        };
      },
      onMouseMove: (e) => {
        // Don't show overlay on mouse move, just track
        if (!isPreviewMode) return;
        if (showOverlay) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Allow mouse move for scrolling
      },
      onMouseUp: (e) => {
        if (!isPreviewMode) return;
        if (showOverlay || isScrollingRef.current) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Mouse up without scroll - treat as tap
        handleTapInteraction(e);
        return false;
      },
      onTouchStart: (e) => {
        if (!isPreviewMode) return;
        if (showOverlay) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Mark that touch started
        isScrollingRef.current = false;
        scrollStartRef.current = { 
          x: e.nativeEvent?.pageX || 0, 
          y: e.nativeEvent?.pageY || 0 
        };
      },
      onTouchMove: (e) => {
        if (!isPreviewMode) return;
        if (showOverlay) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Detect if this is a scroll gesture (movement > threshold)
        if (scrollStartRef.current && e?.nativeEvent) {
          const currentX = e.nativeEvent.pageX || e.nativeEvent.touches?.[0]?.pageX || 0;
          const currentY = e.nativeEvent.pageY || e.nativeEvent.touches?.[0]?.pageY || 0;
          const moveX = Math.abs(currentX - scrollStartRef.current.x);
          const moveY = Math.abs(currentY - scrollStartRef.current.y);
          // If significant vertical movement, it's a scroll (allow it)
          if (moveY > 5 && moveY > moveX * 2) {
            isScrollingRef.current = true;
          } else if (moveX > 5) {
            // Horizontal movement - also mark as scrolling to prevent overlay
            isScrollingRef.current = true;
          }
        }
        // Don't block touch move to allow scrolling - let it pass through
        // Only block if overlay is shown (handled above)
      },
      onTouchEnd: (e) => {
        if (!isPreviewMode) return;
        if (showOverlay) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Check if this was a tap (not a scroll) by looking at movement
        const wasScrolling = isScrollingRef.current;
        // Reset scrolling flag after a short delay
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
        // If it wasn't a scroll, treat as tap and show overlay
        if (!wasScrolling) {
          handleTapInteraction(e);
        }
        return false;
      },
      onWheel: (e) => {
        if (!isPreviewMode) return;
        // Block wheel scroll when overlay is visible
        if (showOverlay) {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          return false;
        }
        // Allow wheel scrolling in preview mode
        isScrollingRef.current = true;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      },
      onKeyDown: (e) => {
        if (!isPreviewMode) return;
        e?.preventDefault?.();
        e?.stopPropagation?.();
        handleInteraction(e);
        return false;
      },
      onKeyPress: (e) => {
        if (!isPreviewMode) return;
        e?.preventDefault?.();
        e?.stopPropagation?.();
        handleInteraction(e);
        return false;
      },
      onKeyUp: (e) => {
        if (!isPreviewMode) return;
        e?.preventDefault?.();
        e?.stopPropagation?.();
        return false;
      },
    }),
  };

  return {
    showOverlay: isPreviewMode && showOverlay,
    toggleOverlay,
    freezeHandlers,
    isPreviewMode,
    shouldFreeze: isPreviewMode,
  };
}

