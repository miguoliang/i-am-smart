-- Add exam_target column to learner_profiles table
-- Maps to exam constants defined in shared/constants/exams.ts
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS exam_target TEXT;

-- Backfill existing profiles: map current level to closest exam target
-- A1/A2 -> ket, B1/B2 -> pet, C1/C2 -> ielts
UPDATE learner_profiles SET exam_target = CASE
  WHEN level IN ('A1', 'A2') THEN 'ket'
  WHEN level IN ('B1', 'B2') THEN 'pet'
  WHEN level IN ('C1', 'C2') THEN 'ielts'
  ELSE 'ket'
END
WHERE exam_target IS NULL;
