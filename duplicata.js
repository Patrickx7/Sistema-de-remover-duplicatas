/* ============================================================
   duplicata.js — LeadClean v2.0
   Responsável por: leitura de arquivo, detecção e remoção
   de duplicatas, exportação de leads limpos.
   ============================================================ */

let allData = [], headers = [], selectedCols = new Set(), keepMode = 'first';
let workbook, sheetName, dupIdxsGlobal;

/* ── Drop zone ── */
const dropZone  = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

/* ── Leitura do arquivo ── */
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = new Uint8Array(e.target.result);
      workbook  = XLSX.read(data, { type: 'array' });
      sheetName = workbook.SheetNames[0];

      const sheet = workbook.Sheets[sheetName];
      const json  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (json.length < 2) { alert('Arquivo vazio ou sem linhas de dados.'); return; }

      headers  = json[0].map((h, i) => h !== '' ? String(h) : `Coluna_${i + 1}`);
      allData  = json.slice(1).filter(r => r.some(c => c !== ''));
      selectedCols.clear();

      document.getElementById('dropZone').classList.add('hidden');
      document.getElementById('fileLoaded').classList.remove('hidden');
      document.getElementById('fileName').textContent =
        `${file.name} · ${allData.length} linhas · ${headers.length} colunas`;

      document.getElementById('cardConfig').classList.remove('hidden');
      document.getElementById('cardConfig').classList.add('fade-up');
      document.getElementById('cardResults').classList.add('hidden');

      renderCols();
      setStep(2);
    } catch (err) {
      alert('Erro ao ler o arquivo: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ── Reset ── */
function resetFile() {
  fileInput.value = '';
  document.getElementById('dropZone').classList.remove('hidden');
  document.getElementById('fileLoaded').classList.add('hidden');
  document.getElementById('cardConfig').classList.add('hidden');
  document.getElementById('cardResults').classList.add('hidden');
  selectedCols.clear();
  allData  = [];
  headers  = [];
  setStep(1);
}

function resetAll() { resetFile(); }

/* ── Renderizar chips de colunas ── */
function renderCols() {
  const grid = document.getElementById('colsGrid');
  grid.innerHTML = '';

  headers.forEach((h, i) => {
    const chip = document.createElement('div');
    chip.className = 'col-chip';
    chip.innerHTML = `<span class="check">✓</span>${h}`;
    chip.onclick = () => {
      if (selectedCols.has(i)) {
        selectedCols.delete(i);
        chip.classList.remove('active');
      } else {
        selectedCols.add(i);
        chip.classList.add('active');
      }
      document.getElementById('btnAnalyze').disabled = selectedCols.size === 0;
    };
    grid.appendChild(chip);
  });

  document.getElementById('btnAnalyze').disabled = true;
}

/* ── Modo de retenção (primeira/última ocorrência) ── */
function setMode(m) {
  keepMode = m;
  document.getElementById('modeFirst').className = 'mode-card' + (m === 'first' ? ' active' : '');
  document.getElementById('modeLast').className  = 'mode-card' + (m === 'last'  ? ' active' : '');
}

/* ── Chave de unicidade ── */
function getKey(row) {
  return [...selectedCols]
    .map(i => String(row[i] ?? '').toLowerCase().trim())
    .join('⟨|⟩');
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

  document.getElementById('stTotal').textContent = total.toLocaleString('pt-BR');
  document.getElementById('stDup').textContent   = dups.toLocaleString('pt-BR');
  document.getElementById('stClean').textContent = clean.toLocaleString('pt-BR');
  document.getElementById('stPct').textContent   = pct + '%';

  const alertEl = document.getElementById('alertMsg');
  if (dups === 0) {
    alertEl.className   = 'alert show alert-success';
    alertEl.textContent = '✓ Nenhuma duplicata encontrada! Seu arquivo já está limpo.';
  } else {
    alertEl.className   = 'alert show alert-danger';
    alertEl.textContent = `⚠ ${dups} linha(s) duplicada(s) encontrada(s) e marcadas em vermelho abaixo.`;
  }

  renderTable(dupIdxs);

  document.getElementById('btnExport').disabled = dups === 0;
  document.getElementById('cardResults').classList.remove('hidden');
  document.getElementById('cardResults').classList.add('fade-up');
  document.getElementById('cardResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStep(dups === 0 ? 3 : 4);
}

/* ── Renderizar tabela de preview ── */
function renderTable(dupIdxs) {
  const maxRows = 80;
  const maxCols = Math.min(headers.length, 8);
  const colsArr = headers.slice(0, maxCols);

  let html = '<table><thead><tr><th style="width:80px">Status</th>';
  colsArr.forEach(h => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';

  allData.slice(0, maxRows).forEach((row, idx) => {
    const isDup = dupIdxs.has(idx);
    html += `<tr class="${isDup ? 'dup' : ''}">`;
    html += `<td><span class="badge ${isDup ? 'badge-dup' : 'badge-ok'}">${isDup ? '✕ dup' : '✓ ok'}</span></td>`;
    colsArr.forEach((_, ci) => {
      const v = row[ci] ?? '';
      html += `<td title="${v}">${v}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tableWrap').innerHTML = html;

  const noteEl = document.getElementById('tableNote');
  noteEl.textContent = allData.length > maxRows
    ? `Mostrando ${maxRows} de ${allData.length} linhas · o arquivo exportado conterá todos os registros únicos`
    : '';
}

/* ── Exportar arquivo limpo ── */
function exportClean() {
  if (!dupIdxsGlobal) return;

  const cleanRows = allData.filter((_, i) => !dupIdxsGlobal.has(i));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...cleanRows]);

  // Negrito no cabeçalho
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true } };
  }
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Leads');
  XLSX.writeFile(wb, 'leads_limpos.xlsx');
  setStep(4);
}

/* ── Indicador de steps ── */
function setStep(n) {
  [1, 2, 3, 4].forEach(i => {
    const el = document.getElementById('step' + i);
    el.className = 'step' + (i === n ? ' active' : (i < n ? ' done' : ''));
  });
}
