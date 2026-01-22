-- ============================================
-- SGYMZ - SETUP SIMPLES E FUNCIONAL
-- Execute TODO este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/crbprxzyvfqfafsdoqnv/sql/new
-- ============================================

-- PASSO 1: LIMPAR TUDO
-- ============================================
DROP TRIGGER IF EXISTS set_first_admin_trigger ON users CASCADE;
DROP FUNCTION IF EXISTS auto_approve_first_admin() CASCADE;
DROP TABLE IF EXISTS exercise_logs CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS user_programs CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS workout_programs CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS change_request_status CASCADE;
DROP TYPE IF EXISTS set_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS theme_preference CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- PASSO 2: CRIAR TIPOS E TABELAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE theme_preference AS ENUM ('batman', 'hellokitty');
CREATE TYPE notification_type AS ENUM ('new_user', 'program_assigned', 'program_updated', 'change_request');
CREATE TYPE set_type AS ENUM ('warmup', 'prep', 'working');
CREATE TYPE change_request_status AS ENUM ('pending', 'resolved');

-- Tabela USERS
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'approved',
    theme_preference theme_preference DEFAULT 'batman',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela EXERCISES
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela WORKOUT_PROGRAMS
CREATE TABLE workout_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela WORKOUTS
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela WORKOUT_EXERCISES
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    warmup_sets INTEGER,
    prep_sets INTEGER,
    working_sets INTEGER,
    reps TEXT NOT NULL,
    rest_time TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela USER_PROGRAMS
CREATE TABLE user_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela WORKOUT_LOGS
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela EXERCISE_LOGS
CREATE TABLE exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_type set_type NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight DECIMAL(5,2),
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela CHANGE_REQUESTS
CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
    requested_changes TEXT NOT NULL,
    status change_request_status DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- PASSO 3: FUNÇÃO E TRIGGER PARA PRIMEIRO ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION auto_approve_first_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE is_admin = TRUE) THEN
        NEW.is_admin := TRUE;
        NEW.status := 'approved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_first_admin_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION auto_approve_first_admin();

-- PASSO 4: HABILITAR RLS (Row Level Security)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- PASSO 5: POLÍTICAS SIMPLES (SEM RECURSÃO)
-- ============================================

-- USERS: Políticas básicas
CREATE POLICY "users_own_data" ON users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- EXERCISES: Todos podem ver, só admins modificam
CREATE POLICY "exercises_public_read" ON exercises
FOR SELECT
USING (TRUE);

CREATE POLICY "exercises_admin_write" ON exercises
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "exercises_admin_update" ON exercises
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "exercises_admin_delete" ON exercises
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- WORKOUT_PROGRAMS: Todos podem ver, só admins modificam
CREATE POLICY "programs_public_read" ON workout_programs
FOR SELECT
USING (TRUE);

CREATE POLICY "programs_admin_all" ON workout_programs
FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- WORKOUTS: Todos podem ver, só admins modificam
CREATE POLICY "workouts_public_read" ON workouts
FOR SELECT
USING (TRUE);

CREATE POLICY "workouts_admin_all" ON workouts
FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- WORKOUT_EXERCISES: Todos podem ver, só admins modificam
CREATE POLICY "workout_ex_public_read" ON workout_exercises
FOR SELECT
USING (TRUE);

CREATE POLICY "workout_ex_admin_all" ON workout_exercises
FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- USER_PROGRAMS: Usuários veem seus próprios, admins veem todos
CREATE POLICY "user_programs_own" ON user_programs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "user_programs_admin_all" ON user_programs
FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- WORKOUT_LOGS: Usuários seus próprios logs
CREATE POLICY "workout_logs_own" ON workout_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- EXERCISE_LOGS: Usuários seus próprios logs
CREATE POLICY "exercise_logs_own" ON exercise_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);

-- NOTIFICATIONS: Usuários veem suas próprias notificações
CREATE POLICY "notifications_own" ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "notifications_admin_create" ON notifications
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- CHANGE_REQUESTS: Usuários veem suas próprias solicitações
CREATE POLICY "change_requests_own" ON change_requests
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CONCLUÍDO! 
-- Agora registre o primeiro admin em:
-- http://localhost:3000/admin/register
-- ============================================
