const runtimeAppId = typeof globalThis !== 'undefined' ? globalThis.__app_id : undefined;
const appId = runtimeAppId || 'clustr-mongo';

const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
const socketUrl =
  envSocketUrl ||
  (typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : `${window.location.protocol}//${window.location.host}`)
    : 'http://127.0.0.1:5000');

const envApiUrl = import.meta.env.VITE_API_URL;
const apiBaseUrl =
  envApiUrl ||
  (typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : `${window.location.protocol}//${window.location.host}`)
    : 'http://127.0.0.1:5000');

export { appId, socketUrl, apiBaseUrl };
