import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * FreezeOverlay - Renders a frozen/coming soon overlay for web builds only
 * Supports both immediate and deferred freeze modes
 * 
 * @param {boolean} isFrozen - Whether the overlay should be visible
 * @param {string} screenName - Name of the screen for SEO purposes
 * @param {boolean} deferred - If true, overlay only shows after interaction (default: false)
 * @param {function} onToggle - Optional callback to toggle overlay visibility
 */
export default function FreezeOverlay({ isFrozen, screenName, deferred = false, onToggle }) {
  // Only render on web
  if (Platform.OS !== 'web' || !isFrozen) {
    return null;
  }

  // Add SEO meta tags when frozen (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && isFrozen && typeof document !== 'undefined') {
      // Remove existing meta robots tag if any
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    }
  }, [isFrozen]);

  // Block body scroll when overlay is visible (web only)
  // When overlay is hidden, allow scrolling in preview mode
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (isFrozen) {
        // Prevent scrolling on body when overlay is visible
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          // Restore original overflow when overlay is hidden
          document.body.style.overflow = originalOverflow || '';
        };
      } else {
        // Ensure body scroll is enabled when overlay is hidden (for preview mode scrolling)
        document.body.style.overflow = '';
      }
    }
  }, [isFrozen]);

  // Handle tap/click on overlay background (outside message) to toggle
  const handleOverlayBackgroundTap = (e) => {
    if (Platform.OS === 'web' && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Call toggle callback if provided
    if (onToggle && typeof onToggle === 'function') {
      onToggle();
    }
    return true;
  };

  // Block taps on message container itself (don't toggle when clicking message)
  const handleMessageContainerTap = (e) => {
    if (Platform.OS === 'web' && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Don't call toggle - message container should not toggle overlay
    return true;
  };

  // Block interactions but allow toggle on background
  const handleInteraction = (e) => {
    if (Platform.OS === 'web' && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    return true;
  };

  return (
    <View 
      style={styles.overlay}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => false}
      onResponderGrant={handleInteraction}
      onResponderMove={handleInteraction}
      onResponderRelease={handleOverlayBackgroundTap}
      onResponderTerminate={handleInteraction}
      // Web-specific click handler for overlay background
      {...(Platform.OS === 'web' && {
        onClick: handleOverlayBackgroundTap,
        onTouchEnd: handleOverlayBackgroundTap,
      })}
    >
      <View 
        style={styles.messageContainer}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleMessageContainerTap}
        onResponderRelease={handleMessageContainerTap}
        {...(Platform.OS === 'web' && {
          onClick: handleMessageContainerTap,
          onTouchEnd: handleMessageContainerTap,
        })}
      >
        <Text style={styles.messageText}>
          Próximamente en: App Store y Google Play
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(106, 57, 255, 0.6)', // Subtle purple tint with opacity
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    // Block all pointer events - overlay captures all interactions
    pointerEvents: 'auto',
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      // Prevent any touch/pointer actions
      touchAction: 'none',
      // Prevent text selection
      WebkitTouchCallout: 'none',
    }),
  },
  messageContainer: {
    backgroundColor: 'rgba(28, 10, 62, 0.95)', // Dark purple background for message
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A187FF',
    maxWidth: '90%',
    // Ensure good contrast and readability
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Prevent clicks from bubbling to overlay background
    ...(Platform.OS === 'web' && {
      pointerEvents: 'auto',
    }),
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
    // Ensure good contrast and readability
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
