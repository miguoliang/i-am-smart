#!/usr/bin/env node
/**
 * Build the Vite app and publish it to Supabase:
 *   - hashed assets + cards → Storage bucket `site`
 *   - index.html served as text/html by Edge Function `app`
 *
 * Needs: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
 *        SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const web = path.join(root, 'web')
const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF

if (!url || !anon || !token || !ref) {
  console.error(
    'Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_ACCESS_TOKEN, or SUPABASE_PROJECT_REF',
  )
  process.exit(1)
}

const assetBase = `${url.replace(/\/$/, '')}/storage/v1/object/public/site/`

function run(cmd, args, opts = {}) {
  const { extraEnv = {}, cwd = root } = opts
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))
    })
  })
}

console.log('Building web with Storage asset base…')
await run('npm', ['run', 'build'], {
  cwd: web,
  extraEnv: {
    VITE_ASSET_BASE: assetBase,
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anon,
  },
})

console.log('Uploading dist/ to Storage bucket site/ …')
await run('npx', [
  'supabase',
  'storage',
  'cp',
  '-r',
  path.join(web, 'dist') + '/.',
          'ss:///site/',
          '--project-ref',
          ref,
          '--experimental',
          '--cache-control',
  'max-age=31536000,immutable',
])

console.log('Deploying Edge Function app …')
await run('npx', [
  'supabase',
  'functions',
  'deploy',
  'app',
  '--project-ref',
  ref,
  '--no-verify-jwt',
  '--use-api',
])

const appUrl = `${url.replace(/\/$/, '')}/functions/v1/app`
console.log(`Published: ${appUrl}`)
