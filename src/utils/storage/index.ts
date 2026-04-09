interface StorageData<T = any> {
  data: T
  expire: number | null
}

interface StorageBackend {
  clear: () => void
  getItem: (key: string) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

const memoryStorageData = new Map<string, string>()

const memoryStorage: StorageBackend = {
  clear() {
    memoryStorageData.clear()
  },
  getItem(key) {
    return memoryStorageData.get(key) ?? null
  },
  removeItem(key) {
    memoryStorageData.delete(key)
  },
  setItem(key, value) {
    memoryStorageData.set(key, value)
  },
}

let activeStorage: StorageBackend | null = null
let warnedAboutStorageFallback = false

function warnStorageFallback(error: unknown) {
  if (warnedAboutStorageFallback || typeof console === 'undefined')
    return

  warnedAboutStorageFallback = true
  console.warn('[storage] localStorage unavailable, using in-memory fallback.', error)
}

function resolveStorage(): StorageBackend {
  if (activeStorage)
    return activeStorage

  if (typeof window === 'undefined') {
    activeStorage = memoryStorage
    return activeStorage
  }

  try {
    const storage = window.localStorage
    const probeKey = '__storage_probe__'
    storage.setItem(probeKey, probeKey)
    storage.removeItem(probeKey)
    activeStorage = storage
    return activeStorage
  }
  catch (error) {
    warnStorageFallback(error)
    activeStorage = memoryStorage
    return activeStorage
  }
}

function runWithStorage<T>(operation: (storage: StorageBackend) => T, fallback: T): T {
  try {
    return operation(resolveStorage())
  }
  catch (error) {
    warnStorageFallback(error)
    activeStorage = memoryStorage

    try {
      return operation(memoryStorage)
    }
    catch {
      return fallback
    }
  }
}

export function getStorageItem(key: string) {
  return runWithStorage(storage => storage.getItem(key), null)
}

export function setStorageItem(key: string, value: string) {
  runWithStorage(storage => storage.setItem(key, value), undefined)
}

export function removeStorageItem(key: string) {
  runWithStorage(storage => storage.removeItem(key), undefined)
}

export function clearStorage() {
  runWithStorage(storage => storage.clear(), undefined)
}

export function isPersistentStorageAvailable() {
  return resolveStorage() !== memoryStorage
}

export function createLocalStorage(options?: { expire?: number | null }) {
  const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 7

  const { expire } = Object.assign({ expire: DEFAULT_CACHE_TIME }, options)

  function set<T = any>(key: string, data: T) {
    const storageData: StorageData<T> = {
      data,
      expire: expire !== null ? new Date().getTime() + expire * 1000 : null,
    }

    const json = JSON.stringify(storageData)
    setStorageItem(key, json)
  }

  function get(key: string) {
    const json = getStorageItem(key)
    if (json) {
      let storageData: StorageData | null = null

      try {
        storageData = JSON.parse(json)
      }
      catch {
        // Prevent failure
      }

      if (storageData) {
        const { data, expire } = storageData
        if (expire === null || expire >= Date.now())
          return data
      }

      remove(key)
      return null
    }
  }

  function remove(key: string) {
    removeStorageItem(key)
  }

  function clear() {
    clearStorage()
  }

  return { set, get, remove, clear }
}

export const ls = createLocalStorage()

export const ss = createLocalStorage({ expire: null })
