/* ============================================================
   ddd.js — LeadClean v3.0
   Responsável por: extração de DDD, mapeamento para estados,
   visualizações (cartograma, barras, donut) e exportação.
   ============================================================ */

let dddData = [], dddHeaders = [], dddWorkbook = null, dddSheetName = '';
let dddResultMap = null;

/* ── Mapa DDD → UF ── */
const DDD_MAP = {
  // AC
  '68': 'AC',
  // AL
  '82': 'AL',
  // AM
  '92': 'AM', '97': 'AM',
  // AP
  '96': 'AP',
  // BA
  '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
  // CE
  '85': 'CE', '88': 'CE',
  // DF
  '61': 'DF',
  // ES
  '27': 'ES', '28': 'ES',
  // GO
  '62': 'GO', '64': 'GO',
  // MA
  '98': 'MA', '99': 'MA',
  // MG
  '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG',
  '35': 'MG', '37': 'MG', '38': 'MG',
  // MS
  '67': 'MS',
  // MT
  '65': 'MT', '66': 'MT',
  // PA
  '91': 'PA', '93': 'PA', '94': 'PA',
  // PB
  '83': 'PB',
  // PE
  '81': 'PE', '87': 'PE',
  // PI
  '86': 'PI', '89': 'PI',
  // PR
  '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
  // RJ
  '21': 'RJ', '22': 'RJ', '24': 'RJ',
  // RN
  '84': 'RN',
  // RO
  '69': 'RO',
  // RR
  '95': 'RR',
  // RS
  '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
  // SC
  '47': 'SC', '48': 'SC', '49': 'SC',
  // SE
  '79': 'SE',
  // SP
  '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP',
  '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
  // TO
  '63': 'TO',
};

/* ── Mapa UF → Nome completo ── */
const ESTADO_NOME = {
  'AC': 'Acre',               'AL': 'Alagoas',
  'AM': 'Amazonas',           'AP': 'Amapá',
  'BA': 'Bahia',              'CE': 'Ceará',
  'DF': 'Distrito Federal',   'ES': 'Espírito Santo',
  'GO': 'Goiás',              'MA': 'Maranhão',
  'MG': 'Minas Gerais',       'MS': 'Mato Grosso do Sul',
  'MT': 'Mato Grosso',        'PA': 'Pará',
  'PB': 'Paraíba',            'PE': 'Pernambuco',
  'PI': 'Piauí',              'PR': 'Paraná',
  'RJ': 'Rio de Janeiro',     'RN': 'Rio Grande do Norte',
  'RO': 'Rondônia',           'RR': 'Roraima',
  'RS': 'Rio Grande do Sul',  'SC': 'Santa Catarina',
  'SE': 'Sergipe',            'SP': 'São Paulo',
  'TO': 'Tocantins',
};

/* ── Mapa UF → Região ── */
const UF_REGIAO = {
  'AC': 'Norte',   'AP': 'Norte',   'AM': 'Norte',   'PA': 'Norte',
  'RO': 'Norte',   'RR': 'Norte',   'TO': 'Norte',
  'AL': 'Nordeste','BA': 'Nordeste','CE': 'Nordeste','MA': 'Nordeste',
  'PB': 'Nordeste','PE': 'Nordeste','PI': 'Nordeste','RN': 'Nordeste','SE': 'Nordeste',
  'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
  'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  'PR': 'Sul',     'RS': 'Sul',     'SC': 'Sul',
};

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const REGIAO_COR = {
  'Norte':        'var(--reg-n)',
  'Nordeste':     'var(--reg-ne)',
  'Centro-Oeste': 'var(--reg-co)',
  'Sudeste':      'var(--reg-se)',
  'Sul':          'var(--reg-s)',
};

/* ── Layout do cartograma (7 colunas) ── */
const CARTOGRAMA = [
  ['',   '',   'RR', 'AP', '',   '',   ''  ],
  ['',   '',   'AM', 'PA', 'MA', 'CE', 'RN'],
  ['AC', 'RO', 'MT', 'TO', 'PI', 'PE', 'PB'],
  ['',   '',   'MS', 'GO', 'BA', 'AL', 'SE'],
  ['',   '',   '',   'DF', 'MG', 'ES', ''  ],
  ['',   '',   'PR', 'SP', 'RJ', '',   ''  ],
  ['',   '',   'SC', '',   '',   '',   ''  ],
  ['',   '',   'RS', '',   '',   '',   ''  ],
];

