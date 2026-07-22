const API = '';
let orcamentoAtual = null;
let todosClientes = [];
let configEmpresa = { nome_empresa: '', cpf_cnpj: '', email: '', telefone: '', logo: '' };
let usuarioLogado = null;

// ==================== AUTH ====================
async function verificarSessao() {
  try {
    const res = await fetch(API + '/api/auth/me');
    if (res.ok) {
      const user = await res.json();
      usuarioLogado = user;
      mostrarApp();
      return true;
    }
  } catch (e) {}
  mostrarAuth();
  return false;
}

function mostrarAuth() {
  document.getElementById('auth-screen').style.display = '';
  document.getElementById('app-screen').style.display = 'none';
}

function mostrarApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  document.getElementById('sidebarEmpresa').textContent = usuarioLogado.empresa || usuarioLogado.usuario;
  initApp();
}

function mostrarLogin(e) {
  if (e) e.preventDefault();
  document.getElementById('auth-landing').classList.add('active');
  document.getElementById('auth-registro').classList.remove('active');
  document.getElementById('loginErro').style.display = 'none';
  document.getElementById('registroErro').style.display = 'none';
}

function mostrarRegistro(e) {
  if (e) e.preventDefault();
  document.getElementById('auth-landing').classList.remove('active');
  document.getElementById('auth-registro').classList.add('active');
  document.getElementById('loginErro').style.display = 'none';
  document.getElementById('registroErro').style.display = 'none';
}

function mostrarErroLogin(msg) {
  const el = document.getElementById('loginErro');
  el.textContent = msg;
  el.style.display = 'block';
}

function mostrarErroRegistro(msg) {
  const el = document.getElementById('registroErro');
  el.textContent = msg;
  el.style.display = 'block';
}

async function fazerLogin() {
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value;
  if (!usuario || !senha) { mostrarErroLogin('Preencha usuario e senha'); return; }
  try {
    const res = await fetch(API + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });
    const data = await res.json();
    if (!res.ok) { mostrarErroLogin(data.erro || 'Erro ao fazer login'); return; }
    usuarioLogado = data;
    mostrarApp();
  } catch (e) {
    mostrarErroLogin('Erro de conexao');
  }
}

async function fazerRegistro() {
  const empresa = document.getElementById('regEmpresa').value.trim();
  const cnpj = document.getElementById('regCnpj').value.trim();
  const telefone = document.getElementById('regTelefone').value.trim();
  const endereco = document.getElementById('regEndereco').value.trim();
  const whatsapp = document.getElementById('regWhatsapp').value.trim();
  const instagram = document.getElementById('regInstagram').value.trim();
  const usuario = document.getElementById('regUsuario').value.trim();
  const senha = document.getElementById('regSenha').value;

  if (!empresa) { mostrarErroRegistro('Nome da empresa e obrigatorio'); return; }
  if (!usuario) { mostrarErroRegistro('Escolha um usuario'); return; }
  if (!senha || senha.length < 4) { mostrarErroRegistro('Senha deve ter no minimo 4 caracteres'); return; }

  try {
    const res = await fetch(API + '/api/auth/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, cnpj, telefone, endereco, whatsapp, instagram, usuario, senha })
    });
    const data = await res.json();
    if (!res.ok) { mostrarErroRegistro(data.erro || 'Erro ao criar conta'); return; }
    usuarioLogado = data;
    mostrarApp();
  } catch (e) {
    mostrarErroRegistro('Erro de conexao');
  }
}

function fazerLogout(e) {
  if (e) e.preventDefault();
  fetch(API + '/api/auth/logout', { method: 'POST' }).finally(() => {
    usuarioLogado = null;
    orcamentoAtual = null;
    configEmpresa = { nome_empresa: '', cpf_cnpj: '', email: '', telefone: '', logo: '' };
    document.getElementById('loginUsuario').value = '';
    document.getElementById('loginSenha').value = '';
    mostrarAuth();
  });
}

