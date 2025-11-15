import { Platform } from 'react-native';

/**
 * Checks if a specific screen should be frozen based on environment variables.
 * Only applies to web builds.
 * 
 * @param {string} screenName - Name of the screen ('profile', 'notifications', 'search')
 * @returns {boolean} - true if the screen should be frozen
 */
export function shouldFreezeScreen(screenName) {
  // Only freeze on web builds
  if (Platform.OS !== 'web') {
    return false;
  }

  // Normalize screen name to lowercase
  const normalizedName = screenName.toLowerCase();
  const freezeableScreens = ['profile', 'notifications', 'search'];
  
  // Only allow freezing the three specified screens
  if (!freezeableScreens.includes(normalizedName)) {
    return false;
  }

  // Check per-screen toggle first (takes highest precedence)
  const screenEnvVar = `NEXT_PUBLIC_FREEZE_${normalizedName.toUpperCase()}`;
  const screenValue = process.env[screenEnvVar];
  
  if (screenValue !== undefined && screenValue !== '') {
    // Per-screen flag explicitly set
    return screenValue === 'true' || screenValue === '1';
  }

  // Check global toggle (second precedence)
  const globalValue = process.env.NEXT_PUBLIC_FREEZE_SELECTED_SCREENS;
  
  if (globalValue !== undefined && globalValue !== '') {
    // Global flag explicitly set
    const shouldFreeze = globalValue === 'true' || globalValue === '1';
    if (shouldFreeze) {
      return true;
    }
    // If global is explicitly false, respect it
    if (globalValue === 'false' || globalValue === '0') {
      return false;
    }
  }

  // Default behavior: check Vercel deployment environment
  // In Preview deployments, default to frozen for the three screens
  // In Production, default to not frozen
  if (typeof window !== 'undefined') {
    // Check Vercel environment
    // Vercel sets VERCEL_ENV to 'production', 'preview', or 'development'
    const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV;
    const isPreview = vercelEnv === 'preview';
    const isProduction = vercelEnv === 'production';
    
    if (isPreview) {
      // Default to frozen in preview deployments
      return true;
    }
    
    if (isProduction) {
      // Default to not frozen in production deployments
      return false;
    }
  }

  // Default: frozen for the three screens (can be overridden with env vars)
  return true;
}

