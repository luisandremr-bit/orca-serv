const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/resumo', (req, res) => {
  res.json(db.relatorios.resumo());
});

router.get('/faturamento-mensal', (req, res) => {
  res.json(db.relatorios.faturamentoMensal());
});

module.exports = router;
