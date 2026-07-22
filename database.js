const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'usuarios.json');
const USERS_DIR = path.join(DATA_DIR, 'users');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveJson(file, data) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function userDir(userId) {
  const dir = path.join(USERS_DIR, String(userId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function userFile(userId, filename) {
  return path.join(userDir(userId), filename);
}

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verificarSenha(senha, hashCompleto) {
  const [salt, hash] = hashCompleto.split(':');
  const testHash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return hash === testHash;
}

function nextId(items) {
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

const usuarios = {
  all() {
    return loadJson(USERS_FILE, []);
  },
  cadastrar(dados) {
    const lista = this.all();
    if (lista.find(u => u.usuario === dados.usuario)) return null;
    const id = nextId(lista);
    const usuario = {
      id,
      empresa: dados.empresa || '',
      cnpj: dados.cnpj || '',
      endereco: dados.endereco || '',
      telefone: dados.telefone || '',
      whatsapp: dados.whatsapp || '',
      instagram: dados.instagram || '',
      usuario: dados.usuario,
      senha: hashSenha(dados.senha),
      criado_em: new Date().toISOString()
    };
    lista.push(usuario);
    saveJson(USERS_FILE, lista);
    userDir(id);
    return { id: usuario.id, empresa: usuario.empresa, usuario: usuario.usuario, criado_em: usuario.criado_em };
  },
  login(usuario, senha) {
    const lista = this.all();
    const u = lista.find(x => x.usuario === usuario);
    if (!u) return null;
    if (!verificarSenha(senha, u.senha)) return null;
    return { id: u.id, empresa: u.empresa, usuario: u.usuario };
  },
  get(userId) {
    const lista = this.all();
    const u = lista.find(x => x.id === Number(userId));
    if (!u) return null;
    return { id: u.id, empresa: u.empresa, cnpj: u.cnpj, endereco: u.endereco, telefone: u.telefone, whatsapp: u.whatsapp, instagram: u.instagram, usuario: u.usuario, criado_em: u.criado_em };
  },
  update(userId, dados) {
    const lista = this.all();
    const idx = lista.findIndex(x => x.id === Number(userId));
    if (idx === -1) return null;
    if (dados.empresa !== undefined) lista[idx].empresa = dados.empresa;
    if (dados.cnpj !== undefined) lista[idx].cnpj = dados.cnpj;
    if (dados.endereco !== undefined) lista[idx].endereco = dados.endereco;
    if (dados.telefone !== undefined) lista[idx].telefone = dados.telefone;
    if (dados.whatsapp !== undefined) lista[idx].whatsapp = dados.whatsapp;
    if (dados.instagram !== undefined) lista[idx].instagram = dados.instagram;
    saveJson(USERS_FILE, lista);
    return this.get(userId);
  }
};

function criarDb(userId) {
  const FILES = {
    clientes: userFile(userId, 'clientes.json'),
    orcamentos: userFile(userId, 'orcamentos.json'),
    itens: userFile(userId, 'itens.json'),
    parcelas: userFile(userId, 'parcelas.json'),
    configuracoes: userFile(userId, 'configuracoes.json')
  };

  function load(file) { return loadJson(file, []); }
  function save(file, data) { saveJson(file, data); }

  return {
    clientes: {
      all() { return load(FILES.clientes).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')); },
      get(id) { return load(FILES.clientes).find(c => c.id === Number(id)) || null; },
      insert(data) {
        const items = load(FILES.clientes);
        const item = { id: nextId(items), ...data, criado_em: new Date().toISOString() };
        items.push(item);
        save(FILES.clientes, items);
        return item;
      },
      update(id, data) {
        const items = load(FILES.clientes);
        const idx = items.findIndex(c => c.id === Number(id));
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...data };
        save(FILES.clientes, items);
        return items[idx];
      },
      delete(id) {
        const items = load(FILES.clientes);
        const filtered = items.filter(c => c.id !== Number(id));
        save(FILES.clientes, filtered);
        return filtered.length < items.length;
      }
    },

    orcamentos: {
      all(filtros = {}) {
        let items = load(FILES.orcamentos);
        const clientes = load(FILES.clientes);
        items = items.map(o => {
          const c = clientes.find(cl => cl.id === o.cliente_id) || {};
          return { ...o, cliente_nome: c.nome || '', cliente_telefone: c.telefone || '', cliente_email: c.email || '' };
        });
        if (filtros.status) items = items.filter(o => o.status === filtros.status);
        if (filtros.cliente_id) items = items.filter(o => o.cliente_id === Number(filtros.cliente_id));
        return items.sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
      },
      get(id) {
        const items = load(FILES.orcamentos);
        const o = items.find(orc => orc.id === Number(id));
        if (!o) return null;
        const clientes = load(FILES.clientes);
        const c = clientes.find(cl => cl.id === o.cliente_id) || {};
        const itens = load(FILES.itens).filter(i => i.orcamento_id === o.id);
        const parcelas = load(FILES.parcelas).filter(p => p.orcamento_id === o.id).sort((a, b) => a.numero - b.numero);
        return {
          ...o,
          cliente_nome: c.nome || '', cliente_telefone: c.telefone || '',
          cliente_email: c.email || '', cliente_endereco: c.endereco || '', cliente_cpf_cnpj: c.cpf_cnpj || '',
          itens, parcelas
        };
      },
      insert(data) {
        const items = load(FILES.orcamentos);
        const now = new Date().toISOString().split('T')[0];
        const item = {
          id: nextId(items),
          cliente_id: Number(data.cliente_id),
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          valor_total: Number(data.valor_total) || 0,
          status: data.status || 'pendente',
          data_orcamento: now,
          data_validade: data.data_validade || '',
          observacoes: data.observacoes || '',
          criado_em: new Date().toISOString()
        };
        items.push(item);
        save(FILES.orcamentos, items);

        if (data.itens && data.itens.length > 0) {
          const allItens = load(FILES.itens);
          let iid = nextId(allItens);
          for (const it of data.itens) {
            const itemTotal = (it.quantidade || 1) * (it.valor_unitario || 0);
            allItens.push({ id: iid++, orcamento_id: item.id, descricao: it.descricao, quantidade: it.quantidade || 1, valor_unitario: it.valor_unitario || 0, valor_total: itemTotal });
          }
          save(FILES.itens, allItens);
        }
        return item;
      },
      update(id, data) {
        const items = load(FILES.orcamentos);
        const idx = items.findIndex(o => o.id === Number(id));
        if (idx === -1) return null;

        if (data.cliente_id) items[idx].cliente_id = Number(data.cliente_id);
        if (data.titulo !== undefined) items[idx].titulo = data.titulo;
        if (data.descricao !== undefined) items[idx].descricao = data.descricao;
        if (data.valor_total !== undefined) items[idx].valor_total = Number(data.valor_total);
        if (data.status) items[idx].status = data.status;
        if (data.data_validade !== undefined) items[idx].data_validade = data.data_validade;
        if (data.observacoes !== undefined) items[idx].observacoes = data.observacoes;

        save(FILES.orcamentos, items);

        if (data.itens) {
          let allItens = load(FILES.itens).filter(i => i.orcamento_id !== Number(id));
          let iid = nextId(allItens);
          for (const it of data.itens) {
            const itemTotal = (it.quantidade || 1) * (it.valor_unitario || 0);
            allItens.push({ id: iid++, orcamento_id: Number(id), descricao: it.descricao, quantidade: it.quantidade || 1, valor_unitario: it.valor_unitario || 0, valor_total: itemTotal });
          }
          save(FILES.itens, allItens);
        }
        return items[idx];
      },
      delete(id) {
        let items = load(FILES.orcamentos);
        items = items.filter(o => o.id !== Number(id));
        save(FILES.orcamentos, items);
        let allItens = load(FILES.itens).filter(i => i.orcamento_id !== Number(id));
        save(FILES.itens, allItens);
        let allParcelas = load(FILES.parcelas).filter(p => p.orcamento_id !== Number(id));
        save(FILES.parcelas, allParcelas);
        return true;
      },
      gerarParcelas(orcamentoId, qtd, dataPrimeira) {
        const o = load(FILES.orcamentos).find(orc => orc.id === Number(orcamentoId));
        if (!o) return null;
        let parcelas = load(FILES.parcelas).filter(p => p.orcamento_id !== Number(orcamentoId));
        let pid = nextId(parcelas);
        const valorParcela = o.valor_total / qtd;
        for (let i = 0; i < qtd; i++) {
          const d = new Date(dataPrimeira || new Date());
          d.setMonth(d.getMonth() + i);
          parcelas.push({
            id: pid++, orcamento_id: Number(orcamentoId), numero: i + 1,
            valor: Math.round(valorParcela * 100) / 100,
            data_vencimento: d.toISOString().split('T')[0],
            data_pagamento: null, status: 'pendente', observacoes: '',
            criado_em: new Date().toISOString()
          });
        }
        save(FILES.parcelas, parcelas);
        return parcelas.filter(p => p.orcamento_id === Number(orcamentoId)).sort((a, b) => a.numero - b.numero);
      }
    },

    parcelas: {
      all(filtros = {}) {
        let items = load(FILES.parcelas);
        const orcamentos = load(FILES.orcamentos);
        const clientes = load(FILES.clientes);
        items = items.map(p => {
          const o = orcamentos.find(orc => orc.id === p.orcamento_id) || {};
          const c = clientes.find(cl => cl.id === o.cliente_id) || {};
          return { ...p, orcamento_titulo: o.titulo || '', cliente_nome: c.nome || '', cliente_telefone: c.telefone || '' };
        });
        if (filtros.status) items = items.filter(p => p.status === filtros.status);
        if (filtros.orcamento_id) items = items.filter(p => p.orcamento_id === Number(filtros.orcamento_id));
        return items.sort((a, b) => (a.data_vencimento || '').localeCompare(b.data_vencimento || ''));
      },
      vencendo(dias = 7) {
        const all = this.all({ status: 'pendente' });
        const limite = new Date();
        limite.setDate(limite.getDate() + dias);
        const limiteStr = limite.toISOString().split('T')[0];
        return all.filter(p => p.data_vencimento <= limiteStr);
      },
      pagar(id, dataPagamento) {
        const items = load(FILES.parcelas);
        const idx = items.findIndex(p => p.id === Number(id));
        if (idx === -1) return null;
        items[idx].status = 'pago';
        items[idx].data_pagamento = dataPagamento || new Date().toISOString().split('T')[0];
        save(FILES.parcelas, items);
        return items[idx];
      },
      cancelar(id) {
        const items = load(FILES.parcelas);
        const idx = items.findIndex(p => p.id === Number(id));
        if (idx === -1) return null;
        items[idx].status = 'pendente';
        items[idx].data_pagamento = null;
        save(FILES.parcelas, items);
        return items[idx];
      }
    },

    relatorios: {
      resumo() {
        const hoje = new Date().toISOString().split('T')[0];
        const mesAtual = hoje.substring(0, 7);
        const anoAtual = hoje.substring(0, 4);
        const semanaAtras = new Date();
        semanaAtras.setDate(semanaAtras.getDate() - 7);
        const semanaStr = semanaAtras.toISOString().split('T')[0];

        const all = load(FILES.orcamentos);

        const contar = (filtro) => {
          const filtrados = all.filter(filtro);
          return { total: filtrados.length, valor: filtrados.reduce((s, o) => s + (o.valor_total || 0), 0) };
        };

        const hoje2 = contar(o => o.data_orcamento === hoje);
        const semana = contar(o => o.data_orcamento >= semanaStr);
        const mes = contar(o => (o.data_orcamento || '').startsWith(mesAtual));
        const ano = contar(o => (o.data_orcamento || '').startsWith(anoAtual));
        const executadosHoje = contar(o => o.status === 'executado' && o.data_orcamento === hoje);
        const executadosMes = contar(o => o.status === 'executado' && (o.data_orcamento || '').startsWith(mesAtual));

        const statusMap = {};
        all.forEach(o => {
          if (!statusMap[o.status]) statusMap[o.status] = { status: o.status, total: 0, valor: 0 };
          statusMap[o.status].total++;
          statusMap[o.status].valor += o.valor_total || 0;
        });

        return {
          hoje: { ...hoje2, executados: executadosHoje.total, valorExecutados: executadosHoje.valor },
          semana, mes: { ...mes, executados: executadosMes.total, valorExecutados: executadosMes.valor },
          ano, porStatus: Object.values(statusMap)
        };
      },
      faturamentoMensal() {
        const all = load(FILES.orcamentos).filter(o => o.status === 'fechado' || o.status === 'executado');
        const map = {};
        all.forEach(o => {
          const mes = (o.data_orcamento || '').substring(0, 7);
          if (!mes) return;
          if (!map[mes]) map[mes] = { mes, total: 0, valor: 0 };
          map[mes].total++;
          map[mes].valor += o.valor_total || 0;
        });
        return Object.values(map).sort((a, b) => b.mes.localeCompare(a.mes)).slice(0, 12);
      }
    },

    configuracoes: {
      get() {
        if (!fs.existsSync(FILES.configuracoes)) {
          return { nome_empresa: '', cpf_cnpj: '', email: '', telefone: '', logo: '' };
        }
        return loadJson(FILES.configuracoes, { nome_empresa: '', cpf_cnpj: '', email: '', telefone: '', logo: '' });
      },
      save(dados) {
        saveJson(FILES.configuracoes, dados);
        return dados;
      }
    },

    dashboard() {
      const all = load(FILES.orcamentos);
      const clientes = load(FILES.clientes);

      const count = (status) => all.filter(o => o.status === status).length;
      const hoje = new Date().toISOString().split('T')[0];
      const mesAtual = hoje.substring(0, 7);
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      const semanaStr = semanaAtras.toISOString().split('T')[0];

      const faturar = (filtro) => all.filter(o => (o.status === 'fechado' || o.status === 'executado') && filtro(o)).reduce((s, o) => s + (o.valor_total || 0), 0);

      const parcelas = load(FILES.parcelas);
      const orcamentos = load(FILES.orcamentos);
      const limite = new Date();
      limite.setDate(limite.getDate() + 7);
      const limiteStr = limite.toISOString().split('T')[0];
      const parcelasVencendo = parcelas.filter(p => p.status === 'pendente' && p.data_vencimento <= limiteStr).map(p => {
        const o = orcamentos.find(orc => orc.id === p.orcamento_id) || {};
        const c = clientes.find(cl => cl.id === o.cliente_id) || {};
        return { ...p, orcamento_titulo: o.titulo || '', cliente_nome: c.nome || '' };
      }).sort((a, b) => (a.data_vencimento || '').localeCompare(b.data_vencimento || ''));

      const recentes = all.sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || '')).slice(0, 5).map(o => {
        const c = clientes.find(cl => cl.id === o.cliente_id) || {};
        return { ...o, cliente_nome: c.nome || '' };
      });

      return {
        pendentes: count('pendente'),
        aguardando: count('aguardando'),
        fechados: count('fechado'),
        executados: count('executado'),
        faturamentoMes: faturar(o => (o.data_orcamento || '').startsWith(mesAtual)),
        faturamentoSemana: faturar(o => o.data_orcamento >= semanaStr),
        parcelasVencendo,
        recentes
      };
    }
  };
}

module.exports = { usuarios, criarDb };