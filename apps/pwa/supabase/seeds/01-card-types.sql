-- Card Types
INSERT INTO public.card_types (code, name, description)
VALUES ('basic-front-back', 'Basic Front/Back', 'Standard flashcard with a front and back side.')
ON CONFLICT (code) DO NOTHING;