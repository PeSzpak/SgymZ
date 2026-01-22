# SGYMZ - Sistema de Gerenciamento de Treinos

Sistema completo de gerenciamento de treinos personalizados com suporte a múltiplos administradores e usuários.

## 🚀 Funcionalidades

- ✅ **Autenticação separada**: Logins distintos para admin e usuários
- ✅ **Auto-login pós-cadastro**: Após registrar, entra direto no sistema
- ✅ **Primeiro usuário = Admin**: O primeiro a se cadastrar vira admin automaticamente
- ✅ **Múltiplos admins**: Suporte para vários administradores
- ✅ **Temas personalizáveis**: Batman (escuro/dourado) e Hello Kitty (rosa)
- ✅ **Row Level Security**: Segurança em nível de linha no banco de dados
- ✅ **Sistema de aprovação**: Admins podem aprovar/rejeitar usuários

## 📦 Stack Tecnológica

- **Framework**: Next.js 16.1.3 (App Router + Turbopack)
- **Banco de dados**: Supabase (PostgreSQL + Auth + RLS)
- **Estilização**: Tailwind CSS 4.0
- **Validação**: Zod + React Hook Form
- **UI Components**: Componentes customizados com class-variance-authority
- **Icons**: Lucide React
- **Package Manager**: Bun

## 🗂️ Estrutura do Projeto

\`\`\`
/app
  page.tsx                    # Tela inicial (escolher admin ou usuário)
  /login                      # Login de usuário normal
  /register                   # Cadastro de usuário normal
  /dashboard                  # Dashboard de usuário normal
  /admin
    /login                    # Login de admin
    /register                 # Cadastro de admin
    /dashboard                # Dashboard de admin
/components/ui                # Componentes reutilizáveis
/lib
  /supabase                   # Clientes Supabase (server, client, middleware)
  /validations                # Schemas Zod
/hooks
  use-theme.tsx               # Hook de gerenciamento de tema
/supabase
  01_reset.sql                # Script para resetar banco
  02_schema.sql               # Schema completo do banco
  03_policies.sql             # Políticas RLS
/types
  database.ts                 # Tipos TypeScript
\`\`\`

## 🛠️ Configuração do Banco de Dados

### Passo 1: Resetar o banco (CUIDADO: deleta tudo!)

Abra o SQL Editor no Supabase e execute:

\`\`\`sql
-- Copie e cole o conteúdo de 01_reset.sql
\`\`\`

### Passo 2: Criar o schema

\`\`\`sql
-- Copie e cole o conteúdo de 02_schema.sql
\`\`\`

### Passo 3: Aplicar policies

\`\`\`sql
-- Copie e cole o conteúdo de 03_policies.sql
\`\`\`

## 🎯 Fluxo de Uso

### Primeiro Acesso (Admin)
1. Acesse a tela inicial
2. Clique em "Sou Administrador"
3. Clique em "Cadastre-se"
4. Preencha os dados
5. **Você é automaticamente o primeiro admin e entra direto no sistema**

### Cadastro de Usuário Normal
1. Acesse a tela inicial
2. Clique em "Sou Usuário"
3. Clique em "Cadastre-se"
4. Preencha os dados
5. **Entra direto no dashboard após cadastro**

### Cadastro de Novos Admins
1. Acesse `/admin/register`
2. Preencha os dados
3. **Primeiro admin é aprovado automaticamente**
4. **Demais admins: precisam ser aprovados por outro admin (futuro)**

## 🎨 Temas

### Batman Theme
- Background escuro (#0a0a0a)
- Acentos dourados (#d4af37)
- Visual minimalista e profissional

### Hello Kitty Theme
- Background rosa claro (#fce7f3)
- Acentos rosa (#ec4899)
- Bordas arredondadas e visual fofo

## 🔒 Segurança

- **RLS habilitado**: Todas as tabelas protegidas
- **Políticas separadas**: Admins e usuários têm permissões distintas
- **Validação de rotas**: Middleware protege rotas sensíveis
- **Senhas seguras**: Mínimo 6 caracteres
- **Email único**: Sistema não permite emails duplicados

## 🚦 Status de Usuários

- **approved**: Pode usar o sistema normalmente
- **pending**: Aguardando aprovação (não pode logar)
- **rejected**: Rejeitado (não pode logar)

## 📝 Tabelas do Banco

1. **users**: Dados dos usuários + flag is_admin
2. **exercises**: Exercícios cadastrados
3. **workout_programs**: Programas de treino
4. **workouts**: Treinos individuais
5. **workout_exercises**: Exercícios dentro de treinos
6. **user_programs**: Atribuição de programas aos usuários
7. **workout_logs**: Registro de treinos executados
8. **exercise_logs**: Detalhes de cada série executada
9. **notifications**: Sistema de notificações
10. **change_requests**: Solicitações de alteração de treino

## 🔧 Desenvolvimento

\`\`\`bash
# Instalar dependências
bun install

# Rodar em desenvolvimento
bun dev

# Build para produção
bun build

# Iniciar produção
bun start
\`\`\`

## 📌 Variáveis de Ambiente

Crie um arquivo \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
\`\`\`

## 🎓 Próximos Passos

- [ ] Interface de aprovação de usuários para admins
- [ ] CRUD completo de exercícios
- [ ] Criação de programas de treino
- [ ] Atribuição de programas aos usuários
- [ ] Registro de execução de treinos
- [ ] Dashboard com estatísticas e gráficos
- [ ] Sistema de notificações em tempo real
- [ ] Solicitações de alteração de treino

## 📄 Licença

Projeto privado - Todos os direitos reservados

---

Desenvolvido com ❤️ usando Next.js + Supabase
