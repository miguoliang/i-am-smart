-- Ensure trigger for card_types
CREATE OR REPLACE TRIGGER "trigger_global_st_code_card_types" BEFORE INSERT ON "public"."card_types" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."generate_global_st_code"();
