// Testa a conexão com o Supabase e se o setup.sql já foi aplicado.
// Execute com: bun test-supabase.js  (o Bun lê o .env.local sozinho)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const tables = [
  "users",
  "exercises",
  "workout_programs",
  "workouts",
  "workout_exercises",
  "user_programs",
  "workout_logs",
  "exercise_logs",
  "change_requests",
];

console.log(`🔍 Testando ${url}\n`);
let ok = true;
for (const table of tables) {
  const { error } = await supabase.from(table).select("id").limit(1);
  console.log(`${error ? "❌" : "✅"} ${table}${error ? `: ${error.message}` : ""}`);
  if (error) ok = false;
}
console.log(ok ? "\n🚀 Tudo certo!" : "\n⚠️  Rode supabase/setup.sql no SQL Editor do Supabase.");
