/* ============================================================
   ddd.js — LeadClean v2.0
   Responsável por: leitura de arquivo, extração de DDD,
   mapeamento para estados brasileiros e exportação do relatório.
   ============================================================ */

let dddData = [], dddHeaders = [], dddWorkbook, dddSheetName;
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

/* ── Extrair DDD de uma string de telefone ── */
function extractDDD(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).replace(/\D/g, ''); // somente dígitos
  if (s.length === 0) return null;
  // Remove zero inicial (formato 0XX)
  const cleaned = s.startsWith('0') ? s.slice(1) : s;
  if (cleaned.length < 2) return null;
  return cleaned.slice(0, 2);
}

/* ── Drop zone DDD ── */
const dropZoneDDD  = document.getElementById('dropZoneDDD');
const fileInputDDD = document.getElementById('fileInputDDD');

dropZoneDDD.addEventListener('click', () => fileInputDDD.click());
dropZoneDDD.addEventListener('dragover', e => { e.preventDefault(); dropZoneDDD.classList.add('dragover'); });
dropZoneDDD.addEventListener('dragleave', () => dropZoneDDD.classList.remove('dragover'));
dropZoneDDD.addEventListener('drop', e => {
  e.preventDefault();
  dropZoneDDD.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleDDDFile(e.dataTransfer.files[0]);
});
fileInputDDD.addEventListener('change', () => {
  if (fileInputDDD.files[0]) handleDDDFile(fileInputDDD.files[0]);
});

