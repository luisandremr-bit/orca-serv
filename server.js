const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { criarDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'orca-serv-secret-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ erro: 'Nao autenticado' });
  next();
}

function getUserDb(req) {
  return criarDb(req.session.userId);
}

app.use('/api/auth', require('./routes/auth'));

app.use('/api/clientes', requireAuth, (req, res, next) => {
  req.db = getUserDb(req);
  next();
}, require('./routes/clientes'));

app.use('/api/orcamentos', requireAuth, (req, res, next) => {
  req.db = getUserDb(req);
  next();
}, require('./routes/orcamentos'));

app.use('/api/parcelas', requireAuth, (req, res, next) => {
  req.db = getUserDb(req);
  next();
}, require('./routes/parcelas'));

app.use('/api/relatorios', requireAuth, (req, res, next) => {
  req.db = getUserDb(req);
  next();
}, require('./routes/relatorios'));

app.use('/api/configuracoes', requireAuth, (req, res, next) => {
  req.db = getUserDb(req);
  next();
}, require('./routes/configuracoes'));

app.get('/api/dashboard', requireAuth, (req, res) => {
  const db = getUserDb(req);
  res.json(db.dashboard());
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('============================================');
  console.log('  OrcaServ - Sistema de Orcamentos');
  console.log('============================================');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('============================================');
  console.log('');
});