/* ============================================================
   Extração de DDD
   Um export de CRM/WhatsApp traz "5511987654321"; sem tratar o
   código do país o DDD vira "55" e o lead é contado como RS.
   ============================================================ */
function extractDDD(val) {
  if (val === null || val === undefined) return { ddd: null, motivo: 'vazio' };

  let s = String(val).replace(/\D/g, '');
  if (s.length === 0) return { ddd: null, motivo: 'vazio' };

  // Zero(s) de operadora no formato 0XX / 00 55 XX
  if (s.length > 2) s = s.replace(/^0+/, '');

  // Código do país (+55) em números completos
  if ((s.length === 12 || s.length === 13) && s.startsWith('55')) s = s.slice(2);

  // Aceita apenas telefone completo com DDD (10 ou 11) ou o DDD isolado (2)
  if (s.length !== 2 && s.length !== 10 && s.length !== 11) {
    return { ddd: null, motivo: 'sem_ddd' };
  }

  const ddd = s.slice(0, 2);
  // Não existe DDD começando ou terminando em 0
  if (ddd[0] === '0' || ddd[1] === '0') return { ddd: null, motivo: 'sem_ddd' };

  return { ddd, motivo: null };
}

/* ── Drop zone DDD ── */
setupDropZone('dropZoneDDD', 'fileInputDDD', handleDDDFile);

/* ── Leitura do arquivo ── */
function handleDDDFile(file) {
  setDropLoading('dropZoneDDD', true);

  readSpreadsheet(file, res => {
    setDropLoading('dropZoneDDD', false);

    dddWorkbook  = res.workbook;
    dddSheetName = res.sheetName;
    dddHeaders   = res.headers;
    dddData      = res.rows;
    dddResultMap = null;

    document.getElementById('dropZoneDDD').classList.add('hidden');
    document.getElementById('fileLoadedDDD').classList.remove('hidden');
    document.getElementById('fileNameDDD').textContent =
      `${file.name} · ${dddData.length} linhas · ${dddHeaders.length} colunas`;

    popularSelectColunas();

    document.getElementById('cardDDDConfig').classList.remove('hidden');
    document.getElementById('cardDDDConfig').classList.add('fade-up');
    document.getElementById('cardDDDPlaceholder').classList.add('hidden');

    const sel = document.getElementById('dddColSelect');
    if (sel.value !== '') runDDDAnalysis();
    else showToast('Nenhuma coluna de telefone detectada — selecione manualmente', 'info');

  }, err => {
    setDropLoading('dropZoneDDD', false);
    document.getElementById('fileInputDDD').value = '';
    showToast('Erro ao ler o arquivo: ' + err.message, 'danger', 6000);
  });
}

/* ── Auto-detecção da coluna de telefone ──
   Cabeçalhos mais específicos ganham; empate resolve pela
   primeira ocorrência (antes a última vencia silenciosamente). */
const PADROES_TELEFONE = [
  { re: /\bddd\b/i,                     peso: 5 },
  { re: /celular|whatsapp|whats|movel/i, peso: 4 },
  { re: /telefone|fone|phone|mobile/i,  peso: 3 },
  { re: /contato|tel\b/i,               peso: 2 },
];

function popularSelectColunas() {
  const sel = document.getElementById('dddColSelect');
  sel.innerHTML = '<option value="">— selecione —</option>';

  let melhor = { idx: -1, peso: 0 };

  dddHeaders.forEach((h, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = h;
    sel.appendChild(opt);

    const match = PADROES_TELEFONE.find(p => p.re.test(h));
    if (match && match.peso > melhor.peso) melhor = { idx: i, peso: match.peso };
  });

  if (melhor.idx >= 0) sel.value = String(melhor.idx);
}

