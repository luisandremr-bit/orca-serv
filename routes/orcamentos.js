const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, cliente_id } = req.query;
  const filtros = {};
  if (status) filtros.status = status;
  if (cliente_id) filtros.cliente_id = cliente_id;
  res.json(req.db.orcamentos.all(filtros));
});

router.get('/:id', (req, res) => {
  const orcamento = req.db.orcamentos.get(req.params.id);
  if (!orcamento) return res.status(404).json({ erro: 'Orcamento nao encontrado' });
  res.json(orcamento);
});

router.post('/', (req, res) => {
  const { cliente_id, titulo, descricao, valor_total, data_validade, observacoes, itens } = req.body;
  if (!cliente_id || !titulo) return res.status(400).json({ erro: 'Cliente e titulo sao obrigatorios' });
  const orcamento = req.db.orcamentos.insert({ cliente_id, titulo, descricao, valor_total, data_validade, observacoes, itens });
  res.status(201).json(orcamento);
});

router.put('/:id', (req, res) => {
  const existing = req.db.orcamentos.get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Orcamento nao encontrado' });
  const orcamento = req.db.orcamentos.update(req.params.id, req.body);
  res.json(orcamento);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.orcamentos.get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Orcamento nao encontrado' });
  req.db.orcamentos.delete(req.params.id);
  res.json({ mensagem: 'Orcamento removido com sucesso' });
});

router.post('/:id/gerar-parcelas', (req, res) => {
  const { quantidade_parcelas, data_primeira_parcela } = req.body;
  const parcelas = req.db.orcamentos.gerarParcelas(req.params.id, quantidade_parcelas || 1, data_primeira_parcela);
  if (!parcelas) return res.status(404).json({ erro: 'Orcamento nao encontrado' });
  res.json(parcelas);
});

module.exports = router;
