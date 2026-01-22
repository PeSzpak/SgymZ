-- ============================================
-- SGYMZ - SETUP COMPLETO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/crbprxzyvfqfafsdoqnv/sql/new
-- ============================================

-- ============================================
-- PASSO 1: LIMPEZA (RESET)
-- ============================================

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE IF EXISTS exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS change_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Remover triggers
DROP TRIGGER IF EXISTS set_first_admin_trigger ON users;
DROP TRIGGER IF EXISTS auto_approve_first_admin_trigger ON users;

-- Remover funções
DROP FUNCTION IF EXISTS set_first_admin();
DROP FUNCTION IF EXISTS auto_approve_first_admin();

-- Remover tabelas
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

-- Remover tipos
DROP TYPE IF EXISTS change_request_status CASCADE;
DROP TYPE IF EXISTS set_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS theme_preference CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- ============================================
-- PASSO 2: CRIAR ESTRUTURA (SCHEMA)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE theme_preference AS ENUM ('batman', 'hellokitty');
CREATE TYPE notification_type AS ENUM ('new_user', 'program_assigned', 'program_updated', 'change_request');
CREATE TYPE set_type AS ENUM ('warmup', 'prep', 'working');
CREATE TYPE change_request_status AS ENUM ('pending', 'resolved');

-- TABELAS
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'approved',
    theme_preference theme_preference DEFAULT 'batman',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE workout_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE user_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, program_id, is_active)
);

CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- ÍNDICES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
CREATE INDEX idx_workout_programs_created_by ON workout_programs(created_by);
CREATE INDEX idx_workouts_program_id ON workouts(program_id);
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX idx_user_programs_program_id ON user_programs(program_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_workout_id ON workout_logs(workout_id);
CREATE INDEX idx_exercise_logs_workout_log_id ON exercise_logs(workout_log_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_change_requests_user_id ON change_requests(user_id);

-- TRIGGERS E FUNÇÕES
CREATE OR REPLACE FUNCTION auto_approve_first_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE is_admin = TRUE) THEN
        NEW.is_admin := TRUE;
        NEW.status := 'approved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_first_admin_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION auto_approve_first_admin();

-- ============================================
-- PASSO 3: POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- HABILITAR RLS
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

-- POLÍTICAS: USERS
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os usuários"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins podem atualizar qualquer usuário"
ON users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Qualquer um pode inserir um novo usuário"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- POLÍTICAS: EXERCISES
CREATE POLICY "Todos podem ver exercícios"
ON exercises FOR SELECT
USING (TRUE);

CREATE POLICY "Admins podem gerenciar exercícios"
ON exercises FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

-- POLÍTICAS: WORKOUT_PROGRAMS
CREATE POLICY "Todos podem ver programas de treino"
ON workout_programs FOR SELECT
USING (TRUE);

CREATE POLICY "Admins podem gerenciar programas"
ON workout_programs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

-- POLÍTICAS: WORKOUTS
CREATE POLICY "Todos podem ver treinos"
ON workouts FOR SELECT
USING (TRUE);

CREATE POLICY "Admins podem gerenciar treinos"
ON workouts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

-- POLÍTICAS: WORKOUT_EXERCISES
CREATE POLICY "Todos podem ver exercícios do treino"
ON workout_exercises FOR SELECT
USING (TRUE);

CREATE POLICY "Admins podem gerenciar exercícios do treino"
ON workout_exercises FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

-- POLÍTICAS: USER_PROGRAMS
CREATE POLICY "Usuários podem ver seus próprios programas"
ON user_programs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os programas"
ON user_programs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Admins podem gerenciar atribuições de programas"
ON user_programs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

-- POLÍTICAS: WORKOUT_LOGS
CREATE POLICY "Usuários podem ver seus próprios logs"
ON workout_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os logs"
ON workout_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Usuários podem criar seus próprios logs"
ON workout_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios logs"
ON workout_logs FOR UPDATE
USING (auth.uid() = user_id);

-- POLÍTICAS: EXERCISE_LOGS
CREATE POLICY "Usuários podem ver logs de exercícios de seus treinos"
ON exercise_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM workout_logs
        WHERE workout_logs.id = exercise_logs.workout_log_id
        AND workout_logs.user_id = auth.uid()
    )
);

CREATE POLICY "Admins podem ver todos os logs de exercícios"
ON exercise_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Usuários podem criar logs de exercícios em seus treinos"
ON exercise_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM workout_logs
        WHERE workout_logs.id = exercise_logs.workout_log_id
        AND workout_logs.user_id = auth.uid()
    )
);

CREATE POLICY "Usuários podem atualizar logs de exercícios em seus treinos"
ON exercise_logs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM workout_logs
        WHERE workout_logs.id = exercise_logs.workout_log_id
        AND workout_logs.user_id = auth.uid()
    )
);

-- POLÍTICAS: NOTIFICATIONS
CREATE POLICY "Usuários podem ver suas próprias notificações"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem criar notificações para qualquer usuário"
ON notifications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Usuários podem marcar suas notificações como lidas"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- POLÍTICAS: CHANGE_REQUESTS
CREATE POLICY "Usuários podem ver suas próprias solicitações"
ON change_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as solicitações"
ON change_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

CREATE POLICY "Usuários podem criar suas próprias solicitações"
ON change_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem atualizar qualquer solicitação"
ON change_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = TRUE
    )
);

-- ============================================
-- FINALIZADO!
-- ============================================
-- Agora você pode:
-- 1. Registrar um novo admin em: http://localhost:3000/admin/register
-- 2. O primeiro admin é aprovado automaticamente
-- 3. Começar a usar o sistema!
-- ============================================
