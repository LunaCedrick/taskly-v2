function hasUnsafeCharacters(value: string) {
  return value.includes('\\') || [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })
}

export function authReturnDestination(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') ||
    hasUnsafeCharacters(value)) return '/'
  try {
    const url = new URL(value, 'https://taskly.invalid')
    const decodedPath = decodeURIComponent(url.pathname)
    if (url.origin !== 'https://taskly.invalid' || decodedPath.startsWith('//') ||
      hasUnsafeCharacters(decodedPath) ||
      decodedPath.replace(/\/+$/, '').toLowerCase() === '/sign-in') return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}
