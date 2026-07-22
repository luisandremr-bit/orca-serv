const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(req.db.clientes.all());
});

router.get('/:id', (req, res) => {
  const cliente = req.db.clientes.get(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente nao encontrado' });
  res.json(cliente);
});

router.get('/:id/orcamentos', (req, res) => {
  const orcamentos = req.db.orcamentos.all({ cliente_id: req.params.id });
  res.json(orcamentos);
});

router.post('/', (req, res) => {
  const { nome, cpf_cnpj, telefone, email, endereco, observacoes } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome e obrigatorio' });
  const cliente = req.db.clientes.insert({ nome, cpf_cnpj, telefone, email, endereco, observacoes });
  res.status(201).json(cliente);
});

router.put('/:id', (req, res) => {
  const existing = req.db.clientes.get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Cliente nao encontrado' });
  const { nome, cpf_cnpj, telefone, email, endereco, observacoes } = req.body;
  const cliente = req.db.clientes.update(req.params.id, {
    nome: nome || existing.nome, cpf_cnpj: cpf_cnpj || existing.cpf_cnpj,
    telefone: telefone || existing.telefone, email: email || existing.email,
    endereco: endereco || existing.endereco, observacoes: observacoes !== undefined ? observacoes : existing.observacoes
  });
  res.json(cliente);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.clientes.get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Cliente nao encontrado' });
  req.db.clientes.delete(req.params.id);
  res.json({ mensagem: 'Cliente removido com sucesso' });
});

module.exports = router;
