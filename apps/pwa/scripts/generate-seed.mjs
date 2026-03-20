#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Escapes single quotes in SQL strings by doubling them
 */
function escapeSqlString(str) {
  if (str === null || str === undefined) {
    return 'null';
  }
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Converts a JSON object to a JSONB string for PostgreSQL
 */
function formatMetadata(item) {
  const metadata = {
    pos: item.pos || '',
    level: item.level || '',
    exampleSentence: item.exampleSentence || '',
    selfExaminePrompt: item.selfExaminePrompt || '',
    theme: item.theme || '',
    imageName: item.imageName || null,
  };
  
  // Convert to JSON string and escape single quotes
  const jsonStr = JSON.stringify(metadata);
  return escapeSqlString(jsonStr);
}

/**
 * Generates SQL INSERT statement for a knowledge item
 */
function generateKnowledgeInsert(item) {
  const name = escapeSqlString(item.englishWord);
  const description = escapeSqlString(item.chineseTranslation);
  const metadata = formatMetadata(item);
  
  return `INSERT INTO public.knowledge (name, description, metadata) VALUES (${name}, ${description}, ${metadata}::jsonb) ON CONFLICT (name) DO NOTHING;`;
}

/**
 * Reads and parses a JSON file
 */
function readJsonFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Generates SQL for all knowledge items from JSON files
 */
function generateKnowledgeSql() {
  const dataDir = join(rootDir, 'data');
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const sections = [];
  
  for (const level of levels) {
    const filePath = join(dataDir, `cefr-${level.toLowerCase()}.json`);
    
    try {
      const items = readJsonFile(filePath);
      
      if (!Array.isArray(items)) {
        throw new Error(`Expected array in ${filePath}`);
      }
      
      // Validate structure
      for (const item of items) {
        if (!item.englishWord || !item.chineseTranslation) {
          throw new Error(`Invalid item structure in ${filePath}: missing englishWord or chineseTranslation`);
        }
      }
      
      const inserts = items.map(item => generateKnowledgeInsert(item));
      
      sections.push({
        level,
        count: items.length,
        inserts,
      });
      
      console.log(`✓ Processed ${items.length} items from cefr-${level.toLowerCase()}.json`);
    } catch (error) {
      console.error(`✗ Error processing ${filePath}:`, error.message);
      throw error;
    }
  }
  
  return sections;
}

/**
 * Generates seed files split by section
 */
function generateSeedFiles() {
  console.log('Generating seed files from JSON files...\n');
  
  const seedsDir = join(rootDir, 'supabase', 'seeds');
  
  // Create seeds directory if it doesn't exist
  try {
    mkdirSync(seedsDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  // Clean up old non-split knowledge files (if any)
  try {
    const files = readdirSync(seedsDir);
    const oldFiles = files.filter(f => 
      f.match(/^0[2-5]-knowledge-[a-z][0-9]\.sql$/) && !f.includes('-00')
    );
    oldFiles.forEach(file => {
      unlinkSync(join(seedsDir, file));
      console.log(`  Removed old file: ${file}`);
    });
  } catch {
    // Ignore errors during cleanup
  }
  
  // Generate knowledge SQL sections
  const knowledgeSections = generateKnowledgeSql();
  
  // 1. Card Types
  const cardTypesSql = `-- Card Types
INSERT INTO public.card_types (code, name, description)
VALUES ('basic-front-back', 'Basic Front/Back', 'Standard flashcard with a front and back side.')
ON CONFLICT (code) DO NOTHING;`;
  
  writeFileSync(join(seedsDir, '01-card-types.sql'), cardTypesSql, 'utf-8');
  console.log('✓ Generated 01-card-types.sql');
  
  // 2. Knowledge files by level (split into chunks of max 250 records)
  const MAX_RECORDS_PER_FILE = 250;
  // B2, C1, C2 share prefix 05 so lexicographic order stays: … b2 → c1 → c2 → 06-users
  const levelOrder = {
    A1: '02',
    A2: '03',
    B1: '04',
    B2: '05',
    C1: '05',
    C2: '05',
  };
  
  for (const section of knowledgeSections) {
    const levelNum = levelOrder[section.level];
    const inserts = section.inserts;
    const totalItems = inserts.length;
    
    // Split inserts into chunks of MAX_RECORDS_PER_FILE
    const chunks = [];
    for (let i = 0; i < inserts.length; i += MAX_RECORDS_PER_FILE) {
      chunks.push(inserts.slice(i, i + MAX_RECORDS_PER_FILE));
    }
    
    // Generate a file for each chunk
    chunks.forEach((chunk, index) => {
      const chunkNum = String(index + 1).padStart(3, '0');
      const chunkSize = chunk.length;
      const startIndex = index * MAX_RECORDS_PER_FILE + 1;
      const endIndex = startIndex + chunkSize - 1;
      
      const header = `-- Knowledge - ${section.level} Level (items ${startIndex}-${endIndex} of ${totalItems})`;
      const sql = [header, ''].concat(chunk).join('\n');
      
      const filename = `${levelNum}-knowledge-${section.level.toLowerCase()}-${chunkNum}.sql`;
      writeFileSync(join(seedsDir, filename), sql, 'utf-8');
      console.log(`✓ Generated ${filename} (${chunkSize} items)`);
    });
  }
  
  // 3. Users
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
  
  // 4. Accounts
  const accountsSql = `-- Accounts
INSERT INTO public.accounts (id, username)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'boymgl'
) ON CONFLICT (id) DO NOTHING;`;
  
  writeFileSync(join(seedsDir, '07-accounts.sql'), accountsSql, 'utf-8');
  console.log('✓ Generated 07-accounts.sql');
  
  // Also generate a combined seed.sql for backward compatibility
  const combinedLines = [
    '-- Seed data (generated from seeds/*.sql files)',
    '-- This file is maintained for backward compatibility.',
    '-- For better organization, use the individual files in seeds/ directory.',
    '',
    cardTypesSql,
    '',
    '-- Knowledge',
  ];
  
  for (const section of knowledgeSections) {
    combinedLines.push('');
    combinedLines.push(`-- Knowledge - ${section.level} Level (${section.count} items)`);
    combinedLines.push(...section.inserts);
  }
  
  combinedLines.push('');
  combinedLines.push(usersSql);
  combinedLines.push('');
  combinedLines.push(accountsSql);
  combinedLines.push('');
  
  const combinedSql = combinedLines.join('\n');
  writeFileSync(join(rootDir, 'supabase', 'seed.sql'), combinedSql, 'utf-8');
  console.log('✓ Generated seed.sql (combined file)');
  
  return knowledgeSections.reduce((sum, s) => sum + s.count, 0);
}

/**
 * Main execution
 */
function main() {
  try {
    const totalItems = generateSeedFiles();
    
    console.log(`\n✓ Successfully generated all seed files`);
    console.log(`✓ Total knowledge items: ${totalItems}`);
    console.log(`\nNote: Update supabase/config.toml to use:`);
    console.log(`  sql_paths = ["./seeds/*.sql"]`);
  } catch (error) {
    console.error('\n✗ Error generating seed files:', error.message);
    process.exit(1);
  }
}

main();
