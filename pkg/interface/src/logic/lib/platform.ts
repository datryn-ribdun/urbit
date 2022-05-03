
const ua = window.navigator.userAgent;

export const IS_IOS = ua.includes('iPhone') || ua.includes('iPad');

export const IS_SAFARI = ua.includes('Safari') && !ua.includes('Chrome');

export const IS_ANDROID = ua.includes('Android');

export const IS_MOBILE = window.innerWidth < 550;
export const IS_SHORT_SCREEN = !IS_MOBILE && window.innerHeight < 660;

export const isMobileApp = () => IS_MOBILE && window.isMobileApp;
export const isMobileWeb = () => IS_MOBILE && !window.isMobileApp;
