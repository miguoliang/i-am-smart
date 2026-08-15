import { BUILTIN_PACKS } from './builtin'
import { deleteCloudPack, listCloudPacks, upsertCloudPack } from './cloud'
import { isSupabaseConfigured } from '../lib/supabase'
import { hydratePack, type LessonPack } from './types'

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

function stamp(pack: LessonPack): LessonPack {
  return {
    ...pack,
    source: 'custom',
    updatedAt: new Date().toISOString(),
  }
}

export async function listCustomPacks(): Promise<LessonPack[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const packs = (req.result as LessonPack[]).map((p) =>
        hydratePack({
          ...p,
          source: 'custom',
        }),
      )
      packs.sort((a, b) => {
        const tb = Date.parse(b.updatedAt ?? '') || 0
        const ta = Date.parse(a.updatedAt ?? '') || 0
        if (tb !== ta) return tb - ta
        return a.titleZh.localeCompare(b.titleZh, 'zh')
      })
      resolve(packs)
    }
    req.onerror = () => reject(req.error ?? new Error('list failed'))
  })
}

export async function saveCustomPack(
  pack: LessonPack,
  opts: { syncCloud?: boolean } = {},
): Promise<LessonPack> {
  let next = stamp(pack)
  if (opts.syncCloud !== false && isSupabaseConfigured()) {
    try {
      next = await upsertCloudPack(next)
    } catch (err) {
      // Keep local save even if cloud fails; surface later via UI.
      console.warn('cloud upsert failed', err)
      next = { ...next, cloudSynced: false }
    }
  }
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(next)
  await txDone(tx)
  return next
}

export async function deleteCustomPack(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await deleteCloudPack(id)
    } catch (err) {
      console.warn('cloud delete failed', err)
    }
  }
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
      resolve(pack ? hydratePack({ ...pack, source: 'custom' }) : undefined)
    }
    req.onerror = () => reject(req.error ?? new Error('get failed'))
  })
}

function mergePacks(local: LessonPack[], cloud: LessonPack[]): LessonPack[] {
  const map = new Map<string, LessonPack>()
  for (const p of local) map.set(p.id, p)
  for (const p of cloud) {
    const prev = map.get(p.id)
    if (!prev) {
      map.set(p.id, p)
      continue
    }
    const prevTs = Date.parse(prev.updatedAt ?? '') || 0
    const nextTs = Date.parse(p.updatedAt ?? '') || 0
    map.set(p.id, nextTs >= prevTs ? { ...p, source: 'custom' } : prev)
  }
  return [...map.values()].sort((a, b) =>
    a.titleZh.localeCompare(b.titleZh, 'zh'),
  )
}

/** Pull from Supabase into IndexedDB, then return local+builtin list. */
export async function syncFromCloud(): Promise<LessonPack[]> {
  if (!isSupabaseConfigured()) return listAllPacks()
  const cloud = await listCloudPacks()
  const local = await listCustomPacks()
  const merged = mergePacks(local, cloud)
  for (const pack of cloud) {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ ...pack, source: 'custom' })
    await txDone(tx)
  }
  return [...merged, ...BUILTIN_PACKS]
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

export async function pushLocalPackToCloud(id: string): Promise<LessonPack> {
  const pack = await getCustomPack(id)
  if (!pack) throw new Error('课包不存在')
  const saved = await upsertCloudPack(pack)
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(saved)
  await txDone(tx)
  return saved
}