// ==================== NAVEGACAO ====================
document.querySelectorAll('.sidebar nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    if (page === 'dashboard') carregarDashboard();
    if (page === 'clientes') carregarClientes();
    if (page === 'orcamentos') carregarOrcamentos();
    if (page === 'parcelas') carregarParcelas();
    if (page === 'relatorios') carregarRelatorios();
    if (page === 'configuracoes') carregarConfiguracoes();
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ==================== UTILS ====================
function formatarMoeda(valor) {
  return 'R$ ' + parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function statusBadge(status) {
  const labels = { pendente: 'Pendente', aguardando: 'Aguardando', visualizado: 'Visualizado', fechado: 'Fechado', executado: 'Executado', cancelado: 'Cancelado', pago: 'Pago', atrasado: 'Atrasado' };
  return `<span class="badge-status badge-${status}">${labels[status] || status}</span>`;
}

function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }

async function apiFetch(url, options = {}) {
  const res = await fetch(API + url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (res.status === 401) {
    mostrarAuth();
    throw new Error('Nao autenticado');
  }
  return res.json();
}

// ==================== DASHBOARD ====================
async function carregarDashboard() {
  const data = await apiFetch('/api/dashboard');
  document.getElementById('dashboardCards').innerHTML = `
    <div class="card-stat primary">
      <div class="stat-label">Pendentes</div>
      <div class="stat-value">${data.pendentes}</div>
      <div class="stat-sub">orcamentos aguardando</div>
    </div>
    <div class="card-stat warning">
      <div class="stat-label">Aguardando Retorno</div>
      <div class="stat-value">${data.aguardando}</div>
      <div class="stat-sub">propostas enviadas</div>
    </div>
    <div class="card-stat success">
      <div class="stat-label">Fechados</div>
      <div class="stat-value">${data.fechados}</div>
      <div class="stat-sub">contratos fechados</div>
    </div>
    <div class="card-stat info">
      <div class="stat-label">Executados</div>
      <div class="stat-value">${data.executados}</div>
      <div class="stat-sub">servicos realizados</div>
    </div>
    <div class="card-stat success">
      <div class="stat-label">Faturamento Semana</div>
      <div class="stat-value">${formatarMoeda(data.faturamentoSemana)}</div>
    </div>
    <div class="card-stat primary">
      <div class="stat-label">Faturamento Mes</div>
      <div class="stat-value">${formatarMoeda(data.faturamentoMes)}</div>
    </div>
  `;

  let recentesHtml = '';
  if (data.recentes.length === 0) {
    recentesHtml = '<div class="empty-state"><div class="icon">&#9998;</div><p>Nenhum orcamento ainda</p></div>';
  } else {
    data.recentes.forEach(r => {
      recentesHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div><strong>${r.titulo}</strong><br><small style="color:#999">${r.cliente_nome} - ${formatarData(r.data_orcamento)}</small></div>
        <div style="text-align:right">${statusBadge(r.status)}<br><strong>${formatarMoeda(r.valor_total)}</strong></div>
      </div>`;
    });
  }
  document.getElementById('recentesList').innerHTML = recentesHtml;

  let parcelasHtml = '';
  if (data.parcelasVencendo.length === 0) {
    parcelasHtml = '<div class="empty-state"><div class="icon">&#9733;</div><p>Nenhuma parcela vencendo</p></div>';
  } else {
    data.parcelasVencendo.forEach(p => {
      const hoje = new Date();
      const venc = new Date(p.data_vencimento + 'T00:00:00');
      const diasRestantes = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
      const urgencia = diasRestantes <= 0 ? 'danger-custom' : (diasRestantes <= 3 ? 'danger-custom' : 'warning-custom');
      parcelasHtml += `<div class="alert-custom alert-${urgencia}">
        <div><strong>${p.cliente_nome}</strong> - Parcela ${p.numero}<br><small>Vence: ${formatarData(p.data_vencimento)} (${diasRestantes} dias) - ${formatarMoeda(p.valor)}</small></div>
      </div>`;
    });
  }
  document.getElementById('parcelasAlertList').innerHTML = parcelasHtml;
}

// ==================== CLIENTES ====================
async function carregarClientes() {
  todosClientes = await apiFetch('/api/clientes');
  renderizarClientes(todosClientes);
}

function renderizarClientes(clientes) {
  const tbody = document.querySelector('#tabelaClientes tbody');
  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Nenhum cliente cadastrado</p></td></tr>';
    return;
  }
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td><strong>${c.nome}</strong></td>
      <td>${c.telefone || '-'}</td>
      <td>${c.email || '-'}</td>
      <td>${c.cpf_cnpj || '-'}</td>
      <td>
        <button class="btn-action btn-view" onclick="editarCliente(${c.id})">Editar</button>
        <button class="btn-action btn-delete" onclick="excluirCliente(${c.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function filtrarClientes() {
  const busca = document.getElementById('buscaCliente').value.toLowerCase();
  const filtrados = todosClientes.filter(c => c.nome.toLowerCase().includes(busca) || (c.telefone || '').includes(busca) || (c.email || '').includes(busca));
  renderizarClientes(filtrados);
}

function abrirModalCliente(cliente = null) {
  document.getElementById('modalClienteTitulo').textContent = cliente ? 'Editar Cliente' : 'Novo Cliente';
  document.getElementById('clienteId').value = cliente ? cliente.id : '';
  document.getElementById('clienteNome').value = cliente ? cliente.nome : '';
  document.getElementById('clienteCpf').value = cliente ? cliente.cpf_cnpj : '';
  document.getElementById('clienteTelefone').value = cliente ? cliente.telefone : '';
  document.getElementById('clienteEmail').value = cliente ? cliente.email : '';
  document.getElementById('clienteEndereco').value = cliente ? cliente.endereco : '';
  document.getElementById('clienteObs').value = cliente ? cliente.observacoes : '';
  abrirModal('modalCliente');
}

async function editarCliente(id) {
  const cliente = await apiFetch('/api/clientes/' + id);
  abrirModalCliente(cliente);
}

async function salvarCliente() {
  const id = document.getElementById('clienteId').value;
  const dados = {
    nome: document.getElementById('clienteNome').value,
    cpf_cnpj: document.getElementById('clienteCpf').value,
    telefone: document.getElementById('clienteTelefone').value,
    email: document.getElementById('clienteEmail').value,
    endereco: document.getElementById('clienteEndereco').value,
    observacoes: document.getElementById('clienteObs').value
  };
  if (!dados.nome) { alert('Nome e obrigatorio!'); return; }
  if (id) {
    await apiFetch('/api/clientes/' + id, { method: 'PUT', body: JSON.stringify(dados) });
  } else {
    await apiFetch('/api/clientes', { method: 'POST', body: JSON.stringify(dados) });
  }
  fecharModal('modalCliente');
  carregarClientes();
}

async function excluirCliente(id) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
  await apiFetch('/api/clientes/' + id, { method: 'DELETE' });
  carregarClientes();
}

// ==================== ORCAMENTOS ====================
async function carregarClientesSelect() {
  const clientes = await apiFetch('/api/clientes');
  const select = document.getElementById('orcamentoCliente');
  select.innerHTML = '<option value="">Selecione o cliente</option>' + clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

async function carregarOrcamentos() {
  const status = document.getElementById('filtroStatus').value;
  const url = status ? `/api/orcamentos?status=${status}` : '/api/orcamentos';
  const orcamentos = await apiFetch(url);
  const tbody = document.querySelector('#tabelaOrcamentos tbody');
  if (orcamentos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>Nenhum orcamento encontrado</p></td></tr>';
    return;
  }
  tbody.innerHTML = orcamentos.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.cliente_nome}</td>
      <td>${o.titulo}</td>
      <td><strong>${formatarMoeda(o.valor_total)}</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatarData(o.data_orcamento)}</td>
      <td style="white-space:nowrap;">
        <button class="btn-action btn-view" onclick="verOrcamento(${o.id})" title="Ver detalhes">&#128065;</button>
        <button class="btn-action btn-edit" onclick="editarOrcamento(${o.id})" title="Editar">&#9998;</button>
        <button class="btn-action btn-pdf" onclick="gerarPDF(${o.id})" title="Gerar PDF">PDF</button>
        <button class="btn-action btn-whatsapp" onclick="enviarWhatsApp(${o.id})" title="Enviar WhatsApp">&#128172;</button>
        <button class="btn-action btn-delete" onclick="excluirOrcamento(${o.id})" title="Excluir">&#10006;</button>
      </td>
    </tr>
  `).join('');
}

async function abrirModalOrcamento(orcamento = null) {
  await carregarClientesSelect();
  document.getElementById('modalOrcamentoTitulo').textContent = orcamento ? 'Editar Orcamento' : 'Novo Orcamento';
  document.getElementById('orcamentoId').value = orcamento ? orcamento.id : '';
  document.getElementById('orcamentoCliente').value = orcamento ? orcamento.cliente_id : '';
  document.getElementById('orcamentoTitulo').value = orcamento ? orcamento.titulo : '';
  document.getElementById('orcamentoDescricao').value = orcamento ? orcamento.descricao : '';
  document.getElementById('orcamentoStatus').value = orcamento ? orcamento.status : 'pendente';
  document.getElementById('orcamentoValidade').value = orcamento ? orcamento.data_validade : '';
  document.getElementById('orcamentoValor').value = orcamento ? orcamento.valor_total : '';
  document.getElementById('orcamentoObs').value = orcamento ? orcamento.observacoes : '';
  document.getElementById('itensOrcamento').innerHTML = '';
  if (orcamento && orcamento.id) {
    const detalhes = await apiFetch('/api/orcamentos/' + orcamento.id);
    if (detalhes.itens && detalhes.itens.length > 0) {
      detalhes.itens.forEach(item => adicionarItem(item));
    } else {
      adicionarItem();
    }
  } else {
    adicionarItem();
  }
  abrirModal('modalOrcamento');
}

function adicionarItem(item = null) {
  const container = document.getElementById('itensOrcamento');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.style.cssText = 'display:grid; grid-template-columns: 3fr 1fr 1fr 1fr auto; gap:8px; margin-bottom:8px; align-items:center;';
  row.innerHTML = `
    <input type="text" placeholder="Descricao do item" class="item-desc" value="${item ? item.descricao : ''}">
    <input type="number" placeholder="Qtd" class="item-qtd" value="${item ? item.quantidade : 1}" min="0" step="0.01">
    <input type="number" placeholder="Valor Unit." class="item-valor" value="${item ? item.valor_unitario : ''}" step="0.01">
    <input type="text" class="item-total" readonly placeholder="Total" style="background:#f5f5f5;font-weight:600;">
    <button class="remove-item-btn" onclick="this.parentElement.remove();recalcularTotal();">&times;</button>
  `;
  container.appendChild(row);
  row.querySelector('.item-qtd').addEventListener('input', () => { atualizarTotalItem(row); recalcularTotal(); });
  row.querySelector('.item-valor').addEventListener('input', () => { atualizarTotalItem(row); recalcularTotal(); });
  if (item) atualizarTotalItem(row);
}

function atualizarTotalItem(row) {
  const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
  const valor = parseFloat(row.querySelector('.item-valor').value) || 0;
  row.querySelector('.item-total').value = formatarMoeda(qtd * valor);
}

function recalcularTotal() {
  let total = 0;
  document.querySelectorAll('.item-row').forEach(row => {
    const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
    const valor = parseFloat(row.querySelector('.item-valor').value) || 0;
    total += qtd * valor;
  });
  document.getElementById('orcamentoValor').value = total.toFixed(2);
}

async function salvarOrcamento() {
  const id = document.getElementById('orcamentoId').value;
  const itens = [];
  document.querySelectorAll('.item-row').forEach(row => {
    const desc = row.querySelector('.item-desc').value;
    if (desc) {
      itens.push({
        descricao: desc,
        quantidade: parseFloat(row.querySelector('.item-qtd').value) || 1,
        valor_unitario: parseFloat(row.querySelector('.item-valor').value) || 0
      });
    }
  });
  const dados = {
    cliente_id: document.getElementById('orcamentoCliente').value,
    titulo: document.getElementById('orcamentoTitulo').value,
    descricao: document.getElementById('orcamentoDescricao').value,
    status: document.getElementById('orcamentoStatus').value,
    valor_total: parseFloat(document.getElementById('orcamentoValor').value) || 0,
    data_validade: document.getElementById('orcamentoValidade').value,
    observacoes: document.getElementById('orcamentoObs').value,
    itens
  };
  if (!dados.cliente_id || !dados.titulo) { alert('Cliente e Titulo sao obrigatorios!'); return; }
  if (id) {
    await apiFetch('/api/orcamentos/' + id, { method: 'PUT', body: JSON.stringify(dados) });
  } else {
    await apiFetch('/api/orcamentos', { method: 'POST', body: JSON.stringify(dados) });
  }
  fecharModal('modalOrcamento');
  carregarOrcamentos();
}

async function editarOrcamento(id) {
  const orcamento = await apiFetch('/api/orcamentos/' + id);
  abrirModalOrcamento(orcamento);
}

async function excluirOrcamento(id) {
  if (!confirm('Tem certeza que deseja excluir este orcamento?')) return;
  await apiFetch('/api/orcamentos/' + id, { method: 'DELETE' });
  carregarOrcamentos();
}

async function verOrcamento(id) {
  const o = await apiFetch('/api/orcamentos/' + id);
  orcamentoAtual = o;
  let itensHtml = '';
  if (o.itens && o.itens.length > 0) {
    itensHtml = `<table class="table-custom" style="margin-top:12px;"><thead><tr><th>Item</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr></thead><tbody>`;
    o.itens.forEach(item => {
      itensHtml += `<tr><td>${item.descricao}</td><td>${item.quantidade}</td><td>${formatarMoeda(item.valor_unitario)}</td><td>${formatarMoeda(item.valor_total)}</td></tr>`;
    });
    itensHtml += `</tbody></table>`;
  }
  let parcelasHtml = '';
  if (o.parcelas && o.parcelas.length > 0) {
    parcelasHtml = `<div class="section-divider">Parcelas</div><table class="table-custom"><thead><tr><th>#</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Status</th></tr></thead><tbody>`;
    o.parcelas.forEach(p => {
      parcelasHtml += `<tr><td>${p.numero}x</td><td>${formatarMoeda(p.valor)}</td><td>${formatarData(p.data_vencimento)}</td><td>${p.data_pagamento ? formatarData(p.data_pagamento) : '-'}</td><td>${statusBadge(p.status)}</td></tr>`;
    });
    parcelasHtml += `</tbody></table>`;
  }
  document.getElementById('detalhesOrcamento').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div><strong>Cliente:</strong> ${o.cliente_nome}</div>
      <div><strong>Telefone:</strong> ${o.cliente_telefone || '-'}</div>
      <div><strong>Email:</strong> ${o.cliente_email || '-'}</div>
      <div><strong>CPF/CNPJ:</strong> ${o.cliente_cpf_cnpj || '-'}</div>
    </div>
    <div class="section-divider">Orcamento #${o.id}</div>
    <h3 style="margin:8px 0;">${o.titulo}</h3>
    <p style="color:#666;margin-bottom:8px;">${o.descricao || ''}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:12px 0;">
      <div><strong>Status:</strong> ${statusBadge(o.status)}</div>
      <div><strong>Valor:</strong> ${formatarMoeda(o.valor_total)}</div>
      <div><strong>Validade:</strong> ${formatarData(o.data_validade)}</div>
    </div>
    ${itensHtml}
    ${parcelasHtml}
    ${o.observacoes ? `<div class="section-divider">Observacoes</div><p>${o.observacoes}</p>` : ''}
  `;
  abrirModal('modalVerOrcamento');
}

// ==================== PARCELAS ====================
async function carregarParcelas() {
  const status = document.getElementById('filtroParcelas').value;
  const url = status ? `/api/parcelas?status=${status}` : '/api/parcelas';
  const parcelas = await apiFetch(url);
  const pendentes = parcelas.filter(p => p.status === 'pendente');
  const pagas = parcelas.filter(p => p.status === 'pago');
  const totalPendente = pendentes.reduce((s, p) => s + p.valor, 0);
  const totalPago = pagas.reduce((s, p) => s + p.valor, 0);

  document.getElementById('resumoParcelas').innerHTML = `
    <div class="card-stat warning">
      <div class="stat-label">Pendentes</div>
      <div class="stat-value">${pendentes.length}</div>
      <div class="stat-sub">${formatarMoeda(totalPendente)}</div>
    </div>
    <div class="card-stat success">
      <div class="stat-label">Pagas</div>
      <div class="stat-value">${pagas.length}</div>
      <div class="stat-sub">${formatarMoeda(totalPago)}</div>
    </div>
  `;

  const tbody = document.querySelector('#tabelaParcelas tbody');
  if (parcelas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>Nenhuma parcela encontrada</p></td></tr>';
    return;
  }
  tbody.innerHTML = parcelas.map(p => {
    const hoje = new Date();
    const venc = new Date(p.data_vencimento + 'T00:00:00');
    const diasRestantes = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    let alerta = '';
    if (p.status === 'pendente' && diasRestantes <= 0) alerta = ' <span style="color:#c62828;font-size:0.75rem;">(ATRASADA)</span>';
    else if (p.status === 'pendente' && diasRestantes <= 3) alerta = ` <span style="color:#f57f17;font-size:0.75rem;">(${diasRestantes} dias)</span>`;

    return `<tr>
      <td>${p.cliente_nome}</td>
      <td>${p.orcamento_titulo}</td>
      <td>${p.numero}x</td>
      <td><strong>${formatarMoeda(p.valor)}</strong></td>
      <td>${formatarData(p.data_vencimento)}${alerta}</td>
      <td>${statusBadge(p.status)}</td>
      <td>
        ${p.status === 'pendente' ? `<button class="btn-action btn-whatsapp" onclick="marcarPaga(${p.id})">Marcar Paga</button>` : ''}
        ${p.status === 'pago' ? `<button class="btn-action btn-delete" onclick="desmarcarPaga(${p.id})">Desfazer</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

async function marcarPaga(id) {
  await apiFetch('/api/parcelas/' + id + '/pagar', { method: 'PUT', body: JSON.stringify({}) });
  carregarParcelas();
}

async function desmarcarPaga(id) {
  await apiFetch('/api/parcelas/' + id + '/cancelar', { method: 'PUT' });
  carregarParcelas();
}

function abrirGerarParcelas(orcamentoId) {
  document.getElementById('parcelasOrcamentoId').value = orcamentoId;
  document.getElementById('qtdParcelas').value = 2;
  document.getElementById('dataPrimeiraParcela').value = new Date().toISOString().split('T')[0];
  abrirModal('modalParcelasOrcamento');
}

async function gerarParcelas() {
  const orcamentoId = document.getElementById('parcelasOrcamentoId').value;
  const qtd = parseInt(document.getElementById('qtdParcelas').value);
  const data = document.getElementById('dataPrimeiraParcela').value;
  await apiFetch('/api/orcamentos/' + orcamentoId + '/gerar-parcelas', {
    method: 'POST',
    body: JSON.stringify({ quantidade_parcelas: qtd, data_primeira_parcela: data })
  });
  fecharModal('modalParcelasOrcamento');
  alert('Parcelas geradas com sucesso!');
}

// ==================== RELATORIOS ====================
async function carregarRelatorios() {
  const dados = await apiFetch('/api/relatorios/resumo');
  const faturamento = await apiFetch('/api/relatorios/faturamento-mensal');

  document.getElementById('resumoRelatorios').innerHTML = `
    <div class="card-stat primary">
      <div class="stat-label">Hoje</div>
      <div class="stat-value">${dados.hoje.total} orcamentos</div>
      <div class="stat-sub">${formatarMoeda(dados.hoje.valor)}</div>
    </div>
    <div class="card-stat info">
      <div class="stat-label">Semana</div>
      <div class="stat-value">${dados.semana.total} orcamentos</div>
      <div class="stat-sub">${formatarMoeda(dados.semana.valor)}</div>
    </div>
    <div class="card-stat warning">
      <div class="stat-label">Mes</div>
      <div class="stat-value">${dados.mes.total} orcamentos</div>
      <div class="stat-sub">${formatarMoeda(dados.mes.valor)}</div>
    </div>
    <div class="card-stat success">
      <div class="stat-label">Ano</div>
      <div class="stat-value">${dados.ano.total} orcamentos</div>
      <div class="stat-sub">${formatarMoeda(dados.ano.valor)}</div>
    </div>
    <div class="card-stat success">
      <div class="stat-label">Executados (Mes)</div>
      <div class="stat-value">${dados.mes.executados}</div>
      <div class="stat-sub">${formatarMoeda(dados.mes.valorExecutados)}</div>
    </div>
  `;

  let statusHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">';
  dados.porStatus.forEach(s => {
    statusHtml += `<div style="text-align:center;padding:16px;border-radius:8px;background:#f8f9fa;">
      ${statusBadge(s.status)}
      <div style="font-size:1.4rem;font-weight:700;margin:8px 0;">${s.total}</div>
      <div style="color:#666;font-size:0.85rem;">${formatarMoeda(s.valor)}</div>
    </div>`;
  });
  statusHtml += '</div>';

  if (faturamento.length > 0) {
    statusHtml += '<div class="section-divider" style="margin-top:24px;">Faturamento Mensal</div>';
    statusHtml += '<table class="table-custom" style="margin-top:12px;"><thead><tr><th>Mes</th><th>Orcamentos</th><th>Valor</th></tr></thead><tbody>';
    faturamento.forEach(f => {
      const [ano, mes] = f.mes.split('-');
      const nomeMes = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      statusHtml += `<tr><td>${nomeMes}</td><td>${f.total}</td><td><strong>${formatarMoeda(f.valor)}</strong></td></tr>`;
    });
    statusHtml += '</tbody></table>';
  }

  document.getElementById('relatorioStatus').innerHTML = statusHtml;
}

// ==================== PDF ====================
async function gerarPDF(id) {
  const o = await apiFetch('/api/orcamentos/' + id);
  await carregarConfigParaPDF();
  criarPDF(o);
}

function gerarPDFAtual() {
  if (orcamentoAtual) criarPDF(orcamentoAtual);
}

function criarPDF(o) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let startY = 14;

  const temLogo = configEmpresa.logo && configEmpresa.logo.length > 10;
  const temEmpresa = configEmpresa.nome_empresa || configEmpresa.cpf_cnpj || configEmpresa.email || configEmpresa.telefone;

  if (temLogo) {
    try { doc.addImage(configEmpresa.logo, 'AUTO', 14, startY, 50, 30); } catch(e) {}
    if (temEmpresa) {
      let infoY = startY + 5;
      doc.setFontSize(10);
      doc.setTextColor(50);
      if (configEmpresa.nome_empresa) { doc.setFont(undefined, 'bold'); doc.text(configEmpresa.nome_empresa, 72, infoY); doc.setFont(undefined, 'normal'); infoY += 5; }
      if (configEmpresa.cpf_cnpj) { doc.text('CPF/CNPJ: ' + configEmpresa.cpf_cnpj, 72, infoY); infoY += 5; }
      if (configEmpresa.telefone) { doc.text('Tel: ' + configEmpresa.telefone, 72, infoY); infoY += 5; }
      if (configEmpresa.email) { doc.text('Email: ' + configEmpresa.email, 72, infoY); infoY += 5; }
      startY = Math.max(startY + 34, infoY + 4);
    } else {
      startY = startY + 36;
    }
  } else if (temEmpresa) {
    doc.setFontSize(12);
    doc.setTextColor(26, 35, 126);
    if (configEmpresa.nome_empresa) { doc.setFont(undefined, 'bold'); doc.text(configEmpresa.nome_empresa, 14, startY + 6); doc.setFont(undefined, 'normal'); startY += 10; }
    doc.setFontSize(9);
    doc.setTextColor(80);
    let linha2 = [];
    if (configEmpresa.cpf_cnpj) linha2.push('CPF/CNPJ: ' + configEmpresa.cpf_cnpj);
    if (configEmpresa.telefone) linha2.push('Tel: ' + configEmpresa.telefone);
    if (configEmpresa.email) linha2.push('Email: ' + configEmpresa.email);
    if (linha2.length > 0) { doc.text(linha2.join('  |  '), 14, startY + 4); startY += 10; }
  }

  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.5);
  doc.line(14, startY, 196, startY);
  startY += 8;

  doc.setFontSize(18);
  doc.setTextColor(26, 35, 126);
  doc.text('ORCAMENTO #' + o.id, 14, startY + 4);
  startY += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Data: ' + formatarData(o.data_orcamento), 14, startY + 4);
  if (o.data_validade) doc.text('Validade: ' + formatarData(o.data_validade), 110, startY + 4);
  startY += 10;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, startY, 196, startY);
  startY += 8;

  doc.setFontSize(11);
  doc.setTextColor(26, 35, 126);
  doc.text('CLIENTE', 14, startY);
  startY += 6;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(o.cliente_nome, 14, startY);
  startY += 5;
  if (o.cliente_cpf_cnpj) { doc.setFontSize(9); doc.setTextColor(80); doc.text('CPF/CNPJ: ' + o.cliente_cpf_cnpj, 14, startY); startY += 5; }
  if (o.cliente_telefone) { doc.setFontSize(9); doc.text('Telefone: ' + o.cliente_telefone, 14, startY); startY += 5; }
  if (o.cliente_email) { doc.setFontSize(9); doc.text('Email: ' + o.cliente_email, 14, startY); startY += 5; }
  if (o.cliente_endereco) { doc.setFontSize(9); doc.text('Endereco: ' + o.cliente_endereco, 14, startY); startY += 5; }
  startY += 4;

  doc.setDrawColor(200);
  doc.line(14, startY, 196, startY);
  startY += 8;

  doc.setFontSize(12);
  doc.setTextColor(26, 35, 126);
  doc.text('SERVICO: ' + o.titulo, 14, startY);
  startY += 6;
  if (o.descricao) {
    doc.setFontSize(9);
    doc.setTextColor(60);
    const linhas = doc.splitTextToSize(o.descricao, 180);
    doc.text(linhas, 14, startY);
    startY += linhas.length * 5 + 4;
  }

  if (o.itens && o.itens.length > 0) {
    doc.autoTable({
      startY: startY,
      head: [['Item', 'Qtd', 'Valor Unit.', 'Total']],
      body: o.itens.map(i => [i.descricao, i.quantidade, formatarMoeda(i.valor_unitario), formatarMoeda(i.valor_total)]),
      foot: [['', '', 'TOTAL:', formatarMoeda(o.valor_total)]],
      theme: 'grid',
      headStyles: { fillColor: [26, 35, 126] },
      footStyles: { fillColor: [232, 234, 246], textColor: [26, 35, 126], fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 9 },
      margin: { left: 14 }
    });
    startY = doc.lastAutoTable.finalY + 10;
  }

  if (o.observacoes) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Observacoes: ' + o.observacoes, 14, startY);
  }

  doc.setFontSize(7);
  doc.setTextColor(170);
  doc.text('Gerado por OrcaFacil - ' + new Date().toLocaleDateString('pt-BR'), 14, 290);

  doc.save('orcamento-' + o.id + '.pdf');
}

// ==================== WHATSAPP ====================
async function enviarWhatsApp(id) {
  const o = await apiFetch('/api/orcamentos/' + id);
  enviarWhatsAppComDados(o);
}

function enviarWhatsAppAtual() {
  if (orcamentoAtual) enviarWhatsAppComDados(orcamentoAtual);
}

function enviarWhatsAppComDados(o) {
  let msg = `*ORCAMENTO #${o.id}*\n\n`;
  msg += `Cliente: ${o.cliente_nome}\n`;
  msg += `Servico: ${o.titulo}\n`;
  if (o.descricao) msg += `Descricao: ${o.descricao}\n`;
  msg += `\n*Valor Total: ${formatarMoeda(o.valor_total)}*\n`;
  if (o.data_validade) msg += `Validade: ${formatarData(o.data_validade)}\n`;
  if (o.itens && o.itens.length > 0) {
    msg += `\n*Itens:*\n`;
    o.itens.forEach(i => { msg += `- ${i.descricao}: ${i.quantidade}x ${formatarMoeda(i.valor_unitario)} = ${formatarMoeda(i.valor_total)}\n`; });
  }
  msg += `\nAguardamos seu retorno!`;
  const telefone = (o.cliente_telefone || '').replace(/\D/g, '');
  const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ==================== EMAIL ====================
function enviarEmailAtual() {
  if (!orcamentoAtual) return;
  const email = orcamentoAtual.cliente_email;
  if (!email) { alert('Cliente nao possui email cadastrado!'); return; }
  let msg = `Orcamento #${orcamentoAtual.id} - ${orcamentoAtual.titulo}\n\n`;
  msg += `Cliente: ${orcamentoAtual.cliente_nome}\n`;
  if (orcamentoAtual.descricao) msg += `Descricao: ${orcamentoAtual.descricao}\n`;
  msg += `\nValor Total: ${formatarMoeda(orcamentoAtual.valor_total)}\n`;
  if (orcamentoAtual.data_validade) msg += `Validade: ${formatarData(orcamentoAtual.data_validade)}\n`;
  const assunto = encodeURIComponent(`Orcamento #${orcamentoAtual.id} - ${orcamentoAtual.titulo}`);
  const corpo = encodeURIComponent(msg);
  window.open(`mailto:${email}?subject=${assunto}&body=${corpo}`, '_blank');
}

// ==================== CONFIGURACOES ====================
async function carregarConfiguracoes() {
  configEmpresa = await apiFetch('/api/configuracoes');
  document.getElementById('cfgNome').value = configEmpresa.nome_empresa || '';
  document.getElementById('cfgCpfCnpj').value = configEmpresa.cpf_cnpj || '';
  document.getElementById('cfgTelefone').value = configEmpresa.telefone || '';
  document.getElementById('cfgEmail').value = configEmpresa.email || '';

  const preview = document.getElementById('logoPreview');
  const btnRemover = document.getElementById('btnRemoverLogo');
  if (configEmpresa.logo) {
    preview.innerHTML = '<img src="' + configEmpresa.logo + '" style="max-height:80px;max-width:250px;border:1px solid #ddd;border-radius:8px;padding:8px;background:#fafafa;">';
    btnRemover.style.display = 'inline-block';
  } else {
    preview.innerHTML = '<div style="width:120px;height:80px;border:2px dashed #ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:0.8rem;">Sem logo</div>';
    btnRemover.style.display = 'none';
  }
}

function carregarLogo(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande! Maximo 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    configEmpresa.logo = e.target.result;
    document.getElementById('logoPreview').innerHTML = '<img src="' + e.target.result + '" style="max-height:80px;max-width:250px;border:1px solid #ddd;border-radius:8px;padding:8px;background:#fafafa;">';
    document.getElementById('btnRemoverLogo').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function removerLogo() {
  configEmpresa.logo = '';
  document.getElementById('logoPreview').innerHTML = '<div style="width:120px;height:80px;border:2px dashed #ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:0.8rem;">Sem logo</div>';
  document.getElementById('btnRemoverLogo').style.display = 'none';
}

async function salvarConfiguracoes() {
  configEmpresa.nome_empresa = document.getElementById('cfgNome').value;
  configEmpresa.cpf_cnpj = document.getElementById('cfgCpfCnpj').value;
  configEmpresa.telefone = document.getElementById('cfgTelefone').value;
  configEmpresa.email = document.getElementById('cfgEmail').value;
  await apiFetch('/api/configuracoes', { method: 'PUT', body: JSON.stringify(configEmpresa) });
  alert('Dados salvos com sucesso!');
}

async function carregarConfigParaPDF() {
  if (!configEmpresa.nome_empresa && !configEmpresa.logo) {
    configEmpresa = await apiFetch('/api/configuracoes');
  }
}

// ==================== INIT ====================
async function initApp() {
  await carregarConfigParaPDF();
  carregarDashboard();
}

// Verificar sessao ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
});

// Enter pra login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (document.getElementById('auth-landing').classList.contains('active')) {
      fazerLogin();
    } else if (document.getElementById('auth-registro').classList.contains('active')) {
      fazerRegistro();
    }
  }
});
