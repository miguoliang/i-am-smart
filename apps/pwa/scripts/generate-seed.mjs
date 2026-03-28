#!/usr/bin/env node

import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Regenerates supabase/seeds/*.sql (card_types, operator user, accounts).
 * `config.toml` uses sql_paths = ["./seeds/*.sql"] — root supabase/seed.sql is not loaded by CLI.
 * Knowledge bulk seed was removed; load vocabulary via operator UI, migrations, or custom import.
 */
function generateSeedFiles() {
  console.log('Generating seed files (no knowledge bulk inserts)...\n');

  const seedsDir = join(rootDir, 'supabase', 'seeds');

  try {
    mkdirSync(seedsDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }

  try {
    const files = readdirSync(seedsDir);
    for (const f of files) {
      if (f.includes('-knowledge-') && f.endsWith('.sql')) {
        unlinkSync(join(seedsDir, f));
        console.log(`  Removed: ${f}`);
      }
    }
  } catch {
    // ignore
  }

  const cardTypesSql = `-- Card Types
INSERT INTO public.card_types (code, name, description)
VALUES ('basic-front-back', 'Basic Front/Back', 'Standard flashcard with a front and back side.')
ON CONFLICT (code) DO NOTHING;`;

  writeFileSync(join(seedsDir, '01-card-types.sql'), cardTypesSql, 'utf-8');
  console.log('✓ Generated 01-card-types.sql');

  const usersSql = `-- Users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'boymgl@qq.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"], "role": "operator"}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;`;

  writeFileSync(join(seedsDir, '06-users.sql'), usersSql, 'utf-8');
  console.log('✓ Generated 06-users.sql');

  const accountsSql = `-- Accounts
INSERT INTO public.accounts (id, username)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'boymgl'
) ON CONFLICT (id) DO NOTHING;`;

  writeFileSync(join(seedsDir, '07-accounts.sql'), accountsSql, 'utf-8');
  console.log('✓ Generated 07-accounts.sql');
}

function main() {
  try {
    generateSeedFiles();
    console.log('\n✓ Successfully generated seed files');
    console.log('\nNote: sql_paths in config.toml: ["./seeds/*.sql"]');
  } catch (error) {
    console.error('\n✗ Error generating seed files:', error.message);
    process.exit(1);
  }
}

main();
