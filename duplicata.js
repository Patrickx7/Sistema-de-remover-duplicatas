/* ============================================================
   duplicata.js — LeadClean v3.0
   Responsável por: detecção e remoção de duplicatas,
   preview em tabela e exportação dos arquivos resultantes.
   ============================================================ */

let allData = [], headers = [], selectedCols = new Set(), keepMode = 'first';
let workbook = null, sheetName = '', dupIdxsGlobal = null;

/* ── Drop zone ── */
setupDropZone('dropZone', 'fileInput', handleFile);

/* ── Leitura do arquivo ── */
function handleFile(file) {
  setDropLoading('dropZone', true);

  readSpreadsheet(file, res => {
    setDropLoading('dropZone', false);

    workbook  = res.workbook;
    sheetName = res.sheetName;
    headers   = res.headers;
    allData   = res.rows;
    selectedCols.clear();
    dupIdxsGlobal = null;

    document.getElementById('dropZone').classList.add('hidden');
    document.getElementById('fileLoaded').classList.remove('hidden');
    document.getElementById('fileName').textContent =
      `${file.name} · ${allData.length} linhas · ${headers.length} colunas`;

    document.getElementById('cardConfig').classList.remove('hidden');
    document.getElementById('cardConfig').classList.add('fade-up');
    document.getElementById('cardResults').classList.add('hidden');

    renderCols();
    setStep(2);
    showToast(`${allData.length.toLocaleString('pt-BR')} linhas carregadas`, 'success');
  }, err => {
    setDropLoading('dropZone', false);
    document.getElementById('fileInput').value = '';
    showToast('Erro ao ler o arquivo: ' + err.message, 'danger', 6000);
  });
}

/* ── Reset ── */
function resetFile() {
  document.getElementById('fileInput').value = '';

  allData = [];
  headers = [];
  selectedCols.clear();
  workbook = null;
  sheetName = '';
  dupIdxsGlobal = null;

  document.getElementById('dropZone').classList.remove('hidden');
  document.getElementById('fileLoaded').classList.add('hidden');
  document.getElementById('cardConfig').classList.add('hidden');
  document.getElementById('cardResults').classList.add('hidden');

  document.getElementById('colsGrid').innerHTML  = '';
  document.getElementById('tableWrap').innerHTML = '';
  document.getElementById('tableNote').textContent = '';
  document.getElementById('onlyDups').checked = false;
  ['stTotal', 'stDup', 'stClean', 'stPct'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });
  document.getElementById('btnExport').disabled     = true;
  document.getElementById('btnExportDups').disabled = true;

  setStep(1);
}

function resetAll() { resetFile(); }

/* ── Renderizar chips de colunas ── */
function renderCols() {
  const grid = document.getElementById('colsGrid');
  grid.innerHTML = '';

  headers.forEach((h, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'col-chip';
    chip.setAttribute('aria-pressed', 'false');

    const check = document.createElement('span');
    check.className = 'check';
    check.textContent = '✓';
    chip.appendChild(check);
    // textContent evita que um cabeçalho com "<" ou aspas vire markup
    chip.appendChild(document.createTextNode(h));

    chip.onclick = () => {
      const ativo = selectedCols.has(i);
      if (ativo) selectedCols.delete(i); else selectedCols.add(i);
      chip.classList.toggle('active', !ativo);
      chip.setAttribute('aria-pressed', String(!ativo));
      document.getElementById('btnAnalyze').disabled = selectedCols.size === 0;
    };

    grid.appendChild(chip);
  });

  document.getElementById('btnAnalyze').disabled = true;
}

/* ── Modo de retenção (primeira/última ocorrência) ── */
function setMode(m) {
  keepMode = m;
  [['modeFirst', 'first'], ['modeLast', 'last']].forEach(([id, val]) => {
    const el = document.getElementById(id);
    el.classList.toggle('active', m === val);
    el.setAttribute('aria-pressed', String(m === val));
  });
}

/* ── Reanalisar ao trocar as opções de normalização ── */
function onNormChange() {
  if (dupIdxsGlobal) analyze();
}

/* ── Normalização de valor para comparação ──
   Sem isso "João  Silva" e "joao silva" contam como leads distintos. */
function normalizeValue(v) {
  let s = String(v ?? '').trim().toLowerCase();
  if (!s) return '';

  if (document.getElementById('normPhone').checked) {
    const digitos = s.replace(/\D/g, '');
    // Só trata como telefone se o valor for basicamente um número formatado
    if (digitos.length >= 8 && /^[\d\s+()\-.]+$/.test(s)) return digitos;
  }

  if (document.getElementById('normAccents').checked) {
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/\s+/g, ' ');
  }

  return s;
}

/* ── Chave de unicidade ── */
function getKey(row) {
  return [...selectedCols].map(i => normalizeValue(row[i])).join('⟨|⟩');
}

