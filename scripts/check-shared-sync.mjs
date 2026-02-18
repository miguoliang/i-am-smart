#!/usr/bin/env node
/**
 * Ensure `shared/` and `miniprogram/shared/` stay in sync.
 * Fails with non-zero exit code when files differ.
 */

import { readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const webSharedDir = join(rootDir, 'shared');
const miniSharedDir = join(rootDir, 'miniprogram', 'shared');

function listFilesRecursively(baseDir) {
  const entries = readdirSync(baseDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(baseDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(absolutePath));
      continue;
    }

    if (!entry.name.endsWith('.ts')) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function toRelativeSet(baseDir) {
  return new Set(
    listFilesRecursively(baseDir)
      .map((absolutePath) => relative(baseDir, absolutePath))
      .sort()
  );
}

function setDiff(leftSet, rightSet) {
  const result = [];
  for (const item of leftSet) {
    if (!rightSet.has(item)) {
      result.push(item);
    }
  }
  return result;
}

const webFiles = toRelativeSet(webSharedDir);
const miniFiles = toRelativeSet(miniSharedDir);

const missingInMini = setDiff(webFiles, miniFiles);
const missingInWeb = setDiff(miniFiles, webFiles);

const changedFiles = [];
for (const file of webFiles) {
  if (!miniFiles.has(file)) continue;

  const webContent = readFileSync(join(webSharedDir, file), 'utf8');
  const miniContent = readFileSync(join(miniSharedDir, file), 'utf8');
  if (webContent !== miniContent) {
    changedFiles.push(file);
  }
}

if (missingInMini.length > 0 || missingInWeb.length > 0 || changedFiles.length > 0) {
  console.error('❌ shared directory sync check failed.');

  if (missingInMini.length > 0) {
    console.error('\nFiles missing in miniprogram/shared:');
    for (const file of missingInMini) {
      console.error(`  - ${file}`);
    }
  }

  if (missingInWeb.length > 0) {
    console.error('\nFiles missing in shared:');
    for (const file of missingInWeb) {
      console.error(`  - ${file}`);
    }
  }

  if (changedFiles.length > 0) {
    console.error('\nFiles with different content:');
    for (const file of changedFiles) {
      console.error(`  - ${file}`);
    }
  }

  process.exit(1);
}

console.log('✅ shared/ and miniprogram/shared/ are in sync.');
