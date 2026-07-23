const express = require('express');
const router = express.Router();
const { usuarios, criarDb } = require('../database');

const ADMIN_USER = 'admin';
const ADMIN_SENHA = 'admin123';

router.post('/cadastrar', (req, res) => {
  const { empresa, cnpj, endereco, telefone, whatsapp, instagram, usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ erro: 'Usuario e senha sao obrigatorios' });
  if (senha.length < 4) return res.status(400).json({ erro: 'Senha deve ter no minimo 4 caracteres' });
  const novo = usuarios.cadastrar({ empresa, cnpj, endereco, telefone, whatsapp, instagram, usuario, senha });
  if (!novo) return res.status(400).json({ erro: 'Usuario ja existe' });
  req.session.userId = novo.id;
  req.session.user = novo;
  res.status(201).json(novo);
});

router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ erro: 'Usuario e senha sao obrigatorios' });
  const user = usuarios.login(usuario, senha);
  if (!user) return res.status(401).json({ erro: 'Usuario ou senha invalidos' });
  req.session.userId = user.id;
  req.session.user = user;
  res.json(user);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensagem: 'Logout realizado' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: 'Nao autenticado' });
  const user = usuarios.get(req.session.userId);
  if (!user) return res.status(401).json({ erro: 'Usuario nao encontrado' });
  res.json(user);
});

router.get('/limite', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: 'Nao autenticado' });
  const user = usuarios.get(req.session.userId);
  if (!user) return res.status(401).json({ erro: 'Usuario nao encontrado' });
  const db = criarDb(req.session.userId);
  const usado = db.contarOrcamentosMes();
  const plano = user.plano || 'free';
  const limite = plano === 'free' ? 5 : Infinity;
  res.json({ plano, usado, limite, restante: Math.max(0, limite - usado) });
});

router.post('/admin/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === ADMIN_USER && senha === ADMIN_SENHA) {
    req.session.adminLogado = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ erro: 'Credenciais de admin invalidas' });
});

router.post('/admin/logout', (req, res) => {
  req.session.adminLogado = false;
  res.json({ ok: true });
});

router.get('/admin/check', (req, res) => {
  res.json({ admin: !!req.session.adminLogado });
});

router.get('/admin/usuarios', (req, res) => {
  if (!req.session.adminLogado) return res.status(401).json({ erro: 'Nao autorizado' });
  const lista = usuarios.all().map(u => ({
    id: u.id, empresa: u.empresa, usuario: u.usuario, plano: u.plano || 'free', criado_em: u.criado_em
  }));
  res.json(lista);
});

router.put('/admin/usuarios/:id/plano', (req, res) => {
  if (!req.session.adminLogado) return res.status(401).json({ erro: 'Nao autorizado' });
  const { plano } = req.body;
  if (!['free', 'full'].includes(plano)) return res.status(400).json({ erro: 'Plano invalido' });
  const user = usuarios.updatePlano(req.params.id, plano);
  if (!user) return res.status(404).json({ erro: 'Usuario nao encontrado' });
  res.json(user);
});

module.exports = router;
