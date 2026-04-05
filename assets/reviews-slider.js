/**
 * Reviews Slider
 * - Autoplay ON: continuous infinite carousel (same behavior as custom-videos-slider)
 * - Autoplay OFF: Flickity slider (or scroll-snap fallback if Flickity unavailable)
 */
(function () {
  var continuousStates = new WeakMap();

  function getFlickity() {
    if (window.theme && window.theme.Flickity) return window.theme.Flickity;
    if (typeof window.Flickity !== 'undefined') return window.Flickity;
    return null;
  }

  function waitForFlickity(cb, maxAttempts) {
    var F = getFlickity();
    if (F) {
      cb(F);
      return;
    }
    var n = 0;
    var limit = maxAttempts || 80;
    var id = setInterval(function () {
      F = getFlickity();
      if (F) {
        clearInterval(id);
        cb(F);
      } else if (++n >= limit) {
        clearInterval(id);
        cb(null);
      }
    }, 50);
  }

  function scrollSnapFallback(el) {
    el.style.display = 'flex';
    el.style.overflowX = 'auto';
    el.style.scrollSnapType = 'x mandatory';
    el.style.webkitOverflowScrolling = 'touch';
    el.style.scrollbarWidth = 'none';
    el.style.msOverflowStyle = 'none';
    el.querySelectorAll('.rvs-section__card').forEach(function (card) {
      card.style.scrollSnapAlign = 'start';
      card.style.flexShrink = '0';
    });
  }

  function destroyContinuous(el) {
    var state = continuousStates.get(el);
    if (!state) return;
    if (state.intervalId) window.clearInterval(state.intervalId);
    if (typeof state.onPointerDown === 'function') el.removeEventListener('pointerdown', state.onPointerDown);
    if (typeof state.onPointerMove === 'function') window.removeEventListener('pointermove', state.onPointerMove);
    if (typeof state.onPointerUp === 'function') {
      window.removeEventListener('pointerup', state.onPointerUp);
      window.removeEventListener('pointercancel', state.onPointerUp);
    }

    // Remove cloned slides created for seamless loop.
    el.querySelectorAll('[data-rvs-clone="true"]').forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
    continuousStates.delete(el);
  }

  function initContinuousAutoplay(el, autoplaySpeedSeconds) {
    destroyContinuous(el);

    // Ensure native horizontal scroller mode.
    el.style.display = 'flex';
    el.style.flexWrap = 'nowrap';
    el.style.alignItems = 'stretch';
    el.style.overflowX = 'hidden';
    el.style.scrollSnapType = 'none';
    el.style.webkitOverflowScrolling = 'touch';
    el.style.scrollbarWidth = 'none';
    el.style.msOverflowStyle = 'none';
    el.style.touchAction = 'none';

    var originalSlides = Array.prototype.slice.call(el.querySelectorAll('.rvs-section__card:not([data-rvs-clone="true"])'));
    if (originalSlides.length <= 1) return;
    originalSlides.forEach(function (card) {
      card.style.flexShrink = '0';
    });

    originalSlides.forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-rvs-clone', 'true');
      clone.style.flexShrink = '0';
      el.appendChild(clone);
    });

    var originalWidth = el.scrollWidth / 2;
    var autoSpeedPxPerTick = 0.25;
    var isPaused = false;
    function computeAutoSpeed() {
      var seconds = Math.max(1, autoplaySpeedSeconds || 28);
      var pxPerSecond = Math.max(2, originalWidth / seconds);
      autoSpeedPxPerTick = pxPerSecond / 60;
    }

    function tick() {
      if (isPaused) return;
      // Left-to-right visual movement.
      el.scrollLeft -= autoSpeedPxPerTick;
      if (el.scrollLeft <= 0) {
        el.scrollLeft += originalWidth;
      }
    }

    computeAutoSpeed();
    el.scrollLeft = originalWidth;
    var intervalId = window.setInterval(tick, 16);

    continuousStates.set(el, {
      intervalId: intervalId,
      recalc: function () {
        originalWidth = el.scrollWidth / 2;
        computeAutoSpeed();
      },
    });
  }

  function initSlider(el, FlickityCtor) {
    if (!el || el.hasAttribute('data-rvs-initialized')) return;

    var cards = el.querySelectorAll('.rvs-section__card');
    if (cards.length === 0) return;
    var isCarouselAutoplayEnabled = el.getAttribute('data-carousel-autoplay') === 'true';
    var autoplaySpeedSeconds = parseInt(el.getAttribute('data-autoplay-speed'), 10);
    if (!isFinite(autoplaySpeedSeconds)) autoplaySpeedSeconds = 28;

    // Autoplay mode matches custom-videos-slider behavior: continuous infinite movement.
    if (isCarouselAutoplayEnabled) {
      if (FlickityCtor) {
        var active = FlickityCtor.data(el);
        if (active) active.destroy();
      }
      initContinuousAutoplay(el, autoplaySpeedSeconds);
      el.setAttribute('data-rvs-initialized', 'continuous');
      return;
    }

    if (!FlickityCtor) {
      destroyContinuous(el);
      scrollSnapFallback(el);
      el.setAttribute('data-rvs-initialized', 'fallback');
      return;
    }

    var existing = FlickityCtor.data(el);
    if (existing) {
      existing.destroy();
    }
    destroyContinuous(el);

    new FlickityCtor(el, {
      cellAlign: 'left',
      contain: true,
      pageDots: false,
      prevNextButtons: false,
      draggable: cards.length > 1,
      wrapAround: false,
      friction: 0.28,
      selectedAttraction: 0.025,
      adaptiveHeight: false,
    });

    el.setAttribute('data-rvs-initialized', 'flickity');
  }

  function initAll() {
    document.querySelectorAll('[data-rvs-slider]').forEach(function (el) {
      waitForFlickity(function (F) {
        initSlider(el, F);
      });
    });
  }

  function onResize() {
    document.querySelectorAll('[data-rvs-slider]').forEach(function (el) {
      var continuous = continuousStates.get(el);
      if (continuous && typeof continuous.recalc === 'function') {
        continuous.recalc();
      }
      var F = getFlickity();
      if (!F) return;
      var instance = F.data(el);
      if (instance && typeof instance.resize === 'function') {
        instance.resize();
      }
    });
  }

  var resizeTimer;
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 150);
    },
    { passive: true }
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:unload', function (ev) {
    if (!ev.target || !ev.target.querySelectorAll) return;
    var sliders = ev.target.querySelectorAll('[data-rvs-slider]');
    var F = getFlickity();
    sliders.forEach(function (el) {
      destroyContinuous(el);
      if (F) {
        var inst = F.data(el);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
      }
      el.removeAttribute('data-rvs-initialized');
    });
  });

  document.addEventListener('shopify:section:load', function (ev) {
    if (!ev.target || !ev.target.querySelector) return;
    var sliders = ev.target.querySelectorAll('[data-rvs-slider]');
    if (!sliders.length) return;
    waitForFlickity(function (F) {
      sliders.forEach(function (el) {
        el.removeAttribute('data-rvs-initialized');
        initSlider(el, F);
      });
    });
  });
})();
