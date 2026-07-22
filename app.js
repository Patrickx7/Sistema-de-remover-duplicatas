/* ============================================================
   app.js — LeadClean v3.0
   Responsável por: utilitários compartilhados (escape, toasts,
   leitura de planilha, drop zones), navegação entre abas e tema.
   Carregado antes de duplicata.js e ddd.js.
   ============================================================ */

/* ── Preferências de movimento ── */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. Escape de HTML
   Valores vindos da planilha nunca podem ser interpolados crus:
   aspas quebram atributos e tags são interpretadas pelo browser.
   ============================================================ */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   2. Toasts (substituem os alert() nativos)
   ============================================================ */
function showToast(msg, tipo = 'info', ms = 4200) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.textContent = msg;
  stack.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast-out');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
  }, ms);
}

/* ============================================================
   3. Contagem animada dos cards de estatística
   ============================================================ */
function animateCount(el, valor, sufixo = '') {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;

  if (REDUCED_MOTION) {
    el.textContent = valor.toLocaleString('pt-BR') + sufixo;
    return;
  }

  const dur   = 600;
  const t0    = performance.now();
  const passo = now => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(valor * eased).toLocaleString('pt-BR') + sufixo;
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* ============================================================
   4. Leitura de planilha com detecção de encoding
   CSVs exportados do Excel brasileiro costumam vir em
   Windows-1252; lidos como UTF-8 os acentos vêm corrompidos.
   ============================================================ */
function isValidUtf8(bytes) {
  const limite = Math.min(bytes.length, 65536);
  let i = 0;
  while (i < limite) {
    const b = bytes[i];
    if (b < 0x80) { i++; continue; }

    let extras;
    if      ((b & 0xE0) === 0xC0) extras = 1;
    else if ((b & 0xF0) === 0xE0) extras = 2;
    else if ((b & 0xF8) === 0xF0) extras = 3;
    else return false;

    // Sequência cortada pelo limite de leitura: assume válida
    if (i + extras >= limite) return true;

    for (let j = 1; j <= extras; j++) {
      if ((bytes[i + j] & 0xC0) !== 0x80) return false;
    }
    i += extras + 1;
  }
  return true;
}

function readSpreadsheet(file, onSuccess, onError) {
  const reader = new FileReader();

  reader.onerror = () => onError(new Error('não foi possível ler o arquivo do disco'));

  reader.onload = e => {
    try {
      const bytes = new Uint8Array(e.target.result);
      const opts  = { type: 'array' };

      if (/\.csv$/i.test(file.name)) {
        const temBOM = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
        // Sem BOM e bytes altos inválidos em UTF-8 → planilha salva em ANSI
        if (!temBOM && !isValidUtf8(bytes)) opts.codepage = 1252;
      }

      const workbook  = XLSX.read(bytes, opts);
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];
      const json      = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (json.length < 2) {
        onError(new Error('arquivo vazio ou sem linhas de dados'));
        return;
      }

      // Linhas de dados podem ser mais largas que o cabeçalho: sem isso
      // as colunas extras somem da interface mas vão para o export.
      const nCols = json.reduce((max, r) => Math.max(max, r.length), 0);
      const brutos = json[0];
      const headers = [];
      for (let i = 0; i < nCols; i++) {
        const h = brutos[i];
        headers.push(h !== undefined && h !== '' ? String(h) : `Coluna_${i + 1}`);
      }

      const rows = json.slice(1).filter(r => r.some(c => c !== '' && c !== undefined));

      onSuccess({ workbook, sheetName, headers, rows });
    } catch (err) {
      onError(err);
    }
  };

  reader.readAsArrayBuffer(file);
}

/* ============================================================
   5. Drop zone (comportamento comum às duas abas)
   O contador de profundidade evita que o dragleave dos elementos
   filhos faça a borda piscar durante o arrasto.
   ============================================================ */
