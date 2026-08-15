#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql and enable anonymous auth via Management API.
 * Needs: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = path.join(root, 'supabase', 'migrations')

const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF

if (!token || !ref) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in environment.',
  )
  process.exit(1)
}

const extraRedirects = [
  'http://localhost:5173',
  'http://localhost:5173/**',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5173/**',
]

const publicSite = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '')
if (publicSite) {
  extraRedirects.push(publicSite, `${publicSite}/**`)
}

async function management(pathname, opts = {}) {
  const res = await fetch(`https://api.supabase.com/v1${pathname}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  if (!res.ok) {
    const snippet = typeof json === 'string' ? json : JSON.stringify(json)
    throw new Error(`${opts.method ?? 'GET'} ${pathname} → ${res.status} ${snippet}`)
  }
  return json
}

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (!files.length) {
  console.error('No migration SQL files found.')
  process.exit(1)
}

for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), 'utf8')
  console.log(`Applying ${file} …`)
  await management(`/projects/${ref}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query: sql }),
  })
  console.log(`OK ${file}`)
}

console.log('Updating Auth config (anonymous + redirect URLs) …')
const auth = await management(`/projects/${ref}/config/auth`)
const existing = String(auth.uri_allow_list ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const uriAllowList = [...new Set([...existing, ...extraRedirects])].join(',')

await management(`/projects/${ref}/config/auth`, {
  method: 'PATCH',
  body: JSON.stringify({
    external_anonymous_users_enabled: true,
    uri_allow_list: uriAllowList,
  }),
})

const verify = await management(`/projects/${ref}/config/auth`)
console.log(
  'anonymous_enabled=',
  verify.external_anonymous_users_enabled,
)
console.log('All migrations applied and Anonymous sign-ins enabled.')
