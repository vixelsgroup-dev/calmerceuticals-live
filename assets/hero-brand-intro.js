(function () {
  function respectReducedMotion() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.hero-brand-intro video').forEach(function (el) {
      el.removeAttribute('autoplay');
      try {
        el.pause();
      } catch (_) {}
    });
    document.querySelectorAll('.hero-brand-intro__lcp-poster').forEach(function (poster) {
      var section = poster.closest('.hero-brand-intro--has-hero-video');
      if (section) section.classList.add('hero-brand-intro--hero-media-ready');
    });
  }

  function initHeroLcpPosterReveal() {
    document.querySelectorAll('.hero-brand-intro--has-hero-video').forEach(function (section) {
      if (section.dataset.heroLcpRevealInit === '1') return;
      var media = section.querySelector('.hero-brand-intro__media');
      if (!media || !media.querySelector('.hero-brand-intro__lcp-poster')) return;
      section.dataset.heroLcpRevealInit = '1';

      var done = false;
      function reveal() {
        if (done) return;
        done = true;
        section.classList.add('hero-brand-intro--hero-media-ready');
      }

      media.querySelectorAll('video.hero-brand-intro__img').forEach(function (v) {
        if (v.readyState >= 3) reveal();
        v.addEventListener('canplay', reveal, { once: true });
      });

      window.setTimeout(reveal, 12000);
    });
  }

  function getFounderVideo(row) {
    return row.querySelector('.hero-brand-intro__founder-video');
  }

  function setFounderVideoMuted(row, muted) {
    var video = getFounderVideo(row);
    if (!video) return;
    video.muted = muted;
  }

  function playFounderVideoFromStart(row) {
    var video = getFounderVideo(row);
    if (!video) return;
    try {
      video.pause();
    } catch (_) {}
    try {
      video.currentTime = 0;
    } catch (_) {}
    video.muted = false;
    try {
      var p = video.play();
      if (p && typeof p.then === 'function') p.catch(function () {});
    } catch (_) {}
  }

  function initFounderRows() {
    document.querySelectorAll('[data-hero-founder-row]').forEach(function (row) {
      var closeBtn = row.querySelector('[data-hero-founder-close]');
      if (row.dataset.heroFounderInit === '1') return;
      row.dataset.heroFounderInit = '1';

      function onDocumentClick(e) {
        if (!row.classList.contains('is-expanded')) return;
        if (row.contains(e.target)) return;
        collapse();
      }

      function expand() {
        row.classList.add('is-expanded');
        row.setAttribute('aria-expanded', 'true');
        playFounderVideoFromStart(row);
        document.addEventListener('click', onDocumentClick);
      }

      function collapse() {
        document.removeEventListener('click', onDocumentClick);
        row.classList.remove('is-expanded');
        row.setAttribute('aria-expanded', 'false');
        setFounderVideoMuted(row, true);
      }

      row.addEventListener('click', function (e) {
        if (e.target.closest('[data-hero-founder-close]')) return;
        if (row.classList.contains('is-expanded')) return;
        expand();
      });

      row.addEventListener('keydown', function (e) {
        if (row.classList.contains('is-expanded')) {
          if (e.key === 'Escape') {
            e.preventDefault();
            collapse();
            row.focus();
          }
          return;
        }
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        expand();
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          collapse();
          row.focus();
        });
      }
    });
  }

  function boot() {
    initHeroLcpPosterReveal();
    respectReducedMotion();
    initFounderRows();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
