import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { toContentPackFile } from './schema'
import {
  parsePos,
  type ContentPackFile,
  type LessonPack,
  type WordDef,
} from './types'

export interface CloudPackRow {
  id: string
  owner_id: string
  title_zh: string
  title_en: string
  blurb: string
  document: ContentPackFile
  updated_at: string
  created_at: string
}

function cloudError(err: unknown, fallback: string): Error {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : err instanceof Error
        ? err.message
        : ''
  if (/anonymous sign-ins are disabled/i.test(message)) {
    return new Error(
      '云端未开启匿名登录（Dashboard → Authentication → Providers → Anonymous）',
    )
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return new Error('连不上云端，请检查网络')
  }
  return new Error(message || fallback)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',', 2)
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function uploadWordImage(
  userId: string,
  packId: string,
  word: WordDef,
): Promise<string> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase 未配置')
  if (!word.image || !word.image.startsWith('data:')) return word.image

  const blob = dataUrlToBlob(word.image)
  const ext = blob.type.includes('png') ? 'png' : 'jpg'
  const path = `${userId}/${packId}/${word.id}.${ext}`
  const { error } = await sb.storage.from('pack-images').upload(path, blob, {
    upsert: true,
    contentType: blob.type,
  })
  if (error) throw cloudError(error, '上传图片失败')
  const { data } = sb.storage.from('pack-images').getPublicUrl(path)
  return data.publicUrl
}

async function materializePackImages(
  pack: LessonPack,
  userId: string,
): Promise<LessonPack> {
  const words: WordDef[] = []
  for (const word of pack.words) {
    const image = await uploadWordImage(userId, pack.id, word)
    words.push({ ...word, image })
  }
  return { ...pack, words }
}

function rowToPack(row: CloudPackRow): LessonPack {
  const doc = row.document
  return {
    id: row.id,
    titleZh: row.title_zh || doc.titleZh,
    titleEn: row.title_en || doc.titleEn || doc.titleZh,
    blurb: row.blurb || doc.blurb || '',
    words: (doc.words ?? []).map((w, i) => ({
      id: w.id || `w-${i}`,
      english: w.english,
      chinese: w.chinese,
      pos: parsePos(w.pos),
      article: w.article === 'an' ? 'an' : 'a',
      image: w.image || '',
    })),
    source: 'custom',
    updatedAt: row.updated_at,
    cloudSynced: true,
  }
}

export async function ensureCloudSession(): Promise<{ userId: string } | null> {
  if (!isSupabaseConfigured()) return null
  const sb = getSupabase()
  if (!sb) return null
  const { data: existing } = await sb.auth.getSession()
  if (existing.session?.user) {
    return { userId: existing.session.user.id }
  }
  const { data, error } = await sb.auth.signInAnonymously()
  if (error) throw cloudError(error, '匿名登录失败')
  if (!data.user) throw new Error('匿名登录失败')
  return { userId: data.user.id }
}

export async function getCloudSessionUserId(): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session?.user.id ?? null
}

export async function signOutCloud(): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}

export async function listCloudPacks(): Promise<LessonPack[]> {
  const session = await ensureCloudSession()
  if (!session) return []
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('lesson_packs')
    .select('*')
    .eq('owner_id', session.userId)
    .order('updated_at', { ascending: false })
  if (error) throw cloudError(error, '读取云端词包失败')
  return ((data ?? []) as CloudPackRow[]).map(rowToPack)
}

export async function upsertCloudPack(pack: LessonPack): Promise<LessonPack> {
  const session = await ensureCloudSession()
  if (!session) throw new Error('云端未配置或登录失败')
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase 未配置')

  const materialized = await materializePackImages(pack, session.userId)
  const document = toContentPackFile(materialized)
  const now = new Date().toISOString()
  const row = {
    id: materialized.id,
    owner_id: session.userId,
    title_zh: materialized.titleZh,
    title_en: materialized.titleEn,
    blurb: materialized.blurb,
    document,
    updated_at: now,
  }
  const { data, error } = await sb
    .from('lesson_packs')
    .upsert(row, { onConflict: 'owner_id,id' })
    .select('*')
    .single()
  if (error) throw cloudError(error, '上传词包失败')
  return rowToPack(data as CloudPackRow)
}

export async function deleteCloudPack(id: string): Promise<void> {
  const session = await ensureCloudSession()
  if (!session) return
  const sb = getSupabase()
  if (!sb) return
  const { error } = await sb
    .from('lesson_packs')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.userId)
  if (error) throw cloudError(error, '删除云端词包失败')
}

/** Pull cloud packs into the returned list shape (caller persists locally). */
export async function pullCloudPacks(): Promise<LessonPack[]> {
  return listCloudPacks()
}
