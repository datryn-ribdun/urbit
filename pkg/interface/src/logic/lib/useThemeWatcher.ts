import dark from '@tlon/indigo-dark';
import light from '@tlon/indigo-light';
import { useEffect } from 'react';
import chroma from 'chroma-js';
import { cloneDeep } from 'lodash';
import useLocalState, { selectLocalState } from '../state/local';
import useSettingsState, { selectDisplayState } from '../state/settings';

const selLocal = selectLocalState(['dark', 'set']);

export function useThemeWatcher() {
  const { set, dark: isDark } = useLocalState(selLocal);
  const display = useSettingsState(selectDisplayState);

  const getTheme = () => {
    if (display.theme === 'custom') {
      const valid = /^#[0-9A-F]{6}$/i;
      const clonedLight = cloneDeep(light);
      clonedLight.fonts.sans = display.sans;
      clonedLight.colors.black = valid.test(display.black)
        ? display.black
        : '#000000';
      clonedLight.colors.washedGray = `rgba(${chroma(
        valid.test(display.black) ? display.black : '#000000'
      )
        .alpha(0.25)
        .rgba()
        .toString()})`;
      clonedLight.colors.lightGray = `rgba(${chroma(
        valid.test(display.black) ? display.black : '#000000'
      )
        .alpha(0.5)
        .rgba()
        .toString()})`;
      clonedLight.colors.gray = `rgba(${chroma(
        valid.test(display.black) ? display.black : '#000000'
      )
        .alpha(0.75)
        .rgba()
        .toString()})`;
      clonedLight.colors.white = display.white;
      clonedLight.borders = ['none', display.border];
      return clonedLight;
    }
    return (isDark && display?.theme == 'auto') ||
      display?.theme == 'dark'
      ? dark
      : light;
  };

  const theme = getTheme();

  useEffect(() => {
    const updateTheme = (e: MediaQueryListEvent) => set(s => ({ dark: e.matches }));
    const updateMobile = (e: MediaQueryListEvent) => set(s => ({ mobile: e.matches }));
    const updateSmall = (e: MediaQueryListEvent) => set(s => ({ breaks: { sm: e.matches } }));
    const updateMedium = (e: MediaQueryListEvent) => set(s => ({ breaks: { md: e.matches } }));
    const updateLarge = (e: MediaQueryListEvent) => set(s => ({ breaks: { lg: e.matches } }));

      const themeWatcher = window.matchMedia('(prefers-color-scheme: dark)');
      const mobileWatcher = window.matchMedia(`(max-width: ${theme.breakpoints[0]})`);
      const smallWatcher = window.matchMedia(`(min-width: ${theme.breakpoints[0]})`);
      const mediumWatcher = window.matchMedia(`(min-width: ${theme.breakpoints[1]})`);
      const largeWatcher = window.matchMedia(`(min-width: ${theme.breakpoints[2]})`);

    if (themeWatcher?.addEventListener &&
      mobileWatcher?.addEventListener &&
      smallWatcher?.addEventListener &&
      mediumWatcher?.addEventListener &&
      largeWatcher?.addEventListener) {
      themeWatcher.addEventListener('change', updateTheme);
      mobileWatcher.addEventListener('change', updateMobile);
      smallWatcher.addEventListener('change', updateSmall);
      mediumWatcher.addEventListener('change', updateMedium);
      largeWatcher.addEventListener('change', updateLarge);

      updateTheme({ matches: themeWatcher.matches } as MediaQueryListEvent);
      updateMobile({ matches: mobileWatcher.matches } as MediaQueryListEvent);
      updateSmall({ matches: smallWatcher.matches } as MediaQueryListEvent);
      updateMedium({ matches: mediumWatcher.matches } as MediaQueryListEvent);
      updateLarge({ matches: largeWatcher.matches } as MediaQueryListEvent);

      return () => {
        themeWatcher.removeEventListener('change', updateTheme);
        mobileWatcher.removeEventListener('change', updateMobile);
        smallWatcher.removeEventListener('change', updateSmall);
        mediumWatcher.removeEventListener('change', updateMedium);
        largeWatcher.removeEventListener('change', updateLarge);
      };
    }
  }, []);

  return {
    display,
    theme
  };
}
