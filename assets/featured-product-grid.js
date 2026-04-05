(function () {
  'use strict';

  function slideScroll(viewport, direction) {
    var track = viewport.querySelector('.featured-product-grid__grid--track');
    if (!track) return;
    var card = track.querySelector('.featured-product-grid__card');
    if (!card) return;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.gap || styles.columnGap) || 0;
    var delta = direction * (Math.round(card.getBoundingClientRect().width + gap));
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollBy({ left: delta, behavior: reduced ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.featured-product-grid__carousel-btn');
    if (!btn) return;
    var shell = btn.closest('.featured-product-grid__carousel-shell');
    if (!shell) return;
    var viewport = shell.querySelector('.featured-product-grid__viewport');
    if (!viewport) return;
    if (btn.classList.contains('featured-product-grid__carousel-btn--prev')) {
      slideScroll(viewport, -1);
    } else if (btn.classList.contains('featured-product-grid__carousel-btn--next')) {
      slideScroll(viewport, 1);
    }
  });
})();
