-- ============================================
-- SGYMZ - Row Level Security Policies
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

-- ============================================
-- POLICIES - USERS
-- ============================================

CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_update_admin" ON users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - EXERCISES
-- ============================================

CREATE POLICY "exercises_select_all" ON exercises
    FOR SELECT USING (TRUE);

CREATE POLICY "exercises_insert_admin" ON exercises
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "exercises_update_admin" ON exercises
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "exercises_delete_admin" ON exercises
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - WORKOUT_PROGRAMS
-- ============================================

CREATE POLICY "programs_select_own" ON workout_programs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
        OR EXISTS (
            SELECT 1 FROM user_programs 
            WHERE user_id = auth.uid() AND program_id = workout_programs.id
        )
    );

CREATE POLICY "programs_insert_admin" ON workout_programs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "programs_update_admin" ON workout_programs
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "programs_delete_admin" ON workout_programs
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - WORKOUTS
-- ============================================

CREATE POLICY "workouts_select_own" ON workouts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
        OR EXISTS (
            SELECT 1 FROM user_programs 
            WHERE user_id = auth.uid() AND program_id = workouts.program_id
        )
    );

CREATE POLICY "workouts_insert_admin" ON workouts
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "workouts_update_admin" ON workouts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "workouts_delete_admin" ON workouts
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - WORKOUT_EXERCISES
-- ============================================

CREATE POLICY "workout_exercises_select_own" ON workout_exercises
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
        OR EXISTS (
            SELECT 1 FROM workouts w
            JOIN user_programs up ON up.program_id = w.program_id
            WHERE w.id = workout_exercises.workout_id AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "workout_exercises_insert_admin" ON workout_exercises
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "workout_exercises_update_admin" ON workout_exercises
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "workout_exercises_delete_admin" ON workout_exercises
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - USER_PROGRAMS
-- ============================================

CREATE POLICY "user_programs_select_own" ON user_programs
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "user_programs_insert_admin" ON user_programs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "user_programs_update_admin" ON user_programs
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "user_programs_delete_admin" ON user_programs
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - WORKOUT_LOGS
-- ============================================

CREATE POLICY "workout_logs_select_own" ON workout_logs
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "workout_logs_insert_own" ON workout_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_logs_update_own" ON workout_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "workout_logs_delete_own" ON workout_logs
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES - EXERCISE_LOGS
-- ============================================

CREATE POLICY "exercise_logs_select_own" ON exercise_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_logs wl
            WHERE wl.id = exercise_logs.workout_log_id AND wl.user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "exercise_logs_insert_own" ON exercise_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_logs wl
            WHERE wl.id = exercise_logs.workout_log_id AND wl.user_id = auth.uid()
        )
    );

CREATE POLICY "exercise_logs_update_own" ON exercise_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workout_logs wl
            WHERE wl.id = exercise_logs.workout_log_id AND wl.user_id = auth.uid()
        )
    );

CREATE POLICY "exercise_logs_delete_own" ON exercise_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workout_logs wl
            WHERE wl.id = exercise_logs.workout_log_id AND wl.user_id = auth.uid()
        )
    );

-- ============================================
-- POLICIES - NOTIFICATIONS
-- ============================================

CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_admin" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_admin" ON notifications
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- POLICIES - CHANGE_REQUESTS
-- ============================================

CREATE POLICY "change_requests_select_own" ON change_requests
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "change_requests_insert_own" ON change_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "change_requests_update_admin" ON change_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "change_requests_delete_admin" ON change_requests
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );
