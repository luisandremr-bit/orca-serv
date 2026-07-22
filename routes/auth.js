const express = require('express');
const router = express.Router();
const { usuarios } = require('../database');

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

module.exports = router;
