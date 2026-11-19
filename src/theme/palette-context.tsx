'use client';

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  defaultPaletteId,
  isPaletteId,
  type PaletteId,
  paletteStorageKey,
} from './palettes';

interface PaletteContextValue {
  paletteId: PaletteId;
  selectPalette: (id: PaletteId) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/**
 * Reads the palette that the init script in the root layout applied to the
 * `html` element. On the server, it returns the default palette.
 */
function readAppliedPalette(): PaletteId {
  if (typeof document === 'undefined') {
    return defaultPaletteId;
  }
  const applied = document.documentElement.dataset.palette;
  return isPaletteId(applied) ? applied : defaultPaletteId;
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  // The palette id is shown only inside the theme menu, which is closed on the
  // first render, so the server and client values never cause a mismatch.
  const [paletteId, setPaletteId] = useState<PaletteId>(readAppliedPalette);

  const selectPalette = useCallback((id: PaletteId) => {
    setPaletteId(id);
    document.documentElement.dataset.palette = id;
    try {
      localStorage.setItem(paletteStorageKey, id);
    } catch {
      // Storage can be unavailable (private mode): the choice lasts for the session.
    }
  }, []);

  const value = useMemo(
    () => ({ paletteId, selectPalette }),
    [paletteId, selectPalette]
  );

  return <PaletteContext value={value}>{children}</PaletteContext>;
}

export function usePalette(): PaletteContextValue {
  const context = use(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used inside <PaletteProvider>.');
  }
  return context;
}
