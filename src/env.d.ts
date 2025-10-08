/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERPAI_PRICE_ALERT_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_API_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
