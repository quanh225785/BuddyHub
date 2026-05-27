const accessTokenKey = 'access_token'
const authRedirectMessageKey = 'auth_redirect_message'

type JwtPayload = {
  exp?: number
}

export const homePath = '/me'
export const loginPath = '/auth/login'
export const registerPath = '/auth/register'

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(window.atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(accessTokenKey)
  } catch {
    return null
  }
}

export function setAccessToken(token: string) {
  localStorage.setItem(accessTokenKey, token)
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(accessTokenKey)
  } catch {
    return
  }
}

export function isAccessTokenValid(token = getAccessToken()) {
  if (!token) return false

  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false

  return payload.exp * 1000 > Date.now()
}

export function clearExpiredAccessToken() {
  if (!isAccessTokenValid()) {
    clearAccessToken()
  }
}

export function setAuthRedirectMessage(message: string) {
  try {
    sessionStorage.setItem(authRedirectMessageKey, message)
  } catch {
    return
  }
}

export function takeAuthRedirectMessage() {
  try {
    const message = sessionStorage.getItem(authRedirectMessageKey)
    sessionStorage.removeItem(authRedirectMessageKey)
    return message
  } catch {
    return null
  }
}
