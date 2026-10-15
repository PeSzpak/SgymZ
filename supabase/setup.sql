-- ============================================================
-- SGYMZ - SETUP ÚNICO (substitui 01/02/03, SETUP_COMPLETO, SETUP_FINAL e FIX_POLICIES)
--
-- Cole TODO este arquivo no SQL Editor do Supabase e execute.
-- ATENÇÃO: recria as tabelas do app (apaga treinos/histórico existentes).
-- Contas de login (auth.users) são preservadas e recebem perfil de novo.
-- ============================================================

-- 1. LIMPEZA ---------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_first_admin() CASCADE;

DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.change_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_programs CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.workout_programs CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.theme_preference CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.set_type CASCADE;
DROP TYPE IF EXISTS public.change_request_status CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.can_access_program(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_program(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.workout_program(uuid) CASCADE;

-- 2. TIPOS -----------------------------------------------------
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.theme_preference AS ENUM ('batman', 'hellokitty');
CREATE TYPE public.set_type AS ENUM ('warmup', 'prep', 'working');
CREATE TYPE public.change_request_status AS ENUM ('pending', 'resolved');

-- 3. TABELAS ---------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  status public.user_status NOT NULL DEFAULT 'approved',
  theme_preference public.theme_preference NOT NULL DEFAULT 'hellokitty',
  weekly_goal INTEGER NOT NULL DEFAULT 4 CHECK (weekly_goal BETWEEN 1 AND 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  warmup_sets INTEGER NOT NULL DEFAULT 0 CHECK (warmup_sets >= 0),
  prep_sets INTEGER NOT NULL DEFAULT 0 CHECK (prep_sets >= 0),
  working_sets INTEGER NOT NULL DEFAULT 3 CHECK (working_sets >= 1),
  reps TEXT NOT NULL DEFAULT '10-12',
  rest_seconds INTEGER NOT NULL DEFAULT 90 CHECK (rest_seconds >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, program_id)
);

CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.workout_programs(id) ON DELETE SET NULL,
  workout_name TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  workout_exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  set_type public.set_type NOT NULL DEFAULT 'working',
  set_number INTEGER NOT NULL,
  weight NUMERIC(6,2) NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status public.change_request_status NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX ON public.workouts (program_id, order_index);
CREATE INDEX ON public.workout_exercises (workout_id, order_index);
CREATE INDEX ON public.user_programs (user_id);
CREATE INDEX ON public.workout_logs (user_id, completed_at DESC);
CREATE INDEX ON public.exercise_logs (workout_log_id);
CREATE INDEX ON public.exercise_logs (exercise_id);
CREATE INDEX ON public.change_requests (status, created_at DESC);

-- 4. FUNÇÕES AUXILIARES (SECURITY DEFINER evita recursão de RLS) --
CREATE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin);
$$;

CREATE FUNCTION public.can_edit_program(pid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin()
      OR EXISTS (SELECT 1 FROM public.workout_programs WHERE id = pid AND created_by = auth.uid());
$$;

CREATE FUNCTION public.can_access_program(pid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_edit_program(pid)
      OR EXISTS (SELECT 1 FROM public.user_programs WHERE program_id = pid AND user_id = auth.uid());
$$;

CREATE FUNCTION public.workout_program(wid UUID) RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT program_id FROM public.workouts WHERE id = wid;
$$;

-- 5. TRIGGERS --------------------------------------------------

-- Cria o perfil quando alguém se cadastra. O primeiro cadastro vira admin.
CREATE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  first_admin BOOLEAN := NOT EXISTS (SELECT 1 FROM public.users WHERE is_admin);
  wanted_theme TEXT := NEW.raw_user_meta_data->>'theme_preference';
BEGIN
  INSERT INTO public.users (id, email, full_name, is_admin, status, theme_preference)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    first_admin,
    'approved',
    CASE WHEN wanted_theme IN ('batman', 'hellokitty') THEN wanted_theme::public.theme_preference
         WHEN first_admin THEN 'batman'
         ELSE 'hellokitty' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Usuário comum não consegue se promover a admin nem mudar o próprio status.
CREATE FUNCTION public.protect_user_columns() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.status := OLD.status;
  END IF;
  NEW.email := OLD.email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_user_columns
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_columns();

-- Quem cria um programa (e não é admin) já recebe ele na própria lista.
CREATE FUNCTION public.assign_program_to_creator() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.created_by AND is_admin) THEN
    INSERT INTO public.user_programs (user_id, program_id, assigned_by)
    VALUES (NEW.created_by, NEW.id, NEW.created_by)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_program_to_creator
AFTER INSERT ON public.workout_programs
FOR EACH ROW EXECUTE FUNCTION public.assign_program_to_creator();

CREATE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_exercises BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_programs BEFORE UPDATE ON public.workout_programs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_workouts BEFORE UPDATE ON public.workouts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. RLS -------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY users_update ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY users_delete ON public.users FOR DELETE TO authenticated
  USING (public.is_admin() AND id <> auth.uid());

-- exercises: todos leem; qualquer um cria os seus; edita quem criou ou admin
CREATE POLICY exercises_select ON public.exercises FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY exercises_insert ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (NOT is_default OR public.is_admin()));
CREATE POLICY exercises_update ON public.exercises FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());
CREATE POLICY exercises_delete ON public.exercises FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- workout_programs
-- created_by direto: o INSERT ... RETURNING ainda não "enxerga" a linha nova via função
CREATE POLICY programs_select ON public.workout_programs FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.can_access_program(id));
CREATE POLICY programs_insert ON public.workout_programs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY programs_update ON public.workout_programs FOR UPDATE TO authenticated
  USING (public.can_edit_program(id));
