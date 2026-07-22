/* ============================================================
   splash.js — LeadClean v3.0
   Responsável por: tela de abertura com saudação por horário
   e assinatura do autor. Exibida uma vez por sessão.
   ============================================================ */

(function () {
  const KEY      = 'leadclean_splash';
  const HOLD_MS  = 2500;
  const splash   = document.getElementById('splash');
  if (!splash) return;

  /* ── Saudação conforme a hora local ── */
  function getSaudacao() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  /* Se já foi exibida nesta sessão, remove sem nenhum flash */
  let jaVista = false;
  try { jaVista = sessionStorage.getItem(KEY) === '1'; } catch (e) { /* modo privado */ }

  if (jaVista) {
    splash.remove();
    return;
  }

  document.getElementById('splashGreet').textContent = getSaudacao();
  document.body.classList.add('splash-locked');

  let saindo = false;
  let timer;

  function dispensar() {
    if (saindo) return;
    saindo = true;
    clearTimeout(timer);

    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* modo privado */ }

    splash.classList.add('splash-out');
    document.body.classList.remove('splash-locked');
    window.removeEventListener('keydown', dispensar);

    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    // Rede de segurança caso a transição não dispare
    setTimeout(() => splash.remove(), 800);
  }

  timer = setTimeout(dispensar, HOLD_MS);
  splash.addEventListener('click', dispensar);
  window.addEventListener('keydown', dispensar);
})();
