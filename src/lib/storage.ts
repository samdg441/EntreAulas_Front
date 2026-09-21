const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const REDIRECT_KEY = 'redirectTo'

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },
  getUser<T = unknown>(): T | null {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  },
  setUser(user: unknown): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  getRedirectTo(): string | null {
    return localStorage.getItem(REDIRECT_KEY)
  },
  setRedirectTo(path: string): void {
    localStorage.setItem(REDIRECT_KEY, path)
  },
  consumeRedirectTo(): string | null {
    const value = localStorage.getItem(REDIRECT_KEY)
    if (value) localStorage.removeItem(REDIRECT_KEY)
    return value
  },
}
