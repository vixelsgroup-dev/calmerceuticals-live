(function () {
  var sections = document.querySelectorAll("[data-custom-videos-slider]");
  if (!sections.length) return;

  sections.forEach(function (section) {
    var viewport = section.querySelector("[data-slider-viewport]");
    var track = section.querySelector("[data-slider-track]");
    var prevButton = section.querySelector("[data-slider-prev]");
    var nextButton = section.querySelector("[data-slider-next]");
    var isCarouselAutoplayEnabled = section.getAttribute("data-carousel-autoplay") === "true";
    var autoplaySpeedSeconds = parseInt(section.getAttribute("data-autoplay-speed"), 10);
    if (!isFinite(autoplaySpeedSeconds)) autoplaySpeedSeconds = 28;

    if (!viewport || !track) return;

    var autoSpeedPxPerTick = 0.25;
    var isPaused = false;
    var intervalId = null;
    var originalWidth = 0;

    var originalSlides = Array.prototype.slice.call(track.querySelectorAll(".custom-videos-slider__slide"));
    if (!originalSlides.length) return;

    // Duplicate slides once for seamless looping.
    originalSlides.forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("data-slide-clone", "true");
      track.appendChild(clone);
    });

    originalWidth = track.scrollWidth / 2;

    function computeAutoSpeed() {
      var seconds = Math.max(1, autoplaySpeedSeconds);
      // Movement time is the time to complete one seamless loop.
      // Low floor so long durations stay slow even on narrow tracks.
      var pxPerSecond = Math.max(2, originalWidth / seconds);
      // 16ms interval => ~60 ticks/second
      autoSpeedPxPerTick = pxPerSecond / 60;
    }

    function getSlideStep() {
      var firstSlide = section.querySelector(".custom-videos-slider__slide");
      if (!firstSlide) return viewport.clientWidth;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return firstSlide.getBoundingClientRect().width + gap;
    }

    function scrollByStep(direction) {
      viewport.scrollBy({
        left: direction * getSlideStep(),
        behavior: "smooth",
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        scrollByStep(-1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        scrollByStep(1);
      });
    }

    function updateSoundToggle(toggle, isUnmuted) {
      if (!toggle) return;
      toggle.classList.toggle("is-unmuted", isUnmuted);
      toggle.setAttribute("aria-pressed", isUnmuted ? "true" : "false");
      toggle.setAttribute("aria-label", isUnmuted ? "Mute video" : "Unmute video");
    }

    function tickTrack() {
      if (!isPaused) {
        viewport.scrollLeft += autoSpeedPxPerTick;
        if (viewport.scrollLeft >= originalWidth) {
          viewport.scrollLeft -= originalWidth;
        }
      }
    }

    function pauseAutoScroll() {
      if (!isCarouselAutoplayEnabled) return;
      isPaused = true;
    }

    function resumeAutoScroll() {
      if (!isCarouselAutoplayEnabled) return;
      isPaused = false;
    }

    viewport.addEventListener("mouseenter", function () {
      if (isDragging) return;
      pauseAutoScroll();
    });
    viewport.addEventListener("mouseleave", function () {
      if (isDragging) return;
      resumeAutoScroll();
    });
    // Desktop drag to scroll support.
    var isDragging = false;
    var isPointerDown = false;
    var dragStartX = 0;
    var dragStartLeft = 0;
    var dragThreshold = 6;

    function onPointerDown(event) {
      if (window.matchMedia("(max-width: 989px)").matches) return;
      if (event.button !== 0) return;

      isPointerDown = true;
      isDragging = false;
      dragStartX = event.clientX;
      dragStartLeft = viewport.scrollLeft;
    }

    function onPointerMove(event) {
      if (!isPointerDown) return;
      var deltaX = event.clientX - dragStartX;

      if (!isDragging && Math.abs(deltaX) >= dragThreshold) {
        isDragging = true;
        if (isCarouselAutoplayEnabled) {
          pauseAutoScroll();
        }
        viewport.classList.add("is-dragging");
      }

      if (!isDragging) return;
      viewport.scrollLeft = dragStartLeft - deltaX;
    }

    function onPointerUp() {
      if (!isPointerDown) return;
      isPointerDown = false;

      if (isDragging) {
        isDragging = false;
        viewport.classList.remove("is-dragging");
        // Resume only after pointer leaves the carousel area.
        if (isCarouselAutoplayEnabled && !viewport.matches(":hover")) {
          resumeAutoScroll();
        }
      }
    }

    viewport.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    var cards = section.querySelectorAll(".custom-videos-slider__media-wrap");
    cards.forEach(function (card) {
      var video = card.querySelector("[data-slider-video]");
      var toggle = card.querySelector("[data-sound-toggle]");
      var progressFill = card.querySelector("[data-video-progress-fill]");
      if (!video || !toggle) return;

      video.muted = true;
      updateSoundToggle(toggle, false);

      function updateProgress() {
        if (!progressFill) return;
        if (!video.duration || !isFinite(video.duration)) {
          progressFill.style.width = "0%";
          return;
        }
        var percent = (video.currentTime / video.duration) * 100;
        progressFill.style.width = Math.max(0, Math.min(100, percent)) + "%";
      }

      video.addEventListener("timeupdate", updateProgress);
      video.addEventListener("loadedmetadata", updateProgress);
      video.addEventListener("ended", function () {
        if (progressFill) {
          progressFill.style.width = "0%";
        }
      });

      card.addEventListener("mouseenter", function () {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      });
      card.addEventListener("mouseleave", function () {
        video.pause();
        updateProgress();
      });

      toggle.addEventListener("click", function () {
        if (video.muted) {
          video.muted = false;
          updateSoundToggle(toggle, true);
        } else {
          video.muted = true;
          updateSoundToggle(toggle, false);
        }
      });
    });

    if (isCarouselAutoplayEnabled) {
      viewport.scrollLeft = viewport.scrollLeft || 1;
      computeAutoSpeed();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(tickTrack, 16);
    }

    window.addEventListener("resize", function () {
      originalWidth = track.scrollWidth / 2;
      computeAutoSpeed();
    });
  });
})();
