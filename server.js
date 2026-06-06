const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./mensagens.db');

// Banco de Dados
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS mensagens (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, turma TEXT, mensagem TEXT, status TEXT DEFAULT 'pendente')");
    db.run("CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT UNIQUE, senha TEXT)");
    
    // Admin padrão: admin / 123
    db.get("SELECT count(*) as total FROM usuarios", (err, row) => {
        if (row && row.total === 0) {
            db.run("INSERT INTO usuarios (usuario, senha) VALUES (?, ?)", ['admin', '123']);
        }
    });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'segredo-escolar-namorados',
    resave: false,
    saveUninitialized: true
}));

// Middleware de segurança
function checkAdmin(req, res, next) {
    if (req.session.admin) next();
    else res.redirect('/login.html');
}

// --- ROTAS ALUNOS ---
app.post('/enviar', (req, res) => {
    const { nome, turma, mensagem } = req.body;
    db.run("INSERT INTO mensagens (nome, turma, mensagem) VALUES (?, ?, ?)", [nome, turma, mensagem], (err) => {
        if (err) return res.status(500).send("Erro");
        res.send("<script>alert('Mensagem enviada para moderação!'); window.location.href='/';</script>");
    });
});

app.get('/mensagens-aprovadas', (req, res) => {
    db.all("SELECT mensagem FROM mensagens WHERE status = 'aprovado' ORDER BY id DESC", (err, rows) => {
        res.json(rows);
    });
});

// --- ROTAS ADMIN ---
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    db.get("SELECT * FROM usuarios WHERE usuario = ? AND senha = ?", [usuario, senha], (err, row) => {
        if (row) {
            req.session.admin = true;
            res.redirect('/admin.html'); // Redireciona direto para moderação
        } else {
            res.send("<script>alert('Login incorreto!'); window.location.href='/login.html';</script>");
        }
    });
});

app.get('/admin/mensagens', checkAdmin, (req, res) => {
    db.all("SELECT * FROM mensagens ORDER BY id DESC", (err, rows) => res.json(rows));
});

app.post('/admin/acao', checkAdmin, (req, res) => {
    const { id, acao } = req.body;
    if (acao === 'aprovar') db.run("UPDATE mensagens SET status = 'aprovado' WHERE id = ?", [id]);
    else db.run("DELETE FROM mensagens WHERE id = ?", [id]);
    res.sendStatus(200);
});

app.post('/admin/cadastrar-usuario', checkAdmin, (req, res) => {
    const { novoUsuario, novaSenha } = req.body;
    db.run("INSERT INTO usuarios (usuario, senha) VALUES (?, ?)", [novoUsuario, novaSenha], (err) => {
        if (err) return res.send("<script>alert('Usuário já existe!'); window.location.href='/cadastro.html';</script>");
        res.send("<script>alert('Novo administrador cadastrado!'); window.location.href='/cadastro.html';</script>");
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));