/* ── Leitura do arquivo DDD ── */
function handleDDDFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = new Uint8Array(e.target.result);
      dddWorkbook  = XLSX.read(data, { type: 'array' });
      dddSheetName = dddWorkbook.SheetNames[0];

      const sheet = dddWorkbook.Sheets[dddSheetName];
      const json  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (json.length < 2) { alert('Arquivo vazio ou sem linhas de dados.'); return; }

      dddHeaders = json[0].map((h, i) => h !== '' ? String(h) : `Coluna_${i + 1}`);
      dddData    = json.slice(1).filter(r => r.some(c => c !== ''));

      document.getElementById('dropZoneDDD').classList.add('hidden');
      document.getElementById('fileLoadedDDD').classList.remove('hidden');
      document.getElementById('fileNameDDD').textContent =
        `${file.name} · ${dddData.length} linhas · ${dddHeaders.length} colunas`;

      // Popular select de colunas
      const sel = document.getElementById('dddColSelect');
      sel.innerHTML = '<option value="">— selecione —</option>';
      dddHeaders.forEach((h, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = h;
        // Auto-selecionar coluna provável de telefone
        if (/tel|fone|celular|whatsapp|ddd|phone|mobile|contato/i.test(h)) opt.selected = true;
        sel.appendChild(opt);
      });

      document.getElementById('cardDDDConfig').classList.remove('hidden');
      document.getElementById('cardDDDConfig').classList.add('fade-up');
      document.getElementById('cardDDDPlaceholder').classList.add('hidden');

      // Rodar análise automaticamente se encontrou coluna provável
      if (sel.value !== '') runDDDAnalysis();

    } catch (err) {
      alert('Erro ao ler o arquivo: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ── Reset DDD ── */
function resetDDD() {
  fileInputDDD.value = '';
  dddData      = [];
  dddHeaders   = [];
  dddResultMap = null;

  document.getElementById('dropZoneDDD').classList.remove('hidden');
  document.getElementById('fileLoadedDDD').classList.add('hidden');
  document.getElementById('cardDDDConfig').classList.add('hidden');
  document.getElementById('cardDDDResults').classList.add('hidden');
  document.getElementById('cardDDDPlaceholder').classList.remove('hidden');
  document.getElementById('dddUnknownNote').classList.add('hidden');
}

/* ── Rodar análise de DDD ── */
function runDDDAnalysis() {
  const colIdx = document.getElementById('dddColSelect').value;
  if (colIdx === '' || dddData.length === 0) return;

  const idx = parseInt(colIdx);
  const estadoCount = {};
  const dddCount    = {};
  let unknownCount  = 0;
  const unknownDDDs = new Set();

  dddData.forEach(row => {
    const ddd    = extractDDD(row[idx]);
    if (!ddd) { unknownCount++; return; }

    const estado = DDD_MAP[ddd];
    if (!estado) {
      unknownCount++;
      unknownDDDs.add(ddd);
      return;
    }

    estadoCount[estado] = (estadoCount[estado] || 0) + 1;
    if (!dddCount[estado]) dddCount[estado] = {};
    dddCount[estado][ddd] = (dddCount[estado][ddd] || 0) + 1;
  });

  dddResultMap = { estadoCount, dddCount, unknownCount, unknownDDDs };

  const sorted     = Object.entries(estadoCount).sort((a, b) => b[1] - a[1]);
  const total      = dddData.length;
  const identified = total - unknownCount;
  const topEstado  = sorted.length > 0 ? sorted[0][0] : '—';

  // Atualizar stats
  document.getElementById('dddTotal').textContent    = total.toLocaleString('pt-BR');
  document.getElementById('dddEstados').textContent  = sorted.length;
  document.getElementById('dddTopEstado').textContent = topEstado;
  document.getElementById('dddSourceNote').textContent = `coluna: ${dddHeaders[idx]}`;

  // Renderizar tabela
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
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
    const barPct = Math.round((count / maxCount) * 100);
    const ddds   = Object.keys(dddCount[uf] || {}).sort().join(', ');

    html += `<tr>
      <td><span class="rank-num">${i + 1}</span></td>
      <td>
        <span class="estado-badge">${uf}</span>
        <span style="color:var(--text2);font-size:12px;"> ${ESTADO_NOME[uf] || ''}</span>
      </td>
      <td style="font-weight:600;color:var(--text);font-family:'DM Mono',monospace">
        ${count.toLocaleString('pt-BR')}
      </td>
      <td class="bar-cell">
        <div class="bar-track"><div class="bar-fill" style="width:${barPct}%"></div></div>
      </td>
      <td><span class="pct-badge">${pct}%</span></td>
      <td style="color:var(--text3);font-size:11px;font-family:'DM Mono',monospace">${ddds}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  document.getElementById('dddTableWrap').innerHTML = html;

  // Nota de não identificados
  const noteEl = document.getElementById('dddUnknownNote');
  if (unknownCount > 0) {
    const list = [...unknownDDDs].sort().join(', ');
    noteEl.classList.remove('hidden');
    noteEl.textContent = `⚠ ${unknownCount} lead(s) com DDD não identificado ou inválido` +
      (unknownDDDs.size > 0 ? ` · DDDs não reconhecidos: ${list}` : '');
  } else {
    noteEl.classList.add('hidden');
  }

  document.getElementById('cardDDDResults').classList.remove('hidden');
  document.getElementById('cardDDDResults').classList.add('fade-up');
}

/* ── Exportar relatório de estados ── */
function exportDDDReport() {
  if (!dddResultMap) return;

  const { estadoCount, dddCount, unknownCount } = dddResultMap;
  const total      = dddData.length;
  const identified = total - unknownCount;
  const sorted     = Object.entries(estadoCount).sort((a, b) => b[1] - a[1]);

  const rows = [['#', 'UF', 'Estado', 'Leads', '% do total identificado', 'DDDs']];
  sorted.forEach(([uf, count], i) => {
    const pct  = identified > 0 ? ((count / identified) * 100).toFixed(2) + '%' : '0%';
    const ddds = Object.keys(dddCount[uf] || {}).sort().join(', ');
    rows.push([i + 1, uf, ESTADO_NOME[uf] || '', count, pct, ddds]);
  });

  rows.push([]);
  rows.push(['', '', 'Total identificado', identified, '', '']);
  rows.push(['', '', 'Não identificado',   unknownCount, '', '']);
  rows.push(['', '', 'Total geral',        total, '', '']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 6 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads por Estado');
  XLSX.writeFile(wb, 'leads_por_estado.xlsx');
}
