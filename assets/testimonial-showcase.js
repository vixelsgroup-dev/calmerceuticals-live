(function () {
  "use strict";

  function initSlider(root) {
    if (root.getAttribute("data-tsc-inited") === "1") return;
    root.setAttribute("data-tsc-inited", "1");
    var section = root.closest(".testimonial-showcase");
    var track = root.querySelector("[data-tsc-track]");
    var slides = root.querySelectorAll("[data-tsc-slide]");
    var prev = section ? section.querySelector("[data-tsc-prev]") : null;
    var next = section ? section.querySelector("[data-tsc-next]") : null;
    var nav = section ? section.querySelector("[data-tsc-nav]") : null;

    if (!track || slides.length === 0) return;

    if (slides.length < 2) {
      if (nav) nav.hidden = true;
      return;
    }

    var index = 0;
    var count = slides.length;

    function syncButtons() {
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= count - 1;
    }

    function goTo(i) {
      index = Math.max(0, Math.min(count - 1, i));
      track.style.transform = "translateX(-" + index * 100 + "%)";
      syncButtons();
    }

    if (prev) {
      prev.addEventListener("click", function () {
        goTo(index - 1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        goTo(index + 1);
      });
    }

    goTo(0);
  }

  function initAll() {
    document.querySelectorAll("[data-tsc-slider]").forEach(initSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  document.addEventListener("shopify:section:load", function (ev) {
    if (ev.target && ev.target.querySelector && ev.target.querySelector("[data-tsc-slider]")) {
      ev.target.querySelectorAll("[data-tsc-slider]").forEach(initSlider);
    }
  });
})();
