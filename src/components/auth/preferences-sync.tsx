'use client';

import { useEffect, useRef, useState } from 'react';

import { useColorScheme } from '@mui/material/styles';

import { useAuth } from './auth-context';

import { isLocale } from '@/lib/locale';
import {
  savePreferredLocale,
  usePreferredLocale,
} from '@/lib/preferred-locale';
import { usePalette } from '@/theme/palette-context';
import { isPaletteId } from '@/theme/palettes';

const colorModes = ['light', 'dark', 'system'] as const;

type ColorMode = (typeof colorModes)[number];

function isColorMode(value: unknown): value is ColorMode {
  return colorModes.includes(value as ColorMode);
}

/**
 * Keeps language, color mode, and palette in the profile, so they follow
 * the visitor on every device. On sign-in, the saved values win; after
 * that, every change is saved. It renders nothing.
 */
export function PreferencesSync() {
  const { account, profile, updateProfile } = useAuth();
  const { mode, setMode } = useColorScheme();
  const { paletteId, selectPalette } = usePalette();
  const locale = usePreferredLocale();
  // Account whose saved preferences were applied to this browser.
  const [appliedFor, setAppliedFor] = useState<string | null>(null);
  // Last values sent to the profile, to skip saves that change nothing.
  const lastSavedRef = useRef('');

  const accountId = account?.id ?? null;

  // Applies the saved preferences once per sign-in.
  useEffect(() => {
    if (
      !accountId ||
      !profile ||
      !mode ||
      !locale ||
      appliedFor === accountId
    ) {
      return;
    }
    const next = {
      locale: isLocale(profile.locale) ? profile.locale : locale,
      mode: isColorMode(profile.color_mode) ? profile.color_mode : mode,
      palette: isPaletteId(profile.palette) ? profile.palette : paletteId,
    };
    if (next.locale !== locale) {
      savePreferredLocale(next.locale);
    }
    if (next.mode !== mode) {
      setMode(next.mode);
    }
    if (next.palette !== paletteId) {
      selectPalette(next.palette);
    }
    // Values missing from the profile are saved by the next effect.
    lastSavedRef.current = JSON.stringify([
      profile.locale,
      profile.color_mode,
      profile.palette,
    ]);
    // The next render sees the applied values, so wait for it before saving.
    const timer = setTimeout(() => {
      setAppliedFor(accountId);
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [
    accountId,
    appliedFor,
    locale,
    mode,
    paletteId,
    profile,
    selectPalette,
    setMode,
  ]);

  // Saves every later change.
  useEffect(() => {
    if (!accountId || appliedFor !== accountId || !mode || !locale) {
      return;
    }
    const key = JSON.stringify([locale, mode, paletteId]);
    if (key === lastSavedRef.current) {
      return;
    }
    lastSavedRef.current = key;
    const save = async () => {
      try {
        await updateProfile({ locale, color_mode: mode, palette: paletteId });
      } catch {
        // Try again on the next change.
        lastSavedRef.current = '';
      }
    };
    void save();
  }, [accountId, appliedFor, locale, mode, paletteId, updateProfile]);

  return null;
}
