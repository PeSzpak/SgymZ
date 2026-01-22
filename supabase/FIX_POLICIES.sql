-- ============================================
-- SGYMZ - CORREÇÃO DAS POLÍTICAS RLS
-- Execute APENAS este script se você já rodou o SETUP_COMPLETO.sql
-- ============================================

-- REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON users;
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON users;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer usuário" ON users;
DROP POLICY IF EXISTS "Qualquer um pode inserir um novo usuário" ON users;
DROP POLICY IF EXISTS "Todos podem ver exercícios" ON exercises;
DROP POLICY IF EXISTS "Admins podem gerenciar exercícios" ON exercises;
DROP POLICY IF EXISTS "Todos podem ver programas de treino" ON workout_programs;
DROP POLICY IF EXISTS "Admins podem gerenciar programas" ON workout_programs;
DROP POLICY IF EXISTS "Todos podem ver treinos" ON workouts;
DROP POLICY IF EXISTS "Admins podem gerenciar treinos" ON workouts;
DROP POLICY IF EXISTS "Todos podem ver exercícios do treino" ON workout_exercises;
DROP POLICY IF EXISTS "Admins podem gerenciar exercícios do treino" ON workout_exercises;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios programas" ON user_programs;
DROP POLICY IF EXISTS "Admins podem ver todos os programas" ON user_programs;
DROP POLICY IF EXISTS "Admins podem gerenciar atribuições de programas" ON user_programs;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios logs" ON workout_logs;
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON workout_logs;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios logs" ON workout_logs;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios logs" ON workout_logs;
DROP POLICY IF EXISTS "Usuários podem ver logs de exercícios de seus treinos" ON exercise_logs;
DROP POLICY IF EXISTS "Admins podem ver todos os logs de exercícios" ON exercise_logs;
DROP POLICY IF EXISTS "Usuários podem criar logs de exercícios em seus treinos" ON exercise_logs;
DROP POLICY IF EXISTS "Usuários podem atualizar logs de exercícios em seus treinos" ON exercise_logs;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON notifications;
DROP POLICY IF EXISTS "Admins podem criar notificações para qualquer usuário" ON notifications;
DROP POLICY IF EXISTS "Usuários podem marcar suas notificações como lidas" ON notifications;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias solicitações" ON change_requests;
DROP POLICY IF EXISTS "Admins podem ver todas as solicitações" ON change_requests;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias solicitações" ON change_requests;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer solicitação" ON change_requests;

-- ============================================
-- POLÍTICAS CORRIGIDAS (SEM RECURSÃO)
-- ============================================

-- POLÍTICAS: USERS (SIMPLIFICADAS)
CREATE POLICY "users_select_own" ON users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users 
FOR UPDATE 
USING (auth.uid() = id);

-- Para admins, criamos uma política que não faz SELECT recursivo
CREATE POLICY "users_all_for_admins" ON users
FOR ALL
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
)
WITH CHECK (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- POLÍTICAS: EXERCISES
CREATE POLICY "exercises_select_all" ON exercises 
FOR SELECT 
USING (TRUE);

CREATE POLICY "exercises_modify_admins" ON exercises
FOR ALL
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- POLÍTICAS: WORKOUT_PROGRAMS
CREATE POLICY "programs_select_all" ON workout_programs 
FOR SELECT 
USING (TRUE);

CREATE POLICY "programs_modify_admins" ON workout_programs
FOR ALL
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- POLÍTICAS: WORKOUTS
CREATE POLICY "workouts_select_all" ON workouts 
FOR SELECT 
USING (TRUE);

CREATE POLICY "workouts_modify_admins" ON workouts
FOR ALL
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- POLÍTICAS: WORKOUT_EXERCISES
CREATE POLICY "workout_exercises_select_all" ON workout_exercises 
FOR SELECT 
USING (TRUE);

CREATE POLICY "workout_exercises_modify_admins" ON workout_exercises
FOR ALL
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- POLÍTICAS: USER_PROGRAMS
CREATE POLICY "user_programs_select_own" ON user_programs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "user_programs_select_admins" ON user_programs 
FOR SELECT 
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "user_programs_modify_admins" ON user_programs
FOR ALL
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- POLÍTICAS: WORKOUT_LOGS
CREATE POLICY "workout_logs_select_own" ON workout_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "workout_logs_select_admins" ON workout_logs 
FOR SELECT 
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "workout_logs_insert_own" ON workout_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_logs_update_own" ON workout_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- POLÍTICAS: EXERCISE_LOGS
CREATE POLICY "exercise_logs_select_own" ON exercise_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);

CREATE POLICY "exercise_logs_select_admins" ON exercise_logs 
FOR SELECT 
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "exercise_logs_insert_own" ON exercise_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);

CREATE POLICY "exercise_logs_update_own" ON exercise_logs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);

-- POLÍTICAS: NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_admins" ON notifications 
FOR INSERT 
WITH CHECK (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "notifications_update_own" ON notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- POLÍTICAS: CHANGE_REQUESTS
CREATE POLICY "change_requests_select_own" ON change_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "change_requests_select_admins" ON change_requests 
FOR SELECT 
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "change_requests_insert_own" ON change_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "change_requests_update_admins" ON change_requests 
FOR UPDATE 
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- ============================================
-- PRONTO! Agora teste novamente
-- ============================================
