/* ============================================================
   app.js — LeadClean v2.0
   Responsável por: navegação entre abas (tabs).
   ============================================================ */

function switchTab(tab) {
  document.getElementById('tabDedup').className  = 'mode-tab' + (tab === 'dedup' ? ' active' : '');
  document.getElementById('tabDDD').className    = 'mode-tab' + (tab === 'ddd'   ? ' active' : '');
  document.getElementById('panelDedup').className = 'tab-panel' + (tab === 'dedup' ? ' active' : '');
  document.getElementById('panelDDD').className   = 'tab-panel' + (tab === 'ddd'   ? ' active' : '');
}
