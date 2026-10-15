# SGYMZ

App de treinos com dois temas: **Hello Kitty** (rosa, para quem treina) e **Batman** (escuro e dourado, para o admin). Feito para usar no celular, dentro da academia.

## O que dá para fazer

**Quem treina**
- Tela *Hoje* com o próximo treino da rotação (A → B → C), meta semanal em anel e sequência de semanas
- Modo treino: séries de aquecimento, preparação e válidas, carga e repetições já preenchidas com o último treino, timer de descanso com bipe e vibração, tela sempre acesa e progresso salvo no aparelho (dá para fechar o app e continuar)
- Finalização com nota do treino, anotações, resumo, confete e aviso de quais exercícios subiram de carga
- Histórico com calendário do mês e gráfico de evolução de carga por exercício
- Montar os próprios programas (em branco ou de um modelo pronto), copiar um programa do admin para personalizar e pedir ajustes ao admin
- Troca de tema a qualquer momento; instalável como app (Adicionar à Tela de Início)

**Admin**
- Painel com alunos, treinos recentes e pedidos pendentes
- Atribuir programas, ver histórico e evolução de cada aluno, bloquear acesso e promover a admin
- Biblioteca de exercícios (50 exercícios em português já vêm cadastrados)
- Responder pedidos de ajuste

## Rodando

```bash
bun install
cp .env.example .env.local   # preencha com a URL e a anon key do Supabase
bun dev
```

### Banco (uma vez)

1. No Supabase, abra **SQL Editor** e rode todo o arquivo [`supabase/setup.sql`](supabase/setup.sql).
   Ele recria as tabelas, as políticas RLS, os gatilhos e a biblioteca de exercícios.
   As contas de login existentes são mantidas.
2. Em **Authentication → Sign In / Providers → Email**, desligue **Confirm email** para entrar direto depois do cadastro.
3. Confira com `bun test-supabase.js`.

O **primeiro cadastro** do sistema vira admin. Os demais entram como alunos e podem ser promovidos no painel.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (Auth + Postgres + RLS), Zod e React Hook Form, Lucide.

## Estrutura

```
app/
  page.tsx                  escolha entre "Vim treinar" e "Painel do admin"
  login, register           entrada de quem treina
  (app)/                    área de quem treina: dashboard, treinos, historico, perfil
  (focus)/treino/[id]       modo treino em tela cheia
  admin/login, register     entrada do admin
  admin/(panel)/            painel: dashboard, usuarios, programas, exercicios, pedidos
components/                 shell, editor de programa, histórico, seletor de exercícios
components/ui/              botão, cartão, campos, stepper, sheet, toast...
lib/data.ts                 todas as consultas ao Supabase
lib/templates.ts            modelos prontos de programa
supabase/setup.sql          schema completo
```

Os temas são tokens CSS em `app/globals.css`. A variante `kitty:` do Tailwind aplica estilos só no tema Hello Kitty.
