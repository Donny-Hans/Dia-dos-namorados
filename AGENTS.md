# AGENTS.md — Site Dia dos Namorados

## Stack
- **Backend**: Express 5 (`server.js` entrypoint), CommonJS.
- **Frontend**: Static HTML/CSS/JS in `public/`. No bundler.
- **ORM**: Prisma v6 (`prisma-client-js` generator) → MySQL (XAMPP local / PlanetScale produção).
- **Auth**: JWT (jsonwebtoken) em cookie httpOnly, sem `express-session`.
- **Deploy**: Vercel (serverless via `@vercel/node`).

## Commands
- `node server.js` — dev local (porta `process.env.PORT \|\| 3000`).
- `npx prisma generate` — gerar Prisma Client.
- `npx prisma db push` — sincronizar schema com o MySQL.
- `npx prisma db seed` — executar `prisma/seed.js` (cria admin `admin/123`).
- `npm test` — placeholder (sem testes).

## Arquitetura
- **DB**: MySQL via Prisma. `DATABASE_URL` no `.env` (local) ou variável de ambiente na Vercel.
- **Admin padrão**: `admin` / `123` (criado via `prisma/seed.js`).
- **Auth**: Middleware `checkAdmin` verifica cookie `token` (JWT, 1 dia de expiração).
- **Rotas** (`server.js`):
  - `POST /enviar` — aluno envia mensagem (status `pendente`)
  - `GET /mensagens-aprovadas` — mensagens aprovadas (JSON público)
  - `POST /login` — admin login (seta cookie JWT)
  - `GET /admin/mensagens` — todas as mensagens (admin, requer cookie)
  - `POST /admin/acao` — aprovar ou deletar mensagem
  - `POST /admin/cadastrar-usuario` — registrar novo admin
  - `GET /logout` — limpa cookie

## Convenções
- Respostas HTML usam `<script>alert(...); window.location.href=...</script>`.
- Rotas admin convertem `id` com `Number(id)` antes de passar ao Prisma.
- Senhas em texto plano (projeto acadêmico sem hash).

## Vercel
- `vercel.json` usa `@vercel/node` — build roda `npx prisma generate`.
- Em produção (`NODE_ENV=production`), `app.listen()` é ignorado; Vercel chama `module.exports = app`.
- Variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`) configuradas no dashboard da Vercel.

## Models Prisma (`prisma/schema.prisma`)
- **Mensagem**: `id`, `nome`, `turma`, `mensagem`, `status` (default `pendente`)
- **Usuario**: `id`, `usuario` (unique), `senha`

## Gotchas
- `server.js` usa `require()` (CommonJS) — não usar `import`/`export`.
- Prisma v6 lê `.env` automaticamente nos comandos CLI, mas no runtime `server.js` carrega com `require('dotenv').config()`.
- `DATABASE_URL` no `.env` local: `mysql://root:@localhost:3306/nomedobanco`.
- Mensagens com status `pendente`, `aprovado` ou deletadas (DELETE físico).
- Na Vercel, o build executa `npx prisma generate` — o binário do engine é baixado para a arquitetura Lambda.
