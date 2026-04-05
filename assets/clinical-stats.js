(function () {
  var DESKTOP_BREAKPOINT = 990;
  var STEP_STAGGER = 0.2;
  var LOCK_SCROLL_DISTANCE_VH = 140;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  }

  function initSection(section) {
    var shell = section.querySelector('[data-stats-shell]');
    var metrics = Array.prototype.slice.call(section.querySelectorAll('[data-metric]'));
    if (!shell || metrics.length === 0) return;

    var state = {
      progress: 0,
      inView: false,
      ticking: false
    };

    function render() {
      var total = metrics.length;
      metrics.forEach(function (metric, index) {
        var startOffset = Number(metric.getAttribute('data-start-offset') || 0);
        var reverseIndex = total - 1 - index;
        var localStart = Math.min(reverseIndex * STEP_STAGGER, 0.85);
        var localProgress = clamp((state.progress - localStart) / (1 - localStart), 0, 1);
        var shift = Math.round(startOffset * (1 - localProgress));
        var opacity = state.inView ? 1 : localProgress;
        metric.style.setProperty('--metric-shift', shift + 'px');
        metric.style.setProperty('--metric-opacity', opacity.toFixed(3));
      });
    }

    function setSectionHeight() {
      if (!isDesktop()) {
        section.style.minHeight = '';
        section.classList.remove('clinical-stats--lock-ready');
        state.progress = 1;
        render();
        return;
      }

      section.style.minHeight = '';
      section.classList.add('clinical-stats--lock-ready');
    }

    function getProgressFromScroll() {
      if (!isDesktop()) return 1;
      var rect = section.getBoundingClientRect();
      var lockDistance = (window.innerHeight * LOCK_SCROLL_DISTANCE_VH) / 100;
      var start = window.innerHeight * 0.08;
      var end = -lockDistance;
      return clamp((rect.top - start) / (end - start), 0, 1);
    }

    function updateFromScroll() {
      var rect = section.getBoundingClientRect();
      state.inView = rect.top < window.innerHeight && rect.bottom > 0;
      state.progress = getProgressFromScroll();
      render();
    }

    function requestTick() {
      if (state.ticking) return;
      state.ticking = true;
      window.requestAnimationFrame(function () {
        updateFromScroll();
        state.ticking = false;
      });
    }

    function onScroll() {
      requestTick();
    }

    function onResize() {
      setSectionHeight();
      requestTick();
    }

    setSectionHeight();
    updateFromScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  function init() {
    var sections = document.querySelectorAll('[data-clinical-stats]');
    sections.forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
