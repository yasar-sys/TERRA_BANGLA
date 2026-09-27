CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  avatar_path text,
  school_name text NOT NULL DEFAULT '',
  class_level text NOT NULL DEFAULT '',
  home_district_id text,
  preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'bn')),
  learning_interests text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.learning_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  district_id text NOT NULL,
  variable text NOT NULL CHECK (variable IN ('ndvi', 'lst', 'temperature', 'solar', 'precipitation')),
  selected_trend text NOT NULL CHECK (selected_trend IN ('up', 'down', 'same')),
  correct boolean NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 1),
  completed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.learning_attempts TO authenticated;
GRANT ALL ON public.learning_attempts TO service_role;
ALTER TABLE public.learning_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own attempts" ON public.learning_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students add own attempts" ON public.learning_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students delete own attempts" ON public.learning_attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX learning_attempts_user_completed_idx ON public.learning_attempts (user_id, completed_at DESC);

CREATE TABLE public.favorite_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  district_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, district_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorite_districts TO authenticated;
GRANT ALL ON public.favorite_districts TO service_role;
ALTER TABLE public.favorite_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own favorites" ON public.favorite_districts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students add own favorites" ON public.favorite_districts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students remove own favorites" ON public.favorite_districts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  district_id text NOT NULL,
  variable text NOT NULL CHECK (variable IN ('ndvi', 'lst', 'temperature', 'solar', 'precipitation')),
  observation text NOT NULL,
  explanation text NOT NULL,
  period_start integer NOT NULL,
  period_end integer NOT NULL,
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.saved_insights TO authenticated;
GRANT ALL ON public.saved_insights TO service_role;
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own insights" ON public.saved_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students add own insights" ON public.saved_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students remove own insights" ON public.saved_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX saved_insights_user_created_idx ON public.saved_insights (user_id, created_at DESC);