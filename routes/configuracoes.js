const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const config = req.db.configuracoes.get();
  res.json(config);
});

router.put('/', (req, res) => {
  const config = req.db.configuracoes.save(req.body);
  res.json(config);
});

module.exports = router;
