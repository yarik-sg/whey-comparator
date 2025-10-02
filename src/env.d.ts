/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERPAI_PRICE_ALERT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
