-- ============================================
-- SGYMZ - Reset Completo do Banco de Dados
-- ============================================
-- Execute este script APENAS no ambiente de desenvolvimento
-- Este script deleta todas as tabelas e recria do zero

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS change_requests DISABLE ROW LEVEL SECURITY; 

-- Dropar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
DROP TRIGGER IF EXISTS update_workout_programs_updated_at ON workout_programs;
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;

-- Dropar functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Dropar tabelas
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS exercise_logs CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS user_programs CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS workout_programs CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Dropar enums
DROP TYPE IF EXISTS change_request_status CASCADE;
DROP TYPE IF EXISTS set_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS theme_preference CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados resetado com sucesso! Execute 02_schema.sql e 03_policies.sql';
END $$;
