#!/usr/bin/env node
/**
 * End-to-end check: anonymous auth → upsert pack → storage → list → delete.
 * Needs: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Run from repo root after `cd web && npm ci`.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web')
const require = createRequire(path.join(webRoot, 'package.json'))
const { createClient } = require('@supabase/supabase-js')

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const packId = `verify-${Date.now().toString(36)}`
let userId = ''

try {
  const { data: sign, error: signErr } = await sb.auth.signInAnonymously()
  if (signErr) throw signErr
  userId = sign.user?.id ?? ''
  assert(userId, 'anonymous user id missing')
  assert(sign.user?.is_anonymous === true, 'user is not anonymous')
  console.log('auth: anonymous ok')

  const imagePath = `${userId}/${packId}/probe.png`
  const { error: upErr } = await sb.storage.from('pack-images').upload(imagePath, PIXEL_PNG, {
    contentType: 'image/png',
    upsert: true,
  })
  if (upErr) throw upErr
  const publicUrl = sb.storage.from('pack-images').getPublicUrl(imagePath).data.publicUrl
  const imgRes = await fetch(publicUrl)
  assert(imgRes.ok, `public image fetch ${imgRes.status}`)
  console.log('storage: upload + public read ok')

  const document = {
    schema: 'peilian-pack/v1',
    id: packId,
    titleZh: '校验词包',
    titleEn: 'verify',
    blurb: 'agent e2e',
    words: [
      {
        id: 'probe',
        english: 'probe',
        chinese: '探测',
        article: 'a',
        image: publicUrl,
      },
    ],
  }
  const { data: row, error: upsertErr } = await sb
    .from('lesson_packs')
    .upsert(
      {
        owner_id: userId,
        id: packId,
        title_zh: document.titleZh,
        title_en: document.titleEn,
        blurb: document.blurb,
        document,
      },
      { onConflict: 'owner_id,id' },
    )
    .select('*')
    .single()
  if (upsertErr) throw upsertErr
  assert(row?.id === packId, 'upsert did not return pack')
  console.log('table: upsert ok')

  const { data: listed, error: listErr } = await sb
    .from('lesson_packs')
    .select('id, owner_id, title_zh')
    .eq('id', packId)
  if (listErr) throw listErr
  assert(listed?.length === 1, `expected 1 row, got ${listed?.length}`)
  console.log('table: select own row ok')

  const { data: others, error: othersErr } = await sb
    .from('lesson_packs')
    .select('id')
    .neq('owner_id', userId)
  if (othersErr) throw othersErr
  assert((others ?? []).length === 0, 'RLS leaked other owners')
  console.log('rls: cannot see other owners ok')

  const logs = await sb.from('operator_logs').select('id').limit(5)
  assert((logs.data ?? []).length === 0, 'operator_logs leaked to anonymous')
  console.log('rls: operator_logs hidden ok')

  const other = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signB, error: signBErr } = await other.auth.signInAnonymously()
  if (signBErr) throw signBErr
  const userB = signB.user?.id ?? ''
  assert(userB && userB !== userId, 'second anonymous user missing')
  const { error: collideErr } = await other.from('lesson_packs').upsert(
    {
      owner_id: userB,
      id: packId,
      title_zh: '另一家长',
      title_en: 'other',
      blurb: 'other',
      document: { ...document, titleZh: '另一家长' },
    },
    { onConflict: 'owner_id,id' },
  )
  if (collideErr) throw collideErr
  const { data: onlyMine } = await sb.from('lesson_packs').select('title_zh').eq('id', packId)
  assert(onlyMine?.length === 1 && onlyMine[0].title_zh === '校验词包', 'same pack id collided')
  await other.from('lesson_packs').delete().eq('id', packId).eq('owner_id', userB)
  await other.auth.signOut()
  console.log('rls: same pack id per owner ok')

  const { error: delErr } = await sb
    .from('lesson_packs')
    .delete()
    .eq('id', packId)
    .eq('owner_id', userId)
  if (delErr) throw delErr
  await sb.storage.from('pack-images').remove([imagePath])
  console.log('cleanup ok')

  await sb.auth.signOut()
  console.log('VERIFY_OK')
} catch (err) {
  console.error('VERIFY_FAIL', err)
  if (userId) {
    await sb.from('lesson_packs').delete().eq('id', packId).eq('owner_id', userId)
    await sb.storage.from('pack-images').remove([`${userId}/${packId}/probe.png`])
  }
  process.exit(1)
}
