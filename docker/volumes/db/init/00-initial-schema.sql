-- Create roles
CREATE ROLE anon NOINHERIT LOGIN NOSUPERUSER;
CREATE ROLE authenticated NOINHERIT LOGIN NOSUPERUSER;
CREATE ROLE service_role NOINHERIT LOGIN NOSUPERUSER BYPASSRLS;
CREATE ROLE supabase_auth_admin NOINHERIT LOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE supabase_storage_admin NOINHERIT LOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE dashboard_user NOINHERIT LOGIN NOSUPERUSER;
CREATE ROLE supabase_admin LOGIN SUPERUSER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Setup auth schema (simplified)
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, supabase_auth_admin;

-- Setup storage schema (simplified)
CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role, supabase_storage_admin;

-- Realtime publication
CREATE PUBLICATION supabase_realtime;