/* ── Reset ── */
function resetDDD() {
  document.getElementById('fileInputDDD').value = '';
  dddData      = [];
  dddHeaders   = [];
  dddWorkbook  = null;
  dddSheetName = '';
  dddResultMap = null;

  document.getElementById('dropZoneDDD').classList.remove('hidden');
  document.getElementById('fileLoadedDDD').classList.add('hidden');
  document.getElementById('cardDDDConfig').classList.add('hidden');
  document.getElementById('cardDDDResults').classList.add('hidden');
  document.getElementById('cardDDDPlaceholder').classList.remove('hidden');
  document.getElementById('dddUnknownNote').classList.add('hidden');

  document.getElementById('dddColSelect').innerHTML = '<option value="">— selecione —</option>';
  document.getElementById('dddTableWrap').innerHTML = '';
  document.getElementById('cartogram').innerHTML    = '';
  document.getElementById('barsChart').innerHTML    = '';
  document.getElementById('donutHolder').innerHTML  = '';
  document.getElementById('donutLegend').innerHTML  = '';
  ['dddTotal', 'dddIdent', 'dddEstados', 'dddTopEstado'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });
}

/* ── Análise ── */
function runDDDAnalysis() {
  const colIdx = document.getElementById('dddColSelect').value;
  if (colIdx === '' || dddData.length === 0) return;

  const idx = parseInt(colIdx, 10);
  const estadoCount = {};
  const dddCount    = {};
  const unknownDDDs = new Set();
  // Os três casos abaixo eram somados num contador único, escondendo
  // do usuário que boa parte da base podia estar sem telefone válido.
  let semTelefone = 0, semDDD = 0, dddInvalido = 0;

  dddData.forEach(row => {
    const { ddd, motivo } = extractDDD(row[idx]);

    if (!ddd) {
      if (motivo === 'vazio') semTelefone++; else semDDD++;
      return;
    }

    const estado = DDD_MAP[ddd];
    if (!estado) {
      dddInvalido++;
      unknownDDDs.add(ddd);
      return;
    }

    estadoCount[estado] = (estadoCount[estado] || 0) + 1;
    if (!dddCount[estado]) dddCount[estado] = {};
    dddCount[estado][ddd] = (dddCount[estado][ddd] || 0) + 1;
  });

  const naoIdentificados = semTelefone + semDDD + dddInvalido;
  const total      = dddData.length;
  const identified = total - naoIdentificados;
  const sorted     = Object.entries(estadoCount).sort((a, b) => b[1] - a[1]);

  dddResultMap = {
    estadoCount, dddCount, unknownDDDs, sorted, total, identified,
    semTelefone, semDDD, dddInvalido,
  };

  /* Stats */
  animateCount('dddTotal',   total);
  animateCount('dddIdent',   identified);
  animateCount('dddEstados', sorted.length);
  document.getElementById('dddTopEstado').textContent  = sorted.length > 0 ? sorted[0][0] : '—';
  document.getElementById('dddSourceNote').textContent = `coluna: ${dddHeaders[idx]}`;

  renderCartograma();
  renderBarras();
  renderDonut();
  renderDDDTable();
  renderNotaNaoIdentificados();

  document.getElementById('cardDDDResults').classList.remove('hidden');
  document.getElementById('cardDDDResults').classList.add('fade-up');
}

/* ============================================================
   Cartograma — grade de quadrados no formato aproximado do país
   ============================================================ */
