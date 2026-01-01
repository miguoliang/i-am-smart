-- Fix search_path for public.give_cards_to_new_user
CREATE OR REPLACE FUNCTION "public"."give_cards_to_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
  default_card_type_code VARCHAR(20);
BEGIN
  -- 新增这 1 行：如果是 operator，直接啥也不干
  IF (new.raw_user_meta_data->>'role') = 'operator' THEN
    RETURN new;
  END IF;

  -- 下面是原来的发卡逻辑（保持不变）
  INSERT INTO public.accounts (id, username)
  VALUES (new.id, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;

  -- Get the first available card type code
  SELECT code INTO default_card_type_code FROM public.card_types ORDER BY code LIMIT 1;
  
  -- Only create cards if a card type exists
  IF default_card_type_code IS NOT NULL THEN
    INSERT INTO public.account_cards (
      account_id, knowledge_code, card_type_code,
      ease_factor, interval_days, repetitions, next_review_date
    )
    SELECT 
      new.id,
      k.code,
      default_card_type_code,
      2.50, 0, 0,
      NOW()
    FROM public.knowledge k
    ON CONFLICT (account_id, knowledge_code, card_type_code) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
