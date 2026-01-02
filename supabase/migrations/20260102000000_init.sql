-- Consolidated Migration: Init
-- Date: 2026-01-02

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Sequences (Moved to top)
CREATE SEQUENCE IF NOT EXISTS "public"."global_code_seq";
ALTER SEQUENCE "public"."global_code_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."account_cards_id_seq";
ALTER SEQUENCE "public"."account_cards_id_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."review_history_id_seq";
ALTER SEQUENCE "public"."review_history_id_seq" OWNER TO "postgres";

-- Functions
CREATE OR REPLACE FUNCTION "public"."generate_global_st_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $$
begin
  -- Fixed: Use fully qualified sequence name
  new.code := 'ST-' || lpad(nextval('public.global_code_seq')::text, 7, '0');
  return new;
end;
$$;
ALTER FUNCTION "public"."generate_global_st_code"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."give_cards_to_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $$
begin
  if (new.raw_app_meta_data->>'role') = 'operator' then
    return new;
  end if;

  insert into public.accounts (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.account_cards (
    account_id, knowledge_code, card_type_code,
    ease_factor, interval_days, repetitions, next_review_date
  )
  select 
    new.id,
    k.code,
    'basic-front-back',
    2.50, 0, 0,
    now()
  from public.knowledge k
  on conflict (account_id, knowledge_code, card_type_code) do nothing;

  return new;
end;
$$;
ALTER FUNCTION "public"."give_cards_to_new_user"() OWNER TO "postgres";

-- Tables

-- Accounts
CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "username" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("username")
);
ALTER TABLE "public"."accounts" OWNER TO "postgres";
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

-- Card Types
CREATE TABLE IF NOT EXISTS "public"."card_types" (
    "code" character varying(20) NOT NULL,
    "name" character varying NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("code"),
    UNIQUE ("name")
);
ALTER TABLE "public"."card_types" OWNER TO "postgres";
ALTER TABLE "public"."card_types" ENABLE ROW LEVEL SECURITY;

-- Knowledge
CREATE TABLE IF NOT EXISTS "public"."knowledge" (
    "code" character varying(20) NOT NULL,
    "name" character varying NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("code"),
    UNIQUE ("name")
);
ALTER TABLE "public"."knowledge" OWNER TO "postgres";
ALTER TABLE "public"."knowledge" ENABLE ROW LEVEL SECURITY;

-- Account Cards
CREATE TABLE IF NOT EXISTS "public"."account_cards" (
    "id" bigint NOT NULL DEFAULT nextval('public.account_cards_id_seq'::regclass),
    "account_id" "uuid" NOT NULL REFERENCES "public"."accounts"("id") ON DELETE CASCADE,
    "knowledge_code" character varying(20) NOT NULL REFERENCES "public"."knowledge"("code") ON DELETE CASCADE,
    "card_type_code" character varying(20) NOT NULL REFERENCES "public"."card_types"("code") ON DELETE CASCADE,
    "ease_factor" numeric(5,2) DEFAULT 2.50 NOT NULL,
    "interval_days" integer DEFAULT 0 NOT NULL,
    "repetitions" integer DEFAULT 0 NOT NULL,
    "next_review_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("account_id", "knowledge_code", "card_type_code")
);
ALTER TABLE "public"."account_cards" OWNER TO "postgres";
ALTER TABLE "public"."account_cards" ENABLE ROW LEVEL SECURITY;

-- Review History
CREATE TABLE IF NOT EXISTS "public"."review_history" (
    "id" bigint NOT NULL DEFAULT nextval('public.review_history_id_seq'::regclass),
    "account_card_id" bigint NOT NULL REFERENCES "public"."account_cards"("id") ON DELETE CASCADE,
    "quality" integer NOT NULL CHECK (quality >= 0 AND quality <= 5),
    "reviewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("id")
);
ALTER TABLE "public"."review_history" OWNER TO "postgres";
ALTER TABLE "public"."review_history" ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX "idx_account_cards_account" ON "public"."account_cards" ("account_id");
CREATE INDEX "idx_account_cards_next_review" ON "public"."account_cards" ("account_id", "next_review_date");
CREATE INDEX "idx_review_history_card_id" ON "public"."review_history" ("account_card_id");
CREATE INDEX "idx_knowledge_metadata" ON "public"."knowledge" USING gin ("metadata");

-- Triggers
CREATE TRIGGER "trigger_global_st_code" BEFORE INSERT ON "public"."knowledge" FOR EACH ROW EXECUTE FUNCTION "public"."generate_global_st_code"();
CREATE TRIGGER "give_cards_after_signup" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."give_cards_to_new_user"();

-- RLS Policies

-- Accounts
CREATE POLICY "Users can manage their own account" ON public.accounts FOR ALL USING ((select auth.uid()) = id);

-- Card Types
CREATE POLICY "Public read access" ON public.card_types FOR SELECT USING (true);

-- Knowledge
CREATE POLICY "Enable read access for all users" ON public.knowledge FOR SELECT USING (true);
CREATE POLICY "Enable insert for operators" ON public.knowledge FOR INSERT WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator');
CREATE POLICY "Enable update for operators" ON public.knowledge FOR UPDATE USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator');
CREATE POLICY "Enable delete for operators" ON public.knowledge FOR DELETE USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator');

-- Account Cards
CREATE POLICY "Users can view their own cards" ON public.account_cards FOR SELECT USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can insert their own cards" ON public.account_cards FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can update their own cards" ON public.account_cards FOR UPDATE USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can delete their own cards" ON public.account_cards FOR DELETE USING ((select auth.uid()) = account_id);

-- Review History
CREATE POLICY "Users can view own review history" ON public.review_history FOR SELECT USING (account_card_id IN (SELECT id FROM public.account_cards WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own review history" ON public.review_history FOR INSERT WITH CHECK (account_card_id IN (SELECT id FROM public.account_cards WHERE account_id = (select auth.uid())));

-- RPC Functions

CREATE OR REPLACE FUNCTION "public"."review_card"(
  p_card_id bigint,
  p_user_id uuid,
  p_quality integer,
  p_ease_factor numeric,
  p_interval_days integer,
  p_repetitions integer,
  p_next_review_date timestamp with time zone
) RETURNS void
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $$
declare
  v_rows_affected int;
begin
  update public.account_cards
  set
    ease_factor = p_ease_factor,
    interval_days = p_interval_days,
    repetitions = p_repetitions,
    next_review_date = p_next_review_date,
    last_reviewed_at = now(),
    updated_at = now()
  where id = p_card_id and account_id = p_user_id;

  get diagnostics v_rows_affected = row_count;

  if v_rows_affected = 0 then
    raise exception 'Card not found or access denied';
  end if;

  insert into public.review_history (account_card_id, quality, reviewed_at)
  values (p_card_id, p_quality, now());
end;
$$;
ALTER FUNCTION "public"."review_card"(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."review_card"(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."review_card"(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."get_due_cards"(p_user_id uuid, p_limit int)
RETURNS SETOF "public"."account_cards"
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM account_cards
  WHERE account_id = p_user_id
  AND next_review_date <= now()
  ORDER BY random()
  LIMIT p_limit;
$$;
ALTER FUNCTION "public"."get_due_cards"(uuid, int) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_due_cards"(uuid, int) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_due_cards"(uuid, int) TO "service_role";

-- Permissions
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "postgres";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "anon";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "authenticated";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "service_role";

GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "postgres";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "anon";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "authenticated";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "service_role";

GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "postgres";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "anon";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "authenticated";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "service_role";