require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-escolar-namorados-jwt';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

function checkAdmin(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login.html');
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.redirect('/login.html');
  }
}

// --- ROTAS ALUNOS ---
app.post('/enviar', async (req, res) => {
  const { nome, turma, mensagem } = req.body;
  try {
    await prisma.mensagem.create({ data: { nome, turma, mensagem } });
    res.send("<script>alert('Mensagem enviada para moderação!'); window.location.href='/';</script>");
  } catch {
    res.status(500).send("Erro");
  }
});

app.get('/mensagens-aprovadas', async (req, res) => {
  const rows = await prisma.mensagem.findMany({
    where: { status: 'aprovado' },
    orderBy: { id: 'desc' },
    select: { mensagem: true },
  });
  res.json(rows);
});

// --- ROTAS ADMIN ---
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const user = await prisma.usuario.findUnique({ where: { usuario } });
    if (user && user.senha === senha) {
      const token = jwt.sign({ usuario: user.usuario }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
      return res.redirect('/admin.html');
    }
    res.send("<script>alert('Login incorreto!'); window.location.href='/login.html';</script>");
  } catch {
    res.send("<script>alert('Erro no login!'); window.location.href='/login.html';</script>");
  }
});

app.get('/admin/mensagens', checkAdmin, async (req, res) => {
  const rows = await prisma.mensagem.findMany({ orderBy: { id: 'desc' } });
  res.json(rows);
});

app.post('/admin/acao', checkAdmin, async (req, res) => {
  const { id, acao } = req.body;
  if (acao === 'aprovar') {
    await prisma.mensagem.update({ where: { id: Number(id) }, data: { status: 'aprovado' } });
  } else {
    await prisma.mensagem.delete({ where: { id: Number(id) } });
  }
  res.sendStatus(200);
});

app.post('/admin/cadastrar-usuario', checkAdmin, async (req, res) => {
  const { novoUsuario, novaSenha } = req.body;
  try {
    await prisma.usuario.create({ data: { usuario: novoUsuario, senha: novaSenha } });
    res.send("<script>alert('Novo administrador cadastrado!'); window.location.href='/cadastro.html';</script>");
  } catch {
    res.send("<script>alert('Usuário já existe!'); window.location.href='/cadastro.html';</script>");
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// --- VERCEL ---
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
}

module.exports = app;
