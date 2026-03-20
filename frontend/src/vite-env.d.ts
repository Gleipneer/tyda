/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full bas-URL till API (utan avslutande slash), t.ex. https://api.example.com/api */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
