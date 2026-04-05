(function () {
  var sections = document.querySelectorAll("[data-product-cards-slider]");

  if (!sections.length) return;

  sections.forEach(function (section) {
    var viewport = section.querySelector("[data-slider-viewport]");
    var prevButton = section.querySelector("[data-slider-prev]");
    var nextButton = section.querySelector("[data-slider-next]");

    if (!viewport || !prevButton || !nextButton) return;

    function getStepSize() {
      var firstCard = viewport.querySelector(".product-cards-slider-card");
      if (!firstCard) return viewport.clientWidth * 0.9;

      var cardStyles = window.getComputedStyle(firstCard);
      var cardWidth = firstCard.getBoundingClientRect().width;
      var rightMargin = parseFloat(cardStyles.marginRight) || 0;
      var track = section.querySelector("[data-slider-track]");
      var gap = 0;

      if (track) {
        var trackStyles = window.getComputedStyle(track);
        gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
      }

      return cardWidth + rightMargin + gap;
    }

    function scrollByStep(direction) {
      viewport.scrollBy({
        left: direction * getStepSize(),
        behavior: "smooth",
      });
    }

    prevButton.addEventListener("click", function () {
      scrollByStep(-1);
    });

    nextButton.addEventListener("click", function () {
      scrollByStep(1);
    });
  });
})();
