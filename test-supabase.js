// Script para testar conexão com Supabase
// Execute com: bun test-supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://crbprxzyvfqfafsdoqnv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYnByeHp5dmZxZmFmc2RvcW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzk5ODQsImV4cCI6MjA4NDQxNTk4NH0.zWdCCTM5pIrpU8yH3s3HQ0AEClhkptJ4z4q5Dzm6opo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...\n');

  try {
    // Teste 1: Verificar se a tabela users existe
    console.log('📋 Teste 1: Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Erro na tabela users:', usersError.message);
      console.log('\n⚠️  A tabela users não existe ou não está acessível!');
      console.log('📝 Execute o script SETUP_COMPLETO.sql no Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/crbprxzyvfqfafsdoqnv/sql/new\n');
      return false;
    }

    console.log('✅ Tabela users existe!');
    console.log(`   Total de usuários: ${users?.length || 0}\n`);

    // Teste 2: Verificar outras tabelas
    console.log('📋 Teste 2: Verificando outras tabelas...');
    const tables = [
      'exercises',
      'workout_programs',
      'workouts',
      'workout_exercises',
      'user_programs',
      'workout_logs',
      'exercise_logs',
      'notifications',
      'change_requests'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}`);
      }
    }

    console.log('\n✅ Conexão com Supabase está funcionando!');
    console.log('🚀 Você pode começar a usar o sistema!');
    return true;

  } catch (error) {
    console.error('\n❌ Erro ao testar conexão:', error.message);
    return false;
  }
}

testConnection();