function setupDropZone(zoneId, inputId, onFile) {
  const zone  = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  let depth = 0;

  const abrir = () => input.click();

  zone.addEventListener('click', abrir);
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });

  zone.addEventListener('dragenter', e => {
    e.preventDefault();
    depth++;
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragover', e => e.preventDefault());
  zone.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    depth = 0;
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) onFile(input.files[0]);
  });
}

function setDropLoading(id, ativo) {
  document.getElementById(id).classList.toggle('is-loading', ativo);
}

/* ============================================================
   6. Tooltip flutuante (usado pelo cartograma)
   ============================================================ */
function showTooltip(html, x, y) {
  const tip = document.getElementById('tooltip');
  tip.innerHTML = html;
  tip.classList.add('show');
  const r = tip.getBoundingClientRect();
  const left = Math.min(Math.max(8, x - r.width / 2), window.innerWidth - r.width - 8);
  tip.style.left = left + 'px';
  tip.style.top  = Math.max(8, y - r.height - 12) + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('show');
}

/* ============================================================
   7. Tema claro / escuro
   ============================================================ */
function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  document.getElementById('themeIcon').textContent = tema === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema === 'dark' ? '#0B2A1E' : '#123D2B');
}

function toggleTheme() {
  const atual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const novo  = atual === 'dark' ? 'light' : 'dark';
  aplicarTema(novo);
  try { localStorage.setItem('leadclean_theme', novo); } catch (e) { /* modo privado */ }
}

/* ============================================================
   8. Navegação entre abas principais
   ============================================================ */
function switchTab(tab) {
  const mapa = {
    dedup: { tab: 'tabDedup', panel: 'panelDedup' },
    ddd:   { tab: 'tabDDD',   panel: 'panelDDD'   },
  };

  Object.entries(mapa).forEach(([nome, ids]) => {
    const ativo = nome === tab;
    const tabEl = document.getElementById(ids.tab);
    tabEl.classList.toggle('active', ativo);
    tabEl.setAttribute('aria-selected', String(ativo));
    tabEl.tabIndex = ativo ? 0 : -1;
    document.getElementById(ids.panel).classList.toggle('active', ativo);
  });
}

/* ============================================================
   9. Navegação por setas em qualquer grupo de tabs
   ============================================================ */
function ligarSetasEmTablist(seletor) {
  document.querySelectorAll(seletor).forEach(lista => {
    const tabs = [...lista.querySelectorAll('[role="tab"]')];
    lista.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      let alvo = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') alvo = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   alvo = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') alvo = tabs[0];
      if (e.key === 'End')  alvo = tabs[tabs.length - 1];
      if (!alvo) return;
      e.preventDefault();
      alvo.focus();
      alvo.click();
    });
  });
}

/* ============================================================
   10. Seletor de visualização da aba DDD
   ============================================================ */
function switchViz(viz) {
  const mapa = {
    map:    { tab: 'vizTabMap',    panel: 'vizMap'    },
    bars:   { tab: 'vizTabBars',   panel: 'vizBars'   },
    region: { tab: 'vizTabRegion', panel: 'vizRegion' },
    table:  { tab: 'vizTabTable',  panel: 'vizTable'  },
  };

  Object.entries(mapa).forEach(([nome, ids]) => {
    const ativo = nome === viz;
    const tabEl = document.getElementById(ids.tab);
    tabEl.classList.toggle('active', ativo);
    tabEl.setAttribute('aria-selected', String(ativo));
    tabEl.tabIndex = ativo ? 0 : -1;
    document.getElementById(ids.panel).classList.toggle('active', ativo);
  });

  // As barras animam a largura: reinicia a animação ao reexibir o painel
  if (viz === 'bars') requestAnimationFrame(() => animarBarras());
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  aplicarTema(document.documentElement.getAttribute('data-theme') || 'light');
  ligarSetasEmTablist('.mode-tabs');
  ligarSetasEmTablist('.viz-tabs');
});
