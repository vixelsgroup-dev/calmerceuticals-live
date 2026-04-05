!(function () {
  "use strict";
  if (customElements.get("columns-slider")) return;

  customElements.define(
    "columns-slider",
    class extends HTMLElement {
      constructor() {
        super();
        this.flkty = null;
        this.gutter = 0;
        this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
      }

      connectedCallback() {
        this.checkSlidesSize();
        document.addEventListener("theme:resize:width", this.checkSlidesSizeOnResize);
      }

      initSlider() {
        this.classList.remove("carousel--inactive");
        this.flkty = new window.theme.Flickity(this, {
          pageDots: false,
          cellAlign: "left",
          groupCells: false,
          contain: true,
          wrapAround: true,
          on: {
            ready: () => {
              //this.setSliderArrowsPosition(this);
              setTimeout(() => {
                this.changeTabIndex();
                this.flkty.resize();
              }, 0);
            },
            change: () => {
              this.changeTabIndex();
            },
          },
        });
        this.createResizeClass();
      }

      createResizeClass() {
        if (typeof window.theme.Flickity.prototype._createResizeClass === "function") return;

        window.theme.Flickity.prototype._createResizeClass = function () {
          this.element.classList.add("carousel--resize");
        };
        window.theme.Flickity.createMethods.push("_createResizeClass");

        const originalResize = window.theme.Flickity.prototype.resize;
        window.theme.Flickity.prototype.resize = function () {
          this.element.classList.remove("carousel--resize");
          originalResize.call(this);
          this.element.classList.add("carousel--resize");
        };
      }

      destroySlider() {
        this.classList.add("carousel--inactive");
        if (this.flkty !== null) {
          this.flkty.destroy();
          this.flkty = null;
        }
      }

      checkSlidesSize() {
        const first = this.querySelector("[data-slider-item]");
        if (!first) return;

        const styles = first.currentStyle || window.getComputedStyle(first);
        this.gutter = parseInt(styles.marginRight, 10) || 0;

        const needsCarousel = this.offsetWidth < this.getItemsWidth();
        if (window.innerWidth >= theme.sizes.small && needsCarousel) {
          this.initSlider();
        } else {
          this.destroySlider();
        }
      }

      changeTabIndex() {
        const selected = this.flkty.selectedIndex;
        this.flkty.slides.forEach((slide, i) => {
          slide.cells.forEach((cell) => {
            cell.element.querySelectorAll("a, button").forEach((el) => {
              el.setAttribute("tabindex", selected === i ? "0" : "-1");
            });
          });
        });
      }

      getItemsWidth() {
        let total = 0;
        const items = this.querySelectorAll("[data-slider-item]");
        if (items.length) {
          items.forEach((el) => {
            total += el.offsetWidth + this.gutter;
          });
        }
        return total;
      }

      disconnectedCallback() {
        document.removeEventListener("theme:resize:width", this.checkSlidesSizeOnResize);
      }
    }
  );
})();