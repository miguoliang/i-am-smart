#!/usr/bin/env node
/**
 * Create or update an operator account (email OTP, no password).
 *
 * Usage:
 *   node scripts/create-operator.mjs <email>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (reads from apps/pwa/.env.local if present).
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), "apps/pwa/.env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnv();

const [email] = process.argv.slice(2);
if (!email) {
  console.error("Usage: node scripts/create-operator.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);

  if (existing) {
    console.log(`User ${email} exists (${existing.id}), updating role...`);
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      app_metadata: { ...existing.app_metadata, role: "operator" },
    });
    if (error) {
      console.error("Update failed:", error.message);
      process.exit(1);
    }
    console.log(`✅ Updated: role=operator`);
  } else {
    console.log(`Creating new operator: ${email}`);
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: "operator" },
    });
    if (error) {
      console.error("Create failed:", error.message);
      process.exit(1);
    }
    console.log(`✅ Created: ${data.user.id}, role=operator`);
  }
}

main();