function renderCartograma() {
  const { estadoCount, identified, sorted } = dddResultMap;
  const max = sorted.length > 0 ? sorted[0][1] : 0;
  const grid = document.getElementById('cartogram');
  grid.innerHTML = '';

  CARTOGRAMA.forEach(linha => {
    linha.forEach(uf => {
      const cel = document.createElement('div');

      if (!uf) {
        cel.className = 'tile tile-empty';
        grid.appendChild(cel);
        return;
      }

      const count = estadoCount[uf] || 0;
      const nivel = count === 0 || max === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 5));
      const pct   = identified > 0 ? ((count / identified) * 100).toFixed(1) : '0.0';

      cel.className = `tile lv${nivel}`;
      cel.textContent = uf;
      cel.tabIndex = 0;
      cel.setAttribute('role', 'img');
      cel.setAttribute('aria-label',
        `${ESTADO_NOME[uf]}: ${count.toLocaleString('pt-BR')} leads, ${pct}%`);

      const tip = `<strong>${escapeHtml(ESTADO_NOME[uf])}</strong>` +
                  `<span>${count.toLocaleString('pt-BR')} leads · ${pct}%</span>`;

      const mostrar = e => {
        const r = cel.getBoundingClientRect();
        showTooltip(tip, r.left + r.width / 2, r.top);
      };
      cel.addEventListener('mouseenter', mostrar);
      cel.addEventListener('focus', mostrar);
      cel.addEventListener('mouseleave', hideTooltip);
      cel.addEventListener('blur', hideTooltip);

      grid.appendChild(cel);
    });
  });
}

/* ============================================================
   Barras — Top 10 estados
   ============================================================ */
function renderBarras() {
  const { sorted, identified } = dddResultMap;
  const top = sorted.slice(0, 10);
  const max = top.length > 0 ? top[0][1] : 1;
  const wrap = document.getElementById('barsChart');

  if (top.length === 0) {
    wrap.innerHTML = '<div class="table-empty">Nenhum estado identificado.</div>';
    return;
  }

  wrap.innerHTML = top.map(([uf, count], i) => {
    const pct    = identified > 0 ? ((count / identified) * 100).toFixed(1) : '0.0';
    const barPct = Math.round((count / max) * 100);
    return `
      <div class="bar-row" style="--delay:${i * 45}ms">
        <div class="bar-uf" title="${escapeHtml(ESTADO_NOME[uf] || uf)}">${uf}</div>
        <div class="bar-track">
          <div class="bar-fill" data-pct="${barPct}"></div>
        </div>
        <div class="bar-val">${count.toLocaleString('pt-BR')}<span class="bar-pct">${pct}%</span></div>
      </div>`;
  }).join('');

  animarBarras();
}

/* Aplica as larguras — chamado também ao reexibir o painel */
function animarBarras() {
  document.querySelectorAll('#barsChart .bar-fill').forEach(el => {
    el.style.width = el.dataset.pct + '%';
  });
}

/* ============================================================
   Donut — distribuição por região
   ============================================================ */
function renderDonut() {
  const { estadoCount, identified } = dddResultMap;

  const regiaoCount = {};
  REGIOES.forEach(r => { regiaoCount[r] = 0; });
  Object.entries(estadoCount).forEach(([uf, n]) => {
    const r = UF_REGIAO[uf];
    if (r) regiaoCount[r] += n;
  });

  const holder = document.getElementById('donutHolder');
  const legend = document.getElementById('donutLegend');

  if (identified === 0) {
    holder.innerHTML = '<div class="table-empty">Sem dados identificados.</div>';
    legend.innerHTML = '';
    return;
  }

  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  let segmentos = '';

  REGIOES.forEach(r => {
    const n = regiaoCount[r];
    if (n === 0) return;
    const frac = n / identified;
    const len  = frac * C;
    segmentos += `<circle class="donut-seg" cx="70" cy="70" r="${R}"
        stroke="${REGIAO_COR[r]}"
        stroke-dasharray="${len} ${C - len}"
        stroke-dashoffset="${-offset}"></circle>`;
    offset += len;
  });

  holder.innerHTML = `
    <svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Distribuição de leads por região">
      <circle class="donut-bg" cx="70" cy="70" r="${R}"></circle>
      ${segmentos}
    </svg>
    <div class="donut-center">
      <div class="donut-center-num">${identified.toLocaleString('pt-BR')}</div>
      <div class="donut-center-lbl">leads</div>
    </div>`;

  legend.innerHTML = REGIOES.map(r => {
    const n   = regiaoCount[r];
    const pct = ((n / identified) * 100).toFixed(1);
    return `
      <div class="donut-legend-row${n === 0 ? ' is-zero' : ''}">
        <span class="donut-dot" style="background:${REGIAO_COR[r]}"></span>
        <span class="donut-reg">${r}</span>
        <span class="donut-num">${n.toLocaleString('pt-BR')}</span>
        <span class="donut-pct">${pct}%</span>
      </div>`;
  }).join('');
}

