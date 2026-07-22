const express = require('express');
const router = express.Router();

router.get('/resumo', (req, res) => {
  res.json(req.db.relatorios.resumo());
});

router.get('/faturamento-mensal', (req, res) => {
  res.json(req.db.relatorios.faturamentoMensal());
});

module.exports = router;