/* ── Análise de duplicatas ── */
function analyze() {
  if (!selectedCols.size) return;

  const seen = new Map();
  allData.forEach((row, idx) => {
    const key = getKey(row);
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(idx);
  });

  const dupIdxs = new Set();
  seen.forEach(idxs => {
    if (idxs.length > 1) {
      const keep = keepMode === 'first' ? idxs[0] : idxs[idxs.length - 1];
      idxs.forEach(i => { if (i !== keep) dupIdxs.add(i); });
    }
  });

  dupIdxsGlobal = dupIdxs;

  const total = allData.length;
  const dups  = dupIdxs.size;
  const clean = total - dups;
  const pct   = total > 0 ? Math.round((dups / total) * 100) : 0;

  animateCount('stTotal', total);
  animateCount('stDup',   dups);
  animateCount('stClean', clean);
  animateCount('stPct',   pct, '%');

  const alertEl = document.getElementById('alertMsg');
  if (dups === 0) {
    alertEl.className   = 'alert show alert-success';
    alertEl.textContent = '✓ Nenhuma duplicata encontrada! Seu arquivo já está limpo.';
  } else {
    alertEl.className   = 'alert show alert-danger';
    alertEl.textContent = `⚠ ${dups.toLocaleString('pt-BR')} linha(s) duplicada(s) encontrada(s) e marcadas em vermelho abaixo.`;
  }

  renderTable();

  document.getElementById('btnExport').disabled     = false;
  document.getElementById('btnExportDups').disabled = dups === 0;
  document.getElementById('cardResults').classList.remove('hidden');
  document.getElementById('cardResults').classList.add('fade-up');
  document.getElementById('cardResults').scrollIntoView({
    behavior: REDUCED_MOTION ? 'auto' : 'smooth',
    block: 'start',
  });
  setStep(3);
}

/* ── Quais colunas mostrar no preview ──
   As colunas usadas como chave vêm primeiro: sem isso o usuário pode
   ver uma linha marcada como duplicada sem enxergar o motivo. */
function colunasVisiveis() {
  const MAX = 8;
  const sel = [...selectedCols].sort((a, b) => a - b);
  const cols = sel.slice(0, MAX);
  for (let i = 0; i < headers.length && cols.length < MAX; i++) {
    if (!cols.includes(i)) cols.push(i);
  }
  return cols;
}

/* ── Renderizar tabela de preview ── */
function renderTable() {
  if (!dupIdxsGlobal) return;

  const maxRows  = 80;
  const soDups   = document.getElementById('onlyDups').checked;
  const cols     = colunasVisiveis();
  const escondidas = headers.length - cols.length;

  const linhas = [];
  allData.forEach((row, idx) => {
    const isDup = dupIdxsGlobal.has(idx);
    if (soDups && !isDup) return;
    linhas.push({ row, idx, isDup });
  });

  const visiveis = linhas.slice(0, maxRows);

  let html = '<table><thead><tr><th class="col-status">Status</th>';
  cols.forEach(ci => {
    const chave = selectedCols.has(ci);
    html += `<th class="${chave ? 'is-key' : ''}">${escapeHtml(headers[ci])}</th>`;
  });
  html += '</tr></thead><tbody>';

  visiveis.forEach(({ row, isDup }) => {
    html += `<tr class="${isDup ? 'dup' : ''}">`;
    html += `<td><span class="badge ${isDup ? 'badge-dup' : 'badge-ok'}">${isDup ? '✕ dup' : '✓ ok'}</span></td>`;
    cols.forEach(ci => {
      const v = escapeHtml(row[ci] ?? '');
      html += `<td class="${selectedCols.has(ci) ? 'is-key' : ''}" title="${v}">${v}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';

  if (linhas.length === 0) {
    html = '<div class="table-empty">Nenhuma linha para exibir com esse filtro.</div>';
  }

  document.getElementById('tableWrap').innerHTML = html;

  const notas = [];
  if (linhas.length > maxRows) {
    notas.push(`Mostrando ${maxRows} de ${linhas.length.toLocaleString('pt-BR')} linhas · o arquivo exportado conterá todos os registros`);
  }
  if (escondidas > 0) {
    notas.push(`${escondidas} coluna(s) ocultada(s) no preview · o export mantém todas`);
  }
  document.getElementById('tableNote').textContent = notas.join(' · ');
}

/* ── Exportação ──
   Nota: a build community do SheetJS ignora estilos de célula
   (negrito etc.); apenas a largura de coluna é aplicada. */
function baixarPlanilha(linhas, nomeAba, nomeArquivo) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...linhas]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomeAba);
  XLSX.writeFile(wb, nomeArquivo);
}

function exportClean() {
  if (!dupIdxsGlobal) return;
  const limpos = allData.filter((_, i) => !dupIdxsGlobal.has(i));
  baixarPlanilha(limpos, sheetName || 'Leads', 'leads_limpos.xlsx');
  showToast(`${limpos.length.toLocaleString('pt-BR')} leads únicos exportados`, 'success');
  setStep(4);
}

function exportDups() {
  if (!dupIdxsGlobal || dupIdxsGlobal.size === 0) return;
  const dups = allData.filter((_, i) => dupIdxsGlobal.has(i));
  baixarPlanilha(dups, 'Duplicatas', 'leads_duplicados.xlsx');
  showToast(`${dups.length.toLocaleString('pt-BR')} duplicatas exportadas para auditoria`, 'info');
}

/* ── Indicador de steps ── */
function setStep(n) {
  [1, 2, 3, 4].forEach(i => {
    const el = document.getElementById('step' + i);
    el.className = 'step' + (i === n ? ' active' : (i < n ? ' done' : ''));
  });
}
