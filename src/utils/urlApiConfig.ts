export interface UrlApiConfig {
  hasConfig: boolean
  key1?: string
  key2?: string
  key3?: string
  url1?: string
  url2?: string
  url3?: string
}

const API_QUERY_KEYS = [
  'apikey',
  'apikey1',
  'apikey2',
  'apikey3',
  'apiurl',
  'apiurl1',
  'apiurl2',
  'apiurl3',
]

function normalizeValue(raw: string | null) {
  const value = (raw || '').trim()
  return value || undefined
}

function getMergedUrlSearchParams() {
  const merged = new URLSearchParams(window.location.search)
  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')

  if (queryIndex > -1) {
    const hashParams = new URLSearchParams(hash.slice(queryIndex + 1))
    hashParams.forEach((value, key) => {
      if (!merged.has(key))
        merged.set(key, value)
    })
  }

  return merged
}

function readParam(params: URLSearchParams, name: string, index?: number) {
  const raw = index
    ? params.get(`${name}${index}`)
    : params.get(name)

  return normalizeValue(raw)
}

export function readUrlApiConfig(): UrlApiConfig {
  if (typeof window === 'undefined')
    return { hasConfig: false }

  const params = getMergedUrlSearchParams()
  const hasConfig = API_QUERY_KEYS.some(name => params.has(name))

  return {
    hasConfig,
    key1: readParam(params, 'apikey', 1) ?? readParam(params, 'apikey'),
    key2: readParam(params, 'apikey', 2),
    key3: readParam(params, 'apikey', 3),
    url1: readParam(params, 'apiurl', 1) ?? readParam(params, 'apiurl'),
    url2: readParam(params, 'apiurl', 2),
    url3: readParam(params, 'apiurl', 3),
  }
}

export function hasUrlApiConfig() {
  return readUrlApiConfig().hasConfig
}
