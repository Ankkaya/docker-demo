/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV_NAME?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AUTH_LOGIN_METHODS?: string
  readonly VITE_AUTH_DEFAULT_AVATAR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
