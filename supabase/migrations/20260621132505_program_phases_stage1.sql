ALTER TABLE program_days
  ADD COLUMN queue_order integer,
  ADD COLUMN is_variant boolean NOT NULL DEFAULT false,
  ADD COLUMN variant_group_key text;

CREATE TABLE program_week_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_program_id uuid NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN
    ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  variant_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_program_id, week_start_date, day_of_week)
);
ALTER TABLE program_week_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MVP open — tighten in v1.1" ON program_week_overrides
  FOR ALL USING (true);

ALTER TABLE mobility_exercises
  ADD COLUMN exercise_id uuid REFERENCES exercises(id);

ALTER TABLE user_programs
  ADD COLUMN deload_committed_date date;;
