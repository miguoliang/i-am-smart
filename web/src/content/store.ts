import { BUILTIN_PACKS } from './builtin'
import type { LessonPack } from './types'

const DB_NAME = 'peilian-content'
const DB_VERSION = 1
const STORE = 'packs'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB tx failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB tx aborted'))
  })
}

export async function listCustomPacks(): Promise<LessonPack[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const packs = (req.result as LessonPack[]).map((p) => ({
        ...p,
        source: 'custom' as const,
      }))
      packs.sort((a, b) => a.titleZh.localeCompare(b.titleZh, 'zh'))
      resolve(packs)
    }
    req.onerror = () => reject(req.error ?? new Error('list failed'))
  })
}

export async function saveCustomPack(pack: LessonPack): Promise<void> {
  const db = await openDb()
  const record: LessonPack = { ...pack, source: 'custom' }
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(record)
  await txDone(tx)
}

export async function deleteCustomPack(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(id)
  await txDone(tx)
}

export async function getCustomPack(id: string): Promise<LessonPack | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => {
      const pack = req.result as LessonPack | undefined
      resolve(pack ? { ...pack, source: 'custom' } : undefined)
    }
    req.onerror = () => reject(req.error ?? new Error('get failed'))
  })
}

export async function listAllPacks(): Promise<LessonPack[]> {
  const custom = await listCustomPacks()
  return [...custom, ...BUILTIN_PACKS]
}

export async function getPackById(id: string): Promise<LessonPack | undefined> {
  const custom = await getCustomPack(id)
  if (custom) return custom
  return BUILTIN_PACKS.find((p) => p.id === id)
}
