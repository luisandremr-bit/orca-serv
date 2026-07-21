const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const config = db.configuracoes.get();
  res.json(config);
});

router.put('/', (req, res) => {
  const config = db.configuracoes.save(req.body);
  res.json(config);
});

module.exports = router;
