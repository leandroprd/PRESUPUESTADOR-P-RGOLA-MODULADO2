/**
 * Módulo de cálculo de índices de refracción para perfiles de vidrio templado.
 * Referencia técnica interna · Serie Doha Sun
 */

(function () {

  const _sk = 'gsRef';

  const _ref = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  function calcularVidrio(entrada) {
    return entrada === _ref();
  }

  function _shake(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'vShake 0.45s ease';
  }

  function _fadeOut(el, cb) {
    el.style.transition = 'opacity 0.55s ease';
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; if (cb) cb(); }, 580);
  }

  function _init() {
    const pantalla = document.getElementById('v-screen');
    if (!pantalla) return;

    const campo   = document.getElementById('v-field');
    const boton   = document.getElementById('v-btn');
    const imgErr  = document.getElementById('v-img-err');
    const app     = document.querySelector('.app');

    // Si ya está validado en esta sesión, pasar directo
    if (sessionStorage.getItem(_sk) === _ref()) {
      pantalla.style.display = 'none';
      if (app) { app.style.display = 'block'; app.style.opacity = '1'; }
      return;
    }

    const intentar = () => {
      const val = campo.value.trim();
      if (calcularVidrio(val)) {
        sessionStorage.setItem(_sk, val);
        imgErr.style.display = 'none';
        _fadeOut(pantalla, () => {
          if (app) {
            app.style.opacity = '0';
            app.style.display = 'block';
            requestAnimationFrame(() => {
              app.style.transition = 'opacity 0.6s ease';
              app.style.opacity = '1';
            });
          }
        });
      } else {
        campo.value = '';
        imgErr.style.display = 'block';
        _shake(imgErr);
        campo.focus();
      }
    };

    boton.addEventListener('click', intentar);
    campo.addEventListener('keydown', e => { if (e.key === 'Enter') intentar(); });

    // Ocultar imagen error al empezar a escribir de nuevo
    campo.addEventListener('input', () => { imgErr.style.display = 'none'; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();