CREATE POLICY programs_delete ON public.workout_programs FOR DELETE TO authenticated
  USING (public.can_edit_program(id));

-- workouts
CREATE POLICY workouts_select ON public.workouts FOR SELECT TO authenticated
  USING (public.can_access_program(program_id));
CREATE POLICY workouts_write ON public.workouts FOR ALL TO authenticated
  USING (public.can_edit_program(program_id))
  WITH CHECK (public.can_edit_program(program_id));

-- workout_exercises
CREATE POLICY workout_ex_select ON public.workout_exercises FOR SELECT TO authenticated
  USING (public.can_access_program(public.workout_program(workout_id)));
CREATE POLICY workout_ex_write ON public.workout_exercises FOR ALL TO authenticated
  USING (public.can_edit_program(public.workout_program(workout_id)))
  WITH CHECK (public.can_edit_program(public.workout_program(workout_id)));

-- user_programs: admin atribui; aluna vê/ativa os dela
CREATE POLICY user_programs_select ON public.user_programs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY user_programs_insert ON public.user_programs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (user_id = auth.uid() AND public.can_edit_program(program_id)));
CREATE POLICY user_programs_update ON public.user_programs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY user_programs_delete ON public.user_programs FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- workout_logs: dona escreve; admin pode acompanhar
CREATE POLICY workout_logs_select ON public.workout_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY workout_logs_write ON public.workout_logs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- exercise_logs
CREATE POLICY exercise_logs_select ON public.exercise_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_logs l
                 WHERE l.id = workout_log_id AND (l.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY exercise_logs_write ON public.exercise_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_logs l WHERE l.id = workout_log_id AND l.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_logs l WHERE l.id = workout_log_id AND l.user_id = auth.uid()));

-- change_requests: aluna pede; admin responde
CREATE POLICY change_requests_select ON public.change_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY change_requests_insert ON public.change_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY change_requests_update ON public.change_requests FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY change_requests_delete ON public.change_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 7. BACKFILL: contas que já existiam ganham perfil ------------
INSERT INTO public.users (id, email, full_name, is_admin, status, theme_preference)
SELECT u.id,
       u.email,
       COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       ROW_NUMBER() OVER (ORDER BY u.created_at) = 1,
       'approved',
       CASE WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN 'batman'::public.theme_preference
            ELSE 'hellokitty'::public.theme_preference END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 8. BIBLIOTECA DE EXERCÍCIOS PADRÃO ---------------------------
