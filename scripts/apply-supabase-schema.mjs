#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql via Supabase Management API.
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
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )
  const text = await res.text()
  if (!res.ok) {
    console.error(`Failed ${file}: ${res.status} ${text}`)
    process.exit(1)
  }
  console.log(`OK ${file}`)
}

console.log('All migrations applied.')
console.log(
  'Reminder: enable Anonymous sign-ins in Supabase Dashboard → Authentication → Providers.',
)
