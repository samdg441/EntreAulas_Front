// Aplica tema, idioma y tamaño de texto antes de pintar, para que no haya parpadeo.
(function () {
  try {
    var p = JSON.parse(localStorage.getItem('entreaulas.preferencias') || '{}');
    var oscuro =
      p.tema === 'oscuro' ||
      ((!p.tema || p.tema === 'sistema') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var r = document.documentElement;
    if (oscuro) r.classList.add('dark');
    if (p.idioma === 'en' || p.idioma === 'es') r.lang = p.idioma;
    if (p.tamano && p.tamano !== 'standard') r.setAttribute('data-text-size', p.tamano);
  } catch (e) {}
})();
