import { PatpNoSig } from '@urbit/api';
import useHarkState from '~/logic/state/hark';

declare global {
  interface Window {
    ship: PatpNoSig;
    desk: string;
    hark: typeof useHarkState.getState;
    isMobileApp: boolean;
    mobileAppVersion?: string;
    bootstrapApi: Function;
    toggleOmnibox: Function;
    routeToHome: Function;
  }
}