/* ============================================================
   Tabela detalhada
   ============================================================ */
function renderDDDTable() {
  const { sorted, dddCount, identified } = dddResultMap;
  const max = sorted.length > 0 ? sorted[0][1] : 1;

  let html = `<table><thead><tr>
    <th style="width:35px">#</th>
    <th>Estado</th>
    <th>Leads</th>
    <th style="width:140px">Distribuição</th>
    <th>%</th>
    <th>DDDs</th>
  </tr></thead><tbody>`;

  sorted.forEach(([uf, count], i) => {
    const pct    = identified > 0 ? ((count / identified) * 100).toFixed(1) : '0.0';
    const barPct = Math.round((count / max) * 100);
    const ddds   = Object.keys(dddCount[uf] || {}).sort().join(', ');

    html += `<tr>
      <td><span class="rank-num">${i + 1}</span></td>
      <td>
        <span class="estado-badge">${uf}</span>
        <span class="estado-nome"> ${escapeHtml(ESTADO_NOME[uf] || '')}</span>
      </td>
      <td class="num-cell">${count.toLocaleString('pt-BR')}</td>
      <td class="bar-cell">
        <div class="bar-track"><div class="bar-fill" style="width:${barPct}%"></div></div>
      </td>
      <td><span class="pct-badge">${pct}%</span></td>
      <td class="ddd-list">${ddds}</td>
    </tr>`;
  });

  html += '</tbody></table>';

  if (sorted.length === 0) {
    html = '<div class="table-empty">Nenhum estado identificado nessa coluna.</div>';
  }

  document.getElementById('dddTableWrap').innerHTML = html;
}

/* ── Nota discriminando os não identificados ── */
function renderNotaNaoIdentificados() {
  const { semTelefone, semDDD, dddInvalido, unknownDDDs } = dddResultMap;
  const noteEl = document.getElementById('dddUnknownNote');
  const total  = semTelefone + semDDD + dddInvalido;

  if (total === 0) {
    noteEl.classList.add('hidden');
    noteEl.textContent = '';
    return;
  }

  const partes = [];
  if (semTelefone) partes.push(`${semTelefone.toLocaleString('pt-BR')} sem telefone preenchido`);
  if (semDDD)      partes.push(`${semDDD.toLocaleString('pt-BR')} sem DDD no número`);
  if (dddInvalido) {
    const lista = [...unknownDDDs].sort().join(', ');
    partes.push(`${dddInvalido.toLocaleString('pt-BR')} com DDD inexistente (${lista})`);
  }

  noteEl.classList.remove('hidden');
  noteEl.textContent = `⚠ ${total.toLocaleString('pt-BR')} lead(s) fora da análise · ` + partes.join(' · ');
}

/* ── Exportar relatório ── */
function exportDDDReport() {
  if (!dddResultMap) return;

  const { sorted, dddCount, identified, total, semTelefone, semDDD, dddInvalido } = dddResultMap;

  const rows = [['#', 'UF', 'Estado', 'Região', 'Leads', '% do total identificado', 'DDDs']];
  sorted.forEach(([uf, count], i) => {
    const pct  = identified > 0 ? ((count / identified) * 100).toFixed(2) + '%' : '0%';
    const ddds = Object.keys(dddCount[uf] || {}).sort().join(', ');
    rows.push([i + 1, uf, ESTADO_NOME[uf] || '', UF_REGIAO[uf] || '', count, pct, ddds]);
  });

  rows.push([]);
  rows.push(['', '', 'Total identificado',        '', identified,  '', '']);
  rows.push(['', '', 'Sem telefone preenchido',   '', semTelefone, '', '']);
  rows.push(['', '', 'Sem DDD no número',         '', semDDD,      '', '']);
  rows.push(['', '', 'DDD inexistente',           '', dddInvalido, '', '']);
  rows.push(['', '', 'Total geral',               '', total,       '', '']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads por Estado');
  XLSX.writeFile(wb, 'leads_por_estado.xlsx');
  showToast('Relatório exportado', 'success');
}
