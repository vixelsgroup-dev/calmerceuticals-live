(function () {
  'use strict';

  function syncSize(master, slave) {
    slave.style.width = master.clientWidth + 'px';
  }

  function getX(parent, e) {
    const bounds = parent.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - bounds.left;
    return { x: x, width: bounds.width };
  }

  function initComparer(container, lhs) {
    const splitAttr = lhs.getAttribute('data-initial-split');
    let dragOffset;

    function doSync() {
      syncSize(container, lhs);
    }

    window.addEventListener('load', doSync);
    window.addEventListener('resize', doSync);
    doSync();

    const lhsWrapper = container.appendChild(document.createElement('div'));
    lhsWrapper.className = 'bawc-comparison__before-wrap';
    lhsWrapper.appendChild(lhs);

    const dragger = container.appendChild(document.createElement('div'));
    dragger.className = 'bawc-comparison__dragger';
    dragger.setAttribute('role', 'slider');
    dragger.setAttribute('aria-valuemin', '0');
    dragger.setAttribute('aria-valuemax', '100');
    dragger.setAttribute('aria-label', 'Before and after comparison');
    dragger.innerHTML =
      '<span class="bawc-comparison__dragger-line" aria-hidden="true"></span>' +
      '<span class="bawc-comparison__dragger-knob" aria-hidden="true">' +
      '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
      '<path d="M14 12L10 18L14 24M22 12L26 18L22 24" stroke="#1a1a1a" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>';

    if (splitAttr) {
      lhsWrapper.style.width = splitAttr;
      dragger.style.left = splitAttr;
    } else {
      lhsWrapper.style.width = '50%';
      dragger.style.left = '50%';
    }

    function setSplit(percent) {
      const p = Math.max(0, Math.min(100, percent));
      const pct = p + '%';
      lhsWrapper.style.width = pct;
      dragger.style.left = pct;
      dragger.setAttribute('aria-valuenow', String(Math.round(p)));
    }

    function startDrag(e) {
      e.preventDefault();
      dragOffset = getX(dragger, e);
    }

    function moveDrag(e) {
      if (dragOffset == null) return;
      const newX = getX(container, e);
      const relX = (newX.x - dragOffset.x) / newX.width;
      setSplit(relX * 100);
    }

    function stopDrag() {
      dragOffset = undefined;
    }

    dragger.addEventListener('mousedown', startDrag);
    dragger.addEventListener('touchstart', startDrag, { passive: false });

    container.addEventListener('mousemove', moveDrag);
    container.addEventListener('touchmove', moveDrag, { passive: false });

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }

  function initAll() {
    document.querySelectorAll('.bawc-comparison').forEach(function (container) {
      if (container.dataset.bawcInitialized === '1') return;
      const lhs = container.querySelector('.bawc-comparison__before');
      if (!lhs) return;
      container.dataset.bawcInitialized = '1';
      initComparer(container, lhs);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', initAll);
})();
