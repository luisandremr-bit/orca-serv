const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, orcamento_id } = req.query;
  const filtros = {};
  if (status) filtros.status = status;
  if (orcamento_id) filtros.orcamento_id = orcamento_id;
  res.json(req.db.parcelas.all(filtros));
});

router.get('/vencendo', (req, res) => {
  const dias = parseInt(req.query.dias) || 7;
  res.json(req.db.parcelas.vencendo(dias));
});

router.put('/:id/pagar', (req, res) => {
  const parcela = req.db.parcelas.pagar(req.params.id, req.body.data_pagamento);
  if (!parcela) return res.status(404).json({ erro: 'Parcela nao encontrada' });
  res.json(parcela);
});

router.put('/:id/cancelar', (req, res) => {
  const parcela = req.db.parcelas.cancelar(req.params.id);
  if (!parcela) return res.status(404).json({ erro: 'Parcela nao encontrada' });
  res.json(parcela);
});

module.exports = router;
