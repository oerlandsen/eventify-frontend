import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

const HANDLE_SIZE = 20;
const TRACK_HEIGHT = 4;
const FIXED_MIN = 0;
const FIXED_MAX = 300000;
const STEP = 500;

export default function RangeSlider({
  min,
  max,
  onValueChange,
  containerStyle,
}) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = useRef(0);
  
  const minHandlePos = useRef(new Animated.Value(0)).current;
  const maxHandlePos = useRef(new Animated.Value(0)).current;
  const activeRangeLeft = useRef(new Animated.Value(0)).current;
  const activeRangeWidth = useRef(new Animated.Value(0)).current;

  const currentMinPos = useRef(0);
  const currentMaxPos = useRef(0);

  const getPosition = useCallback((value) => {
    if (sliderWidth === 0) return 0;
    const range = FIXED_MAX - FIXED_MIN;
    if (range === 0) return 0;
    const percent = (value - FIXED_MIN) / range;
    return percent * sliderWidth;
  }, [sliderWidth]);

  const getValue = useCallback((position) => {
    if (sliderWidth === 0) return FIXED_MIN;
    const range = FIXED_MAX - FIXED_MIN;
    const percent = Math.max(0, Math.min(1, position / sliderWidth));
    let value = FIXED_MIN + percent * range;
    value = Math.round(value / STEP) * STEP;
    return Math.max(FIXED_MIN, Math.min(FIXED_MAX, value));
  }, [sliderWidth]);

  useEffect(() => {
    if (sliderWidth === 0) return;
    const minPos = getPosition(min);
    const maxPos = getPosition(max);
    currentMinPos.current = minPos;
    currentMaxPos.current = maxPos;
    minHandlePos.setValue(minPos);
    maxHandlePos.setValue(maxPos);
    activeRangeLeft.setValue(minPos);
    activeRangeWidth.setValue(Math.max(0, maxPos - minPos));
  }, [min, max, sliderWidth, getPosition]);

  const updateHandles = useCallback((newMinPos, newMaxPos) => {
    currentMinPos.current = newMinPos;
    currentMaxPos.current = newMaxPos;
    minHandlePos.setValue(newMinPos);
    maxHandlePos.setValue(newMaxPos);
    activeRangeLeft.setValue(newMinPos);
    activeRangeWidth.setValue(Math.max(0, newMaxPos - newMinPos));
    
    const newMin = getValue(newMinPos);
    const newMax = getValue(newMaxPos);
    if (onValueChange) {
      onValueChange({ min: newMin, max: newMax });
    }
  }, [getValue, onValueChange]);

  const panResponderMin = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minHandlePos.setOffset(currentMinPos.current);
        minHandlePos.setValue(0);
      },
      onPanResponderMove: (evt, gesture) => {
        const newPos = currentMinPos.current + gesture.dx;
        const constrainedMin = Math.max(0, Math.min(newPos, currentMaxPos.current - HANDLE_SIZE * 0.5));
        const constrainedMax = currentMaxPos.current;
        updateHandles(constrainedMin, constrainedMax);
        minHandlePos.setValue(constrainedMin - currentMinPos.current);
      },
      onPanResponderRelease: () => {
        const finalPos = currentMinPos.current + minHandlePos._value;
        minHandlePos.flattenOffset();
        const constrainedMin = Math.max(0, Math.min(finalPos, currentMaxPos.current - HANDLE_SIZE * 0.5));
        updateHandles(constrainedMin, currentMaxPos.current);
      },
    })
  ).current;

  const panResponderMax = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maxHandlePos.setOffset(currentMaxPos.current);
        maxHandlePos.setValue(0);
      },
      onPanResponderMove: (evt, gesture) => {
        const newPos = currentMaxPos.current + gesture.dx;
        const constrainedMax = Math.min(sliderWidth, Math.max(newPos, currentMinPos.current + HANDLE_SIZE * 0.5));
        const constrainedMin = currentMinPos.current;
        updateHandles(constrainedMin, constrainedMax);
        maxHandlePos.setValue(constrainedMax - currentMaxPos.current);
      },
      onPanResponderRelease: () => {
        const finalPos = currentMaxPos.current + maxHandlePos._value;
        maxHandlePos.flattenOffset();
        const constrainedMax = Math.min(sliderWidth, Math.max(finalPos, currentMinPos.current + HANDLE_SIZE * 0.5));
        updateHandles(currentMinPos.current, constrainedMax);
      },
    })
  ).current;

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `$${price.toLocaleString('es-CL')}`;
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width - 32;
        if (width > 0 && width !== sliderWidthRef.current) {
          sliderWidthRef.current = width;
          setSliderWidth(width);
        }
      }}
    >
      {/* Live label above showing "$min – $max" */}
      <View style={styles.liveLabel}>
        <Text style={styles.liveLabelText}>
          {formatPrice(min)} – {formatPrice(max)}
        </Text>
      </View>
      
      {/* Track container */}
      <View style={[styles.trackContainer, { width: sliderWidth || '100%' }]}>
        {/* Full track (background) - matches SearchScreen: #ccc */}
        <View style={styles.track} />
        {/* Active range (highlighted segment) - matches SearchScreen: #6A39FF */}
        <Animated.View
          style={[
            styles.activeTrack,
            {
              left: activeRangeLeft,
              width: activeRangeWidth,
            },
          ]}
        />
        {/* Min handle */}
        <Animated.View
          style={[
            styles.handle,
            {
              transform: [{ translateX: minHandlePos }],
            },
          ]}
          {...panResponderMin.panHandlers}
        >
          <View style={styles.handleInner} />
        </Animated.View>
        {/* Max handle */}
        <Animated.View
          style={[
            styles.handle,
            {
              transform: [{ translateX: maxHandlePos }],
            },
          ]}
          {...panResponderMax.panHandlers}
        >
          <View style={styles.handleInner} />
        </Animated.View>
      </View>
      
      {/* Range labels (min/max) */}
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{formatPrice(FIXED_MIN)}</Text>
        <Text style={styles.rangeLabel}>{formatPrice(FIXED_MAX)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  liveLabel: {
    alignItems: 'center',
    marginBottom: 12,
  },
  liveLabelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
  },
  // Matches SearchScreen slider track style
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: '#ccc',
    borderRadius: 2,
    width: '100%',
  },
  // Matches SearchScreen slider active track style
  activeTrack: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    backgroundColor: '#6A39FF',
    borderRadius: 2,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    marginLeft: -HANDLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // Matches SearchScreen slider thumb style (circular, purple with white border)
  handleInner: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#6A39FF',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeLabel: {
    color: '#ccc',
    fontSize: 12,
  },
});
