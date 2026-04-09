(function () {
  'use strict';

  var BP = '(min-width: 750px)';

  function getVideos(root) {
    return Array.prototype.slice.call(root.querySelectorAll('.brand-message-video__video'));
  }

  function primaryVideo(root) {
    var single = root.querySelector('.brand-message-video__video--single');
    if (single) return single;
    var desktop = root.querySelector('.brand-message-video__video--desktop');
    var mobile = root.querySelector('.brand-message-video__video--mobile');
    if (window.matchMedia(BP).matches) {
      return desktop || mobile;
    }
    return mobile || desktop;
  }

  function pauseAll(root) {
    getVideos(root).forEach(function (v) {
      try {
        v.pause();
      } catch (_) {}
    });
  }

  function playPrimary(root) {
    pauseAll(root);
    var v = primaryVideo(root);
    if (!v) return;
    if (v.readyState < 2 && v.getAttribute('data-bmv-preload') !== '1') {
      v.setAttribute('data-bmv-preload', '1');
      v.preload = 'auto';
    }
    var p = v.play();
    if (p && typeof p.then === 'function') {
      p.catch(function () {});
    }
  }

  function syncMuted(root, muted) {
    getVideos(root).forEach(function (v) {
      v.muted = muted;
    });
  }

  function updateMuteButton(btn, root) {
    if (!btn) return;
    var pv = primaryVideo(root);
    var muted = pv ? pv.muted : true;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
    btn.classList.toggle('brand-message-video__mute--unmuted', !muted);
  }

  function initSection(root) {
    if (root.dataset.bmvInit === '1') return;
    root.dataset.bmvInit = '1';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var btn = root.querySelector('[data-bmv-mute]');
    var inView = false;

    if (reduced) {
      pauseAll(root);
      getVideos(root).forEach(function (v) {
        v.removeAttribute('autoplay');
      });
      if (btn) updateMuteButton(btn, root);
      return;
    }

    function onResize() {
      if (!inView) return;
      playPrimary(root);
      updateMuteButton(btn, root);
    }

    var mq = window.matchMedia(BP);
    if (mq.addEventListener) {
      mq.addEventListener('change', onResize);
    } else {
      mq.addListener(onResize);
    }

    if (btn) {
      btn.addEventListener('click', function () {
        var pv = primaryVideo(root);
        if (!pv) return;
        var muted = !pv.muted;
        syncMuted(root, muted);
        updateMuteButton(btn, root);
        if (!muted && inView) {
          var p = pv.play();
          if (p && typeof p.then === 'function') p.catch(function () {});
        }
      });
      updateMuteButton(btn, root);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (entry.isIntersecting) {
            playPrimary(root);
          } else {
            pauseAll(root);
          }
        });
      },
      { threshold: 0.25, rootMargin: '0px' }
    );

    io.observe(root);
  }

  function boot() {
    document.querySelectorAll('[data-brand-message-video]').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
