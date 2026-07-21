const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/orcamentos', require('./routes/orcamentos'));
app.use('/api/parcelas', require('./routes/parcelas'));
app.use('/api/relatorios', require('./routes/relatorios'));
app.use('/api/configuracoes', require('./routes/configuracoes'));

app.get('/api/dashboard', (req, res) => {
  res.json(db.dashboard());
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('');
  console.log('============================================');
  console.log('  OrcaServ - Sistema de Orcamentos');
  console.log('============================================');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('  Rede:    http://' + ip + ':' + PORT);
  console.log('============================================');
  console.log('');
  console.log('  Para acessar pelo celular:');
  console.log('  1. Conecte o celular na mesma rede WiFi');
  console.log('  2. Abra http://' + ip + ':' + PORT);
  console.log('  3. No Chrome, toque em "Adicionar a tela inicial"');
  console.log('');
});
