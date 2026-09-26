ALTER TABLE public.data_uploads ADD COLUMN published boolean NOT NULL DEFAULT true;
GRANT SELECT ON public.data_uploads TO anon;
CREATE POLICY "Published data uploads are public" ON public.data_uploads FOR SELECT TO anon, authenticated USING (published);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL,
  question_bn text NOT NULL DEFAULT '',
  options_en text[] NOT NULL,
  options_bn text[] NOT NULL,
  correct_index int NOT NULL DEFAULT 0,
  why_en text NOT NULL DEFAULT '',
  why_bn text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published quiz is public" ON public.quiz_questions FOR SELECT TO anon, authenticated USING (published OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage quiz" ON public.quiz_questions FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();