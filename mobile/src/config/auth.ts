const AUTH_METHOD_SEPARATOR = ','

export function getEnabledLoginMethods() {
  const rawValue = import.meta.env.VITE_AUTH_LOGIN_METHODS || 'wechat'
  return rawValue
    .split(AUTH_METHOD_SEPARATOR)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
}

export const authEnvConfig = {
  enabledLoginMethods: getEnabledLoginMethods(),
  defaultAvatarUrl: import.meta.env.VITE_AUTH_DEFAULT_AVATAR_URL || '',
}