INSERT INTO public.exercises (name, muscle_group, equipment, is_default, created_by) VALUES
  ('Agachamento livre', 'Quadríceps', 'Barra', TRUE, NULL),
  ('Agachamento sumô', 'Glúteos', 'Halter', TRUE, NULL),
  ('Agachamento búlgaro', 'Glúteos', 'Halter', TRUE, NULL),
  ('Agachamento no Smith', 'Quadríceps', 'Smith', TRUE, NULL),
  ('Leg press 45°', 'Quadríceps', 'Máquina', TRUE, NULL),
  ('Hack squat', 'Quadríceps', 'Máquina', TRUE, NULL),
  ('Cadeira extensora', 'Quadríceps', 'Máquina', TRUE, NULL),
  ('Afundo', 'Glúteos', 'Halter', TRUE, NULL),
  ('Passada andando', 'Glúteos', 'Halter', TRUE, NULL),
  ('Elevação pélvica', 'Glúteos', 'Barra', TRUE, NULL),
  ('Glúteo na polia (coice)', 'Glúteos', 'Polia', TRUE, NULL),
  ('Glúteo 4 apoios', 'Glúteos', 'Caneleira', TRUE, NULL),
  ('Cadeira abdutora', 'Glúteos', 'Máquina', TRUE, NULL),
  ('Abdução na polia', 'Glúteos', 'Polia', TRUE, NULL),
  ('Cadeira adutora', 'Adutores', 'Máquina', TRUE, NULL),
  ('Stiff', 'Posterior', 'Barra', TRUE, NULL),
  ('Levantamento terra romeno', 'Posterior', 'Halter', TRUE, NULL),
  ('Mesa flexora', 'Posterior', 'Máquina', TRUE, NULL),
  ('Cadeira flexora', 'Posterior', 'Máquina', TRUE, NULL),
  ('Panturrilha em pé', 'Panturrilha', 'Máquina', TRUE, NULL),
  ('Panturrilha sentada', 'Panturrilha', 'Máquina', TRUE, NULL),
  ('Supino reto', 'Peito', 'Barra', TRUE, NULL),
  ('Supino inclinado com halteres', 'Peito', 'Halter', TRUE, NULL),
  ('Crucifixo', 'Peito', 'Halter', TRUE, NULL),
  ('Crossover', 'Peito', 'Polia', TRUE, NULL),
  ('Flexão de braço', 'Peito', 'Peso corporal', TRUE, NULL),
  ('Puxada frontal', 'Costas', 'Polia', TRUE, NULL),
  ('Remada baixa', 'Costas', 'Polia', TRUE, NULL),
  ('Remada curvada', 'Costas', 'Barra', TRUE, NULL),
  ('Remada unilateral', 'Costas', 'Halter', TRUE, NULL),
  ('Pulldown', 'Costas', 'Polia', TRUE, NULL),
  ('Barra fixa', 'Costas', 'Peso corporal', TRUE, NULL),
  ('Desenvolvimento com halteres', 'Ombros', 'Halter', TRUE, NULL),
  ('Elevação lateral', 'Ombros', 'Halter', TRUE, NULL),
  ('Elevação frontal', 'Ombros', 'Halter', TRUE, NULL),
  ('Crucifixo inverso', 'Ombros', 'Máquina', TRUE, NULL),
  ('Rosca direta', 'Bíceps', 'Barra', TRUE, NULL),
  ('Rosca alternada', 'Bíceps', 'Halter', TRUE, NULL),
  ('Rosca martelo', 'Bíceps', 'Halter', TRUE, NULL),
  ('Tríceps na polia', 'Tríceps', 'Polia', TRUE, NULL),
  ('Tríceps francês', 'Tríceps', 'Halter', TRUE, NULL),
  ('Tríceps testa', 'Tríceps', 'Barra', TRUE, NULL),
  ('Mergulho no banco', 'Tríceps', 'Peso corporal', TRUE, NULL),
  ('Abdominal supra', 'Abdômen', 'Peso corporal', TRUE, NULL),
  ('Prancha', 'Abdômen', 'Peso corporal', TRUE, NULL),
  ('Abdominal infra', 'Abdômen', 'Peso corporal', TRUE, NULL),
  ('Abdominal na polia', 'Abdômen', 'Polia', TRUE, NULL),
  ('Esteira', 'Cardio', 'Máquina', TRUE, NULL),
  ('Bicicleta ergométrica', 'Cardio', 'Máquina', TRUE, NULL),
  ('Escada (stair climber)', 'Cardio', 'Máquina', TRUE, NULL);

-- Pronto! Abra o app e faça o cadastro.
-- Lembrete: em Authentication > Providers > Email, desligue "Confirm email"
-- para entrar direto após o cadastro.
