-- Migration: Add distribute_all_cards RPC
-- Date: 2026-01-04
-- Description: Adds an RPC function to efficiently distribute all knowledge cards to a user

CREATE OR REPLACE FUNCTION "public"."distribute_all_cards"(p_user_id uuid, p_card_type_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count int;
  v_total_knowledge int;
BEGIN
  -- Get total count of knowledge items
  SELECT count(*) INTO v_total_knowledge FROM knowledge;

  -- Insert cards for all knowledge items
  WITH inserted AS (
    INSERT INTO public.account_cards (
      account_id,
      knowledge_code,
      card_type_code,
      ease_factor,
      interval_days,
      repetitions,
      next_review_date,
      created_at,
      updated_at
    )
    SELECT
      p_user_id,
      k.code,
      p_card_type_code,
      2.50,
      0,
      0,
      now(),
      now(),
      now()
    FROM public.knowledge k
    ON CONFLICT (account_id, knowledge_code, card_type_code) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_inserted_count FROM inserted;

  RETURN json_build_object(
    'inserted', v_inserted_count,
    'skipped', v_total_knowledge - v_inserted_count
  );
END;
$$;

ALTER FUNCTION "public"."distribute_all_cards"(uuid, text) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."distribute_all_cards"(uuid, text) TO "service_role";
-- Only allow service_role (admins/operators via admin client) to call this, or authenticated operators if RLS allows.
-- Since AccountService uses adminClient, service_role is enough.
-- But if we want to allow it via standard client for operators:
GRANT ALL ON FUNCTION "public"."distribute_all_cards"(uuid, text) TO "authenticated";
