
/*
* @license
* Palo Alto Theme (c)
*
* This file is included for advanced development by
* Shopify Agencies.  Modified versions of the theme
* code are not supported by Shopify or Presidio Creative.
*
* In order to use this file you will need to change
* theme.js to theme.dev.js in /layout/theme.liquid
*
*/

// ======================================================================
// Button text updater (shared)
// ======================================================================
if (typeof window.updateProgramCardButtons !== 'function') {
  window.updateProgramCardButtons = function () {
    document.querySelectorAll('.program-card .select-btn-main button').forEach(function (btn) {
      var card = btn.closest('.program-card');
      if (!card) return;

      if (card.classList.contains('program-card--active')) {
        btn.textContent = 'Selected';
      } else {
        btn.textContent = 'Select';
      }
    });
  };
}

// ======================================================================
// Helper: update the main + compare price on a program card
// ======================================================================
function updateProgramCardPrice(card, variantId, planId) {
  if (!window.variantPricing) return;

  var variantData = window.variantPricing[variantId];
  if (!variantData) return;

  var priceEl = card.querySelector('.program-card__price');
  if (!priceEl) return;

  var isOneTime = card.classList.contains('program-card--one-time');
  var data;

  if (isOneTime) {
    data = variantData.one_time;
  } else {
    if (!planId) return;
    data = variantData.selling_plans && variantData.selling_plans[planId];
  }

  if (!data) return;

  // ✅ Update main price
  if (data.price_formatted) {
    priceEl.textContent = data.price_formatted;
  }

  // ✅ Handle compare-at price (strikethrough)
  var compareEl = card.querySelector('.program-card__price--compare');
  var priceCents = Number(data.price || 0);
  var compareCents = Number(data.compare_price || 0);

  var shouldShowCompare = compareCents > priceCents && compareCents > 0;

  if (shouldShowCompare) {
    // If the element doesn't exist yet (e.g. initial variant had no discount), create it
    if (!compareEl) {
      compareEl = document.createElement('s');
      compareEl.className = 'program-card__price--compare';

      var pricesWrapper = priceEl.parentElement;
      if (pricesWrapper) {
        pricesWrapper.insertBefore(compareEl, priceEl);
      }
    }

    compareEl.textContent = data.compare_price_formatted;
    compareEl.style.display = '';
  } else if (compareEl) {
    compareEl.style.display = 'none';
  }

  // ✅ NEW: update the discount badge (Save X%)
  var badge = card.querySelector('.discount-badge');
  var badgeAmount = badge && badge.querySelector('.subscription-save-amount');

  var hasDiscount = shouldShowCompare;

  if (hasDiscount) {
    // Calculate percentage from cents safely
    var rawPercent = 0;

    if (compareCents > 0 && compareCents > priceCents) {
      rawPercent = ((compareCents - priceCents) * 100) / compareCents;
    }

    var percent = Math.round(rawPercent);

    // If badge doesn't exist yet, create it in the same structure as Liquid
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'discount-badge badge';
      badge.innerHTML = `
        Save
        <span class="subscription-save-amount-main">
          <span class="subscription-save-amount"></span>%
        </span>
      `;

      // Put it into the card (top-right like your CSS expects)
      card.appendChild(badge);
      badgeAmount = badge.querySelector('.subscription-save-amount');
    }

    if (badgeAmount) {
      badgeAmount.textContent = percent;
    }

    badge.style.display = '';
  } else if (badge) {
    // No discount anymore for this variant/plan
    badge.style.display = 'none';
  }
}

(function (scrollLock) {
    'use strict';

    (function() {
        const env = {"NODE_ENV":"production"};
        try {
            if (process) {
                process.env = Object.assign({}, process.env);
                Object.assign(process.env, env);
                return;
            }
        } catch (e) {} // avoid ReferenceError: process is not defined
        globalThis.process = { env:env };
    })();

    window.theme = window.theme || {};

    window.theme.sizes = {
      mobile: 480,
      small: 768,
      large: 1024,
      widescreen: 1440,
    };

    window.theme.keyboardKeys = {
      TAB: 'Tab',
      ENTER: 'Enter',
      NUMPADENTER: 'NumpadEnter',
      ESCAPE: 'Escape',
      SPACE: 'Space',
      LEFTARROW: 'ArrowLeft',
      RIGHTARROW: 'ArrowRight',
    };

    window.theme.focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    window.theme.getWindowWidth = function () {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    };

    window.theme.getWindowHeight = function () {
      return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    };

    window.theme.isDesktop = function () {
      return window.theme.getWindowWidth() >= window.theme.sizes.small;
    };

    window.theme.isMobile = function () {
      return window.theme.getWindowWidth() < window.theme.sizes.small;
    };

    /**
     * Currency Helpers
     * -----------------------------------------------------------------------------
     * A collection of useful functions that help with currency formatting
     *
     * Current contents
     * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
     *
     */

    const moneyFormat = '${{amount}}';

    /**
     * Format money values based on your shop currency settings
     * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
     * or 3.00 dollars
     * @param  {String} format - shop money_format setting
     * @return {String} value - formatted value
     */
    window.theme.formatMoney = function (cents, format) {
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      let value = '';
      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const formatString = format || moneyFormat;

      function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
        if (isNaN(number) || number == null) {
          return 0;
        }

        number = (number / 100.0).toFixed(precision);

        const parts = number.split('.');
        const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
        const centsAmount = parts[1] ? decimal + parts[1] : '';

        return dollarsAmount + centsAmount;
      }

      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_with_apostrophe_separator':
          value = formatWithDelimiters(cents, 2, "'", '.');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ', '');
          break;
        case 'amount_with_space_separator':
          value = formatWithDelimiters(cents, 2, ' ', ',');
          break;
        case 'amount_with_period_and_space_separator':
          value = formatWithDelimiters(cents, 2, ' ', '.');
          break;
      }

      return formatString.replace(placeholderRegex, value);
    };

    window.theme.debounce = function (fn, time) {
      let timeout;
      return function () {
        // eslint-disable-next-line prefer-rest-params
        if (fn) {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
      };
    };

    const selectors$o = {
      body: 'body',
      main: '[data-main]',
      collectionFilters: '[data-collection-filters]',
      footer: '[data-section-type*="footer"]',
      header: '[data-header-height]',
      stickyHeader: '[data-site-header][data-position="fixed"]',
      announcementBar: '[data-announcement-bar]',
      collectionStickyBar: '[data-collection-sticky-bar]',
      logoTextLink: '[data-logo-text-link]',
    };

    const classes$l = {
      templateCollection: 'template-collection',
      templateSearch: 'template-search',
      supportsTransparentHeader: 'supports-transparent-header',
    };

    window.theme.getScreenOrientation = function () {
      if (window.matchMedia('(orientation: portrait)').matches) {
        return 'portrait';
      }

      if (window.matchMedia('(orientation: landscape)').matches) {
        return 'landscape';
      }
    };

    let screenOrientation = window.theme.getScreenOrientation();

    window.theme.readHeights = function () {
      const h = {};
      h.windowHeight = Math.min(window.screen.height, window.innerHeight);
      h.footerHeight = getHeight(selectors$o.footer);
      h.headerHeight = getHeight(selectors$o.header);
      h.stickyHeaderHeight = isHeaderSticky() ? window.stickyHeaderHeight : 0;
      h.headerInitialHeight = parseInt(document.querySelector(selectors$o.header)?.dataset.height || document.querySelector(selectors$o.header)?.offsetHeight) || 0;
      h.announcementBarHeight = getHeight(selectors$o.announcementBar);
      h.collectionStickyBarHeight = getHeight(selectors$o.collectionStickyBar);
      return h;
    };

    function setVarsOnResize() {
      document.addEventListener('theme:resize', resizeVars);
      window.theme.setVars();
      document.dispatchEvent(new CustomEvent('theme:vars'), {bubbles: false});
    }

    window.theme.setVars = function () {
      calcVars();
    };

    function resizeVars() {
      // restrict the heights that are changed on resize to avoid iOS jump when URL bar is shown and hidden
      calcVars(true);
    }

    function calcVars(checkOrientation = false) {
      const body = document.querySelector(selectors$o.body);
      const hasCollectionFilters = document.querySelector(selectors$o.collectionFilters);
      const hasLogoTextLink = document.querySelector(selectors$o.logoTextLink) !== null;

      let {windowHeight, headerHeight, headerInitialHeight, announcementBarHeight, footerHeight, collectionStickyBarHeight} = window.theme.readHeights();

      if (hasLogoTextLink) headerHeight = recalcHeaderHeight();

      const contentFullHeight = window.isHeaderTransparent && checkFirstSectionTransparency() ? windowHeight - announcementBarHeight : windowHeight - headerInitialHeight - announcementBarHeight;
      let fullHeight = isHeaderSticky() ? windowHeight - window.stickyHeaderHeight : windowHeight;
      const isCollectionPage = body.classList.contains(classes$l.templateCollection);
      const isSearchPage = body.classList.contains(classes$l.templateSearch);
      const isPageWithFilters = (isCollectionPage && hasCollectionFilters) || (isSearchPage && hasCollectionFilters);

      document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
      document.documentElement.style.setProperty('--content-full', `${contentFullHeight}px`);
      document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);
      document.documentElement.style.setProperty('--collection-sticky-bar-height', `${collectionStickyBarHeight}px`);

      if (isPageWithFilters) fullHeight = windowHeight;

      if (!checkOrientation) {
        document.documentElement.style.setProperty('--full-height', `${fullHeight}px`);
        return;
      }

      const currentScreenOrientation = window.theme.getScreenOrientation();
      if (currentScreenOrientation !== screenOrientation) {
        // Only update the heights on screen orientation change
        document.documentElement.style.setProperty('--full-height', `${fullHeight}px`);

        // Update the screen orientation state
        screenOrientation = currentScreenOrientation;
      }
    }

    function getHeight(selector) {
      const el = document.querySelector(selector);
      if (el) {
        if (el.hasAttribute('data-collection-sticky-bar')) {
          document.documentElement.style.setProperty('--collection-sticky-bar-height', `auto`);
        }
        return el.clientHeight;
      } else {
        return 0;
      }
    }

    function checkFirstSectionTransparency() {
      const firstSection = document.querySelector(selectors$o.main).firstElementChild;
      return firstSection.classList.contains(classes$l.supportsTransparentHeader);
    }

    function isHeaderSticky() {
      return document.querySelector(selectors$o.stickyHeader);
    }

    function recalcHeaderHeight() {
      document.documentElement.style.setProperty('--header-height', 'auto');
      document.documentElement.style.setProperty('--header-sticky-height', 'auto');

      // Header is declared here to avoid `offsetHeight` returning zero when the element has not been rendered to the DOM yet in the Theme editor
      const header = document.querySelector(selectors$o.header);
      const resetHeight = header.offsetHeight;

      // requestAnimationFrame method is needed to properly update the CSS variables on resize after they have been reset
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--header-height', `${resetHeight}px`);
        document.documentElement.style.setProperty('--header-sticky-height', `${resetHeight}px`);
      });

      return resetHeight;
    }

    window.addEventListener('DOMContentLoaded', setVarsOnResize);
    document.addEventListener('shopify:section:load', setVarsOnResize);

    window.theme.scrollTo = (elementTop) => {
      const {stickyHeaderHeight} = window.theme.readHeights();

      window.scrollTo({
        top: elementTop + Math.round(window.scrollY) - stickyHeaderHeight,
        left: 0,
        behavior: 'smooth',
      });
    };

    const a11y = {
      /**
       * A11y Helpers
       * -----------------------------------------------------------------------------
       * A collection of useful functions that help make your theme more accessible
       */

      state: {
        firstFocusable: null,
        lastFocusable: null,
        trigger: null,
        mainTrigger: null,
      },

      trapFocus: function (options) {
        var focusableElements = Array.from(options.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])')).filter(function (element) {
          var width = element.offsetWidth;
          var height = element.offsetHeight;

          return width !== 0 && height !== 0 && getComputedStyle(element).getPropertyValue('display') !== 'none';
        });

        focusableElements = focusableElements.filter(function (element) {
          return !element.classList.contains('deferred-media__poster');
        });

        this.state.firstFocusable = focusableElements[0];
        this.state.lastFocusable = focusableElements[focusableElements.length - 1];

        if (!options.elementToFocus) {
          options.elementToFocus = this.state.firstFocusable || options.container;
        }
        this._setupHandlers();

        document.addEventListener('focusin', this._onFocusInHandler);
        document.addEventListener('focusout', this._onFocusOutHandler);

        options.container.setAttribute('tabindex', '-1');
        options.elementToFocus.focus();
      },

      removeTrapFocus: function (options) {
        const focusVisible = !document.body.classList.contains('no-outline');
        if (options && options.container) {
          options.container.removeAttribute('tabindex');
        }
        document.removeEventListener('focusin', this._onFocusInHandler);

        if (this.state.trigger && focusVisible) {
          this.state.trigger.focus();
        }
      },

      _manageFocus: function (evt) {
        if (evt.code !== theme.keyboardKeys.TAB) {
          return;
        }

        /**
         * On the last focusable element and tab forward,
         * focus the first element.
         */
        if (evt.target === this.state.lastFocusable && !evt.shiftKey) {
          evt.preventDefault();
          this.state.firstFocusable.focus();
        }

        /**
         * On the first focusable element and tab backward,
         * focus the last element.
         */
        if (evt.target === this.state.firstFocusable && evt.shiftKey) {
          evt.preventDefault();
          this.state.lastFocusable.focus();
        }
      },

      _onFocusOut: function () {
        document.removeEventListener('keydown', this._manageFocusHandler);
      },

      _onFocusIn: function (evt) {
        if (evt.target !== this.state.lastFocusable && evt.target !== this.state.firstFocusable) {
          return;
        }

        document.addEventListener('keydown', this._manageFocusHandler);
      },

      _setupHandlers: function () {
        if (!this._onFocusInHandler) {
          this._onFocusInHandler = this._onFocusIn.bind(this);
        }

        if (!this._onFocusOutHandler) {
          this._onFocusOutHandler = this._onFocusIn.bind(this);
        }

        if (!this._manageFocusHandler) {
          this._manageFocusHandler = this._manageFocus.bind(this);
        }
      },
    };

    window.theme = window.theme || {};
    window.theme.a11y = a11y;

    window.theme.throttle = (fn, wait) => {
      let prev, next;
      return function invokeFn(...args) {
        const now = Date.now();
        next = clearTimeout(next);
        if (!prev || now - prev >= wait) {
          // eslint-disable-next-line prefer-spread
          fn.apply(null, args);
          prev = now;
        } else {
          next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
        }
      };
    };

    window.theme.wrap = (toWrap, wrapperClass = '', wrapperOption) => {
      const wrapper = wrapperOption || document.createElement('div');
      wrapper.classList.add(wrapperClass);
      wrapper.setAttribute('data-scroll-lock-scrollable', '');
      toWrap.parentNode.insertBefore(wrapper, toWrap);
      return wrapper.appendChild(toWrap);
    };

    window.theme.wrapElements = function (container) {
      // Target tables to make them scrollable
      const tableSelectors = 'table';
      const tables = container.querySelectorAll(tableSelectors);
      tables.forEach((table) => {
        window.theme.wrap(table, 'table-wrapper');
      });
    };

    window.addEventListener('DOMContentLoaded', window.theme.wrapElements(document));

    document.addEventListener('shopify:section:load', (e) => window.theme.wrapElements(e.target));

    const selectors$n = {
      overflowBackground: '[data-overflow-background]',
      overflowFrame: '[data-overflow-frame]',
      overflowContent: '[data-overflow-content]',
      overflowContainer: '[data-overflow-container]',
      overflowWrapper: '[data-overflow-wrapper]',
    };

    function singles(frame, wrappers) {
      // sets the height of any frame passed in with the
      // tallest preventOverflowContent as well as any image in that frame
      let tallest = 0;

      wrappers.forEach((wrap) => {
        tallest = wrap.offsetHeight > tallest ? wrap.offsetHeight : tallest;
      });
      const images = frame.querySelectorAll(selectors$n.overflowBackground);
      const frames = [frame, ...images];
      frames.forEach((el) => {
        el.style.setProperty('min-height', `calc(${tallest}px + var(--header-height))`);
      });
    }

    function doubles(section) {
      if (window.innerWidth < window.theme.sizes.small) {
        // if we are below the small breakpoint, the double section acts like two independent
        // single frames
        let singleFrames = section.querySelectorAll(selectors$n.overflowFrame);
        singleFrames.forEach((singleframe) => {
          const wrappers = singleframe.querySelectorAll(selectors$n.overflowContent);
          singles(singleframe, wrappers);
        });
        return;
      }

      let tallest = 0;

      const frames = section.querySelectorAll(selectors$n.overflowFrame);
      const contentWrappers = section.querySelectorAll(selectors$n.overflowContent);
      contentWrappers.forEach((content) => {
        if (content.offsetHeight > tallest) {
          tallest = content.offsetHeight;
        }
      });
      const images = section.querySelectorAll(selectors$n.overflowBackground);
      let applySizes = [...frames, ...images];
      applySizes.forEach((el) => {
        el.style.setProperty('min-height', `${tallest}px`);
      });
      section.style.setProperty('min-height', `${tallest}px`);
    }

    function preventOverflow(container) {
      const singleFrames = container.querySelectorAll(selectors$n.overflowContainer);
      if (singleFrames) {
        singleFrames.forEach((frame) => {
          const wrappers = frame.querySelectorAll(selectors$n.overflowContent);
          singles(frame, wrappers);
          document.addEventListener('theme:resize', () => {
            singles(frame, wrappers);
          });
        });
      }

      const doubleSections = container.querySelectorAll(selectors$n.overflowWrapper);
      if (doubleSections) {
        doubleSections.forEach((section) => {
          doubles(section);
          document.addEventListener('theme:resize', () => {
            doubles(section);
          });
        });
      }
    }

    window.lastWindowWidth = window.innerWidth;

    function dispatchResizeEvent() {
      document.dispatchEvent(
        new CustomEvent('theme:resize', {
          bubbles: true,
        })
      );

      if (window.lastWindowWidth !== window.innerWidth) {
        document.dispatchEvent(
          new CustomEvent('theme:resize:width', {
            bubbles: true,
          })
        );

        window.lastWindowWidth = window.innerWidth;
      }
    }

    function resizeListener() {
      window.addEventListener('resize', window.theme.debounce(dispatchResizeEvent, 50));
    }

    let prev = window.pageYOffset;
    let up = null;
    let down = null;
    let wasUp = null;
    let wasDown = null;
    let scrollLockTimer = 0;

    const classes$k = {
      quickViewVisible: 'js-quick-view-visible',
      cartDrawerOpen: 'js-drawer-open-cart',
    };

    function dispatchScrollEvent() {
      const position = window.pageYOffset;
      if (position > prev) {
        down = true;
        up = false;
      } else if (position < prev) {
        down = false;
        up = true;
      } else {
        up = null;
        down = null;
      }
      prev = position;
      document.dispatchEvent(
        new CustomEvent('theme:scroll', {
          detail: {
            up,
            down,
            position,
          },
          bubbles: false,
        })
      );
      if (up && !wasUp) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:up', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      if (down && !wasDown) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:down', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      wasDown = down;
      wasUp = up;
    }

    function lock(e) {
      // Prevent body scroll lock race conditions
      setTimeout(() => {
        if (scrollLockTimer) {
          clearTimeout(scrollLockTimer);
        }

        scrollLock.disablePageScroll(e.detail, {
          allowTouchMove: (el) => el.tagName === 'TEXTAREA',
        });

        document.documentElement.setAttribute('data-scroll-locked', '');
      });
    }

    function unlock(e) {
      const timeout = e.detail;

      if (timeout) {
        scrollLockTimer = setTimeout(removeScrollLock, timeout);
      } else {
        removeScrollLock();
      }
    }

    function removeScrollLock() {
      const isPopupVisible = document.body.classList.contains(classes$k.quickViewVisible) || document.body.classList.contains(classes$k.cartDrawerOpen);

      if (!isPopupVisible) {
        scrollLock.clearQueueScrollLocks();
        scrollLock.enablePageScroll();
        document.documentElement.removeAttribute('data-scroll-locked');
      }
    }

    function scrollListener() {
      let timeout;
      window.addEventListener(
        'scroll',
        function () {
          if (timeout) {
            window.cancelAnimationFrame(timeout);
          }
          timeout = window.requestAnimationFrame(function () {
            dispatchScrollEvent();
          });
        },
        {passive: true}
      );

      window.addEventListener('theme:scroll:lock', lock);
      window.addEventListener('theme:scroll:unlock', unlock);
    }

    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }

    function isTouch() {
      if (isTouchDevice()) {
        document.documentElement.className = document.documentElement.className.replace('no-touch', 'supports-touch');
        window.theme.touch = true;
      } else {
        window.theme.touch = false;
      }
    }

    const classes$j = {
      loading: 'is-loading',
      imgIn: 'img-in',
    };

    const selectors$m = {
      img: 'img.is-loading',
      section: '[data-section-type]',
    };

    /*
      Catch images loaded events and add class "is-loaded" to them and their containers
    */
    function loadedImagesEventHook() {
      document.addEventListener(
        'load',
        (e) => {
          if (e.target.tagName.toLowerCase() == 'img' && e.target.classList.contains(classes$j.loading)) {
            e.target.classList.remove(classes$j.loading);
            e.target.parentNode.classList.remove(classes$j.loading);

            const section = e.target.closest(selectors$m.section);
            if (section) section.classList.add(classes$j.imgIn);
          }
        },
        true
      );
    }

    /*
      Remove "is-loading" class to the loaded images and their containers
    */
    function removeLoadingClassFromLoadedImages(container) {
      container.querySelectorAll(selectors$m.img).forEach((img) => {
        if (img.complete) {
          img.classList.remove(classes$j.loading);
          img.parentNode.classList.remove(classes$j.loading);

          const section = img.closest(selectors$m.section);
          if (section) section.classList.add(classes$j.imgIn);
        }
      });
    }

    /**
     * This component prevents any HTML from being loaded,
     * until user's cursor is over the component or over specific trigger referenced by the <deferred-loading> element.
     * The main focus is for deferred loading of images.
     * Loading is triggered by a 'mouseenter' event rendering depends on a `<template>` element that should hold all of the HTML
     *
     * @example
     *  <deferred-loading data-deferred-container=".parent-container-selector" data-deferred-triggers=".button-element-selector">
     *    <template>
     *      <div data-deferred-content>
     *        // Insert deferred markup or images here:
     *        {%- render 'image', image: section.settings.image_1 -%}
     *        {%- render 'image', image: section.settings.image_2 -%}
     *      </div>
     *    </template>
     *  </deferred-loading>
     */
    const selectors$l = {
      img: 'img',
      template: 'template',
      shopifySection: '.shopify-section',
      deferredContent: '[data-deferred-content]',
      reloadSrcsetException: '[data-product-image]',
    };

    const attributes$e = {
      srcset: 'srcset',
      loaded: 'data-loaded',
      deferredContainer: 'data-deferred-container',
    };

    class DeferredLoading extends HTMLElement {
      constructor() {
        super();

        this.container = this;
        if (this.hasAttribute(attributes$e.deferredContainer)) {
          this.container = this.closest(this.getAttribute(attributes$e.deferredContainer)) || this.closest(selectors$l.shopifySection);
        }

        this.deferredTriggers = this.container.querySelectorAll(this.dataset.deferredTriggers);
      }

      connectedCallback() {
        if (this.deferredTriggers.length == 0) {
          this.container.addEventListener(
            'mouseenter',
            () => {
              if (this.hasAttribute(attributes$e.loaded)) return;
              this.loadTemplate();
            },
            {once: true}
          );

          return;
        }

        this.deferredTriggers.forEach((trigger) => {
          trigger.addEventListener(
            'mouseenter',
            () => {
              if (this.hasAttribute(attributes$e.loaded)) return;
              this.loadTemplate();
            },
            {once: true}
          );
        });
      }

      loadTemplate() {
        const content = document.createElement('div');
        const template = this.querySelector(selectors$l.template);
        if (!template || !template?.content?.firstElementChild) return;

        content.appendChild(template.content.firstElementChild.cloneNode(true));

        const deferredContent = content.querySelector(selectors$l.deferredContent);
        if (!deferredContent) return;

        this.append(deferredContent);
        this.setAttribute(attributes$e.loaded, true);

        const containsImages = deferredContent.querySelectorAll(selectors$l.img).length > 0;
        if (containsImages) {
          this.reloadSrcset(this);
        }
      }

      // Reload srcset for correct image render on Safari - fixes 'object-fit: cover' issues
      reloadSrcset(container) {
        if (!container) return;
        container.querySelectorAll(selectors$l.img).forEach((img) => {
          const reloadSrcsetException = img.parentNode.matches(selectors$l.reloadSrcsetException);

          if (!reloadSrcsetException) {
            const srcset = img.getAttribute(attributes$e.srcset);
            img.setAttribute(attributes$e.srcset, '');
            img.setAttribute(attributes$e.srcset, srcset);
          }
        });
      }
    }

    const selectors$k = {
      shopifySection: '.shopify-section',
      slider: '[data-slider]',
      holder: '[data-hover-slideshow-holder]',
      item: '[data-hover-slideshow-item]',
      progress: '[data-hover-slideshow-progress]',
      flickityButton: '.flickity-button',
    };

    const classes$i = {
      fill: 'fill',
    };

    class HoverSlideshow extends HTMLElement {
      constructor() {
        super();
      }
      get holder() {
        return this.querySelector(selectors$k.holder);
      }
      get items() {
        return [...this.querySelectorAll(selectors$k.item)];
      }
      get progress() {
        return this.querySelector(selectors$k.progress);
      }

      connectedCallback() {
        if (theme.settings.productGridHover === 'slideshow' && !window.theme.touch) {
          this.init();
        }
      }

      init() {
        this.section = this.closest(selectors$k.shopifySection);
        this.outerSliders = this.section.querySelectorAll(selectors$k.slider);
        this.autoplaySpeed = 2200;
        this.timer = 0;
        this.flkty = new window.theme.Flickity.data(this.holder);

        if (!this.flkty.isActive && this.items.length > 1) {
          this.flkty = new window.theme.Flickity(this.holder, {
            draggable: !this.outerSliders.length, // Enable dragging only if there is no outer slider
            cellSelector: selectors$k.item,
            contain: true,
            wrapAround: true,
            imagesLoaded: true,
            pageDots: false,
            prevNextButtons: false,
            adaptiveHeight: false,
            pauseAutoPlayOnHover: false,
            selectedAttraction: 0.2,
            friction: 1,
            on: {
              ready: () => {
                this.section.style.setProperty('--autoplay-speed', `${this.autoplaySpeed}ms`);
                setTimeout(() => this.flkty.resize(), 1e3);
              },
              change: () => {
                if (this.timer) clearTimeout(this.timer);

                this.progress.classList.remove(classes$i.fill);
                this.progress.offsetWidth; // Force a reflow to ensure the remove class takes effect immediately

                requestAnimationFrame(() => this.progress.classList.add(classes$i.fill));
                this.timer = setTimeout(() => this.progress.classList.remove(classes$i.fill), this.autoplaySpeed);
              },
              dragEnd: () => {
                this.flkty.playPlayer();
              },
            },
          });

          this.addEventListener('mouseenter', () => {
            this.progress.classList.add(classes$i.fill);

            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(() => this.progress.classList.remove(classes$i.fill), this.autoplaySpeed);

            this.flkty.options.autoPlay = this.autoplaySpeed;
            this.flkty.playPlayer();
          });

          this.addEventListener('mouseleave', () => {
            this.flkty.stopPlayer();
            if (this.timer) clearTimeout(this.timer);
            this.progress.classList.remove(classes$i.fill);
          });
        }

        // Prevent page redirect on slideshow arrow click
        this.addEventListener('click', (event) => {
          if (event.target.matches(selectors$k.flickityButton)) {
            event.preventDefault();
          }
        });
      }
    }

    const classes$h = {
      top: 'btn--top',
      right: 'btn--right',
      bottom: 'btn--bottom',
      left: 'btn--left',
      text: 'btn--text',
    };

    class HoverButtons extends HTMLElement {
      constructor() {
        super();
        this.button = this.parentElement;
        this.class = '';
        // Bind methods to ensure correct `this` context
        this.detectEntrySide = this.detectEntrySide.bind(this);
      }

      connectedCallback() {
        if (this.button.classList.contains(classes$h.text)) return;

        // Attach the mouse event listeners
        this.button.addEventListener('mouseenter', this.detectEntrySide);
      }

      // Detect from which side the mouse enters
      detectEntrySide(event) {
        const buttonRect = this.button.getBoundingClientRect();
        if (this.class) this.button.classList.remove(this.class);
        const x = event.clientX;
        const y = event.clientY;

        const left = buttonRect.left;
        const right = buttonRect.right;
        const top = buttonRect.top;
        const bottom = buttonRect.bottom;

        // Calculate distances from each side
        const distanceFromLeft = x - left;
        const distanceFromRight = right - x;
        const distanceFromTop = y - top;
        const distanceFromBottom = bottom - y;

        // Determine which side the cursor is closest to
        if (distanceFromLeft < distanceFromRight && distanceFromLeft < distanceFromTop && distanceFromLeft < distanceFromBottom) {
          this.class = classes$h.left;
        } else if (distanceFromRight < distanceFromLeft && distanceFromRight < distanceFromTop && distanceFromRight < distanceFromBottom) {
          this.class = classes$h.right;
        } else if (distanceFromTop < distanceFromLeft && distanceFromTop < distanceFromRight && distanceFromTop < distanceFromBottom) {
          this.class = classes$h.top;
        } else {
          this.class = classes$h.bottom;
        }
        this.button.classList.add(this.class);
      }

      disconnectedCallback() {
        // Clean up event listeners when the element is removed
        this.button.removeEventListener('mouseenter', this.detectEntrySide);
      }
    }

    const selectors$j = {
      inputSearch: 'input[type="search"]',
      inputType: 'input[name="type"]',
      form: 'form',
      allVisibleElements: '[role="option"]',
      ariaSelected: '[aria-selected="true"]',
      selectedOption: '[aria-selected="true"] a, button[aria-selected="true"]',
      popularSearches: '[data-popular-searches]',
      popdownBody: '[data-popdown-body]',
      mainInputSearch: '[data-main-input-search]',
      predictiveSearchResults: '[data-predictive-search-results]',
      predictiveSearch: 'predictive-search',
      searchForm: 'search-form',
    };

    const classes$g = {
      isSearched: 'is-searched',
      templateSearch: 'template-search',
    };

    class SearchForm extends HTMLElement {
      constructor() {
        super();

        this.input = this.querySelector(selectors$j.inputSearch);
        this.form = this.querySelector(selectors$j.form);
        this.popdownBody = this.closest(selectors$j.popdownBody);
        this.popularSearches = this.popdownBody?.querySelector(selectors$j.popularSearches);
        this.predictiveSearchResults = this.querySelector(selectors$j.predictiveSearchResults);
        this.predictiveSearch = this.matches(selectors$j.predictiveSearch);
        this.searchForm = this.matches(selectors$j.searchForm);
        this.selectedElement = null;
        this.activeElement = null;
        this.searchTerm = '';
        this.currentSearchTerm = '';
        this.isSearchPage = document.body.classList.contains(classes$g.templateSearch);

        this.input.addEventListener(
          'input',
          window.theme
            .debounce((event) => {
              this.onChange(event);
            }, 300)
            .bind(this)
        );

        this.input.addEventListener('focus', this.onFocus.bind(this));
        this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
        this.addEventListener('keyup', this.onKeyup.bind(this));
        this.addEventListener('keydown', this.onKeydown.bind(this));

        if (this.isSearchPage) {
          this.mainInputType = document.querySelector(`${selectors$j.mainInputSearch} ${selectors$j.inputType}`);
          this.inputType = this.querySelector(selectors$j.inputType);
          this.inputType.value = this.mainInputType.value;
        }
      }

      getQuery() {
        return this.input.value.trim();
      }

      onFocus() {
        this.currentSearchTerm = this.getQuery();
      }

      onChange() {
        this.classList.toggle(classes$g.isSearched, !this.isFormCleared());
        this.searchTerm = this.getQuery();
      }

      isFormCleared() {
        return this.input.value.length === 0;
      }

      submit() {
        this.form.submit();
      }

      reset() {
        this.input.val = '';
      }

      onFormSubmit(event) {
        if (!this.getQuery().length || this.querySelector(selectors$j.selectedLink)) event.preventDefault();
      }

      onKeydown(event) {
        // Prevent the cursor from moving in the input when using the up and down arrow keys
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          event.preventDefault();
        }
      }

      onKeyup(event) {
        if (!this.getQuery().length && this.predictiveSearch) {
          this.close(true);
        }
        event.preventDefault();

        switch (event.code) {
          case 'ArrowUp':
            this.switchOption('up');
            break;
          case 'ArrowDown':
            this.switchOption('down');
            break;
          case 'Enter':
            this.selectOption();
            break;
        }
      }

      switchOption(direction) {
        const moveUp = direction === 'up';
        const predictiveSearchOpened = this.classList.contains(classes$g.isSearched) && this.predictiveSearchResults;

        const visibleElementsContainer = predictiveSearchOpened ? this.predictiveSearchResults : this.popularSearches;

        if (!visibleElementsContainer) return;
        this.selectedElement = visibleElementsContainer.querySelector(selectors$j.ariaSelected);

        // Filter out hidden elements
        const allVisibleElements = Array.from(visibleElementsContainer.querySelectorAll(selectors$j.allVisibleElements)).filter((element) => element.offsetParent !== null);

        let activeElementIndex = 0;

        if (moveUp && !this.selectedElement) return;

        let selectedElementIndex = -1;
        let i = 0;

        while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
          if (allVisibleElements[i] === this.selectedElement) {
            selectedElementIndex = i;
          }
          i++;
        }

        if (!moveUp && this.selectedElement) {
          activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
        } else if (moveUp) {
          activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
        }

        if (activeElementIndex === selectedElementIndex) return;

        this.activeElement = allVisibleElements[activeElementIndex];
        this.handleFocusableDescendants();
      }

      selectOption() {
        const selectedOption = this.querySelector(selectors$j.selectedOption);

        if (selectedOption) selectedOption.click();
      }

      handleFocusableDescendants(reset = false) {
        const selected = this.selectedElement ? this.selectedElement : this.querySelector(selectors$j.ariaSelected);
        if (selected) selected.setAttribute('aria-selected', false);

        if (!this.activeElement || reset) {
          this.selectedElement = null;
          this.activeElement?.setAttribute('aria-selected', false);
          this.input.setAttribute('aria-expanded', false);
          this.input.setAttribute('aria-activedescendant', '');
          return;
        }

        this.activeElement.setAttribute('aria-selected', true);
        this.input.setAttribute('aria-activedescendant', this.activeElement.id);
      }
    }

    customElements.define('search-form', SearchForm);

    const selectors$i = {
      predictiveSearch: 'predictive-search',
      sectionPredictiveSearch: '#shopify-section-api-predictive-search',
      predictiveSearchResults: '[data-predictive-search-results]',
      predictiveSearchStatus: '[data-predictive-search-status]',
      searchResultsLiveRegion: '[data-predictive-search-live-region-count-value]',
      searchResultsWrapper: '[data-search-results-wrapper]',
    };

    const classes$f = {
      reset: 'reset',
    };

    const attributes$d = {
      aosAnchor: 'data-aos-anchor',
      ariaHidden: 'aria-hidden',
      open: 'open',
      loading: 'loading',
      loadingText: 'data-loading-text',
      results: 'results',
    };

    class PredictiveSearch extends SearchForm {
      constructor() {
        super();

        this.abortController = new AbortController();
        this.allPredictiveSearchInstances = document.querySelectorAll(selectors$i.predictiveSearch);
        this.predictiveSearchResults = this.querySelector(selectors$i.predictiveSearchResults);
        this.cachedResults = {};
      }

      connectedCallback() {
        this.predictiveSearchResults.addEventListener('transitionend', (event) => {
          if (event.target === this.predictiveSearchResults && !this.getQuery().length) {
            this.classList.remove(classes$f.reset);
            requestAnimationFrame(() => this.clearResultsHTML());
          }
        });
      }

      onChange() {
        super.onChange();
        this.classList.remove(classes$f.reset);

        if (!this.searchTerm.length) {
          this.classList.add(classes$f.reset);
          return;
        }

        requestAnimationFrame(() => this.getSearchResults(this.searchTerm));
      }

      onFocus() {
        super.onFocus();

        if (!this.currentSearchTerm.length) return;

        if (this.searchTerm !== this.currentSearchTerm) {
          // Search term was changed from other search input, treat it as a user change
          this.onChange();
        } else if (this.getAttribute(attributes$d.results) === 'true') {
          this.open();
        } else {
          this.getSearchResults(this.searchTerm);
        }
      }

      getSearchResults(searchTerm) {
        const queryKey = searchTerm.replace(' ', '-').toLowerCase();
        const suggestionsResultsLimit = parseInt(window.theme.settings.suggestionsResultsLimit);
        let resources = 'query';
        resources += window.theme.settings.suggestArticles ? ',article' : '';
        resources += window.theme.settings.suggestCollections ? ',collection' : '';
        resources += window.theme.settings.suggestProducts ? ',product' : '';
        resources += window.theme.settings.suggestPages ? ',page' : '';

        this.setLiveRegionLoadingState();

        if (this.cachedResults[queryKey]) {
          this.renderSearchResults(this.cachedResults[queryKey]);
          return;
        }

        fetch(`${theme.routes.predictiveSearchUrl}?q=${encodeURIComponent(searchTerm)}&resources[type]=${resources}&resources[limit]=${suggestionsResultsLimit}&section_id=api-predictive-search`, {
          signal: this.abortController.signal,
        })
          .then((response) => {
            if (!response.ok) {
              var error = new Error(response.status);
              this.close();
              throw error;
            }

            return response.text();
          })
          .then((text) => {
            const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector(selectors$i.sectionPredictiveSearch).innerHTML;
            // Save bandwidth keeping the cache in all instances synced
            this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
              predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
            });
            this.renderSearchResults(resultsMarkup);
          })
          .catch((error) => {
            if (error?.code === 20) {
              // Code 20 means the call was aborted
              return;
            }
            this.close();
            throw error;
          });
      }

      switchOption(direction) {
        super.switchOption(direction);

        if (this.statusElement) this.statusElement.textContent = '';
      }

      setLiveRegionLoadingState() {
        this.statusElement = this.statusElement || this.querySelector(selectors$i.predictiveSearchStatus);
        this.loadingText = this.loadingText || this.getAttribute(attributes$d.loadingText);

        this.setLiveRegionText(this.loadingText);
        this.setAttribute(attributes$d.loading, true);
      }

      setLiveRegionText(statusText) {
        this.statusElement.setAttribute(attributes$d.ariaHidden, 'false');
        this.statusElement.textContent = statusText;

        setTimeout(() => {
          this.statusElement.setAttribute(attributes$d.ariaHidden, 'true');
        }, 1000);
      }

      renderSearchResults(resultsMarkup) {
        this.predictiveSearchResults.innerHTML = resultsMarkup;

        // Change results container id to fix animations
        const parentId = this.predictiveSearchResults.parentElement.id;
        const el = this.predictiveSearchResults.querySelector(selectors$i.searchResultsWrapper);
        const tempId = el.id;

        el.id = `${tempId}--${parentId}`;
        el.setAttribute(attributes$d.aosAnchor, `#${el.id}`);

        this.setAttribute(attributes$d.results, true);

        this.setLiveRegionResults();
        this.open();
      }

      setLiveRegionResults() {
        this.removeAttribute(attributes$d.loading);
        this.setLiveRegionText(this.querySelector(selectors$i.searchResultsLiveRegion).textContent);
      }

      open() {
        this.setAttribute(attributes$d.open, true);
      }

      close(clearSearchTerm = false) {
        this.closeResults(clearSearchTerm);
      }

      closeResults(clearSearchTerm = false) {
        if (clearSearchTerm) {
          this.reset();
          this.removeAttribute(attributes$d.results);
          this.classList.remove(classes$f.reset);
        }

        this.removeAttribute(attributes$d.loading);
        this.removeAttribute(attributes$d.open);
      }

      clearResultsHTML() {
        this.predictiveSearchResults.innerHTML = '';
      }
    }

    customElements.define('predictive-search', PredictiveSearch);

    class LoadingOverlay extends HTMLElement {
      constructor() {
        super();

        document.addEventListener('DOMContentLoaded', () => {
          // Hide loading overlay
          document.documentElement.classList.remove('page-loading');
        });
      }
    }

    const selectors$h = {
      aos: '[data-aos]:not(.aos-animate)',
      aosAnchor: '[data-aos-anchor]',
      animatable: '[data-aos], [data-aos-anchor]',
      watchMutations: '[id^="api-cart-items-"], [data-collection-filters], [data-collection-products], #AjaxinateLoop, [data-tab="resultsProducts"]',
      textHighlight: 'text-highlight',
      counterUps: 'text-count-up',
      flickitySlider: '.flickity-slider',
      slide: '[data-slide]',
      carouselMobile: '.carousel--mobile',
    };

    const classes$e = {
      aosAnimate: 'aos-animate',
      isLoading: 'is-loading',
      isSelected: '.is-selected',
    };

    const attributes$c = {
      aos: 'data-aos',
      aosAnchor: 'data-aos-anchor',
      aosIntersection: 'data-aos-intersection',
      aosDebounce: 'data-aos-debounce',
      aosCustomInit: 'data-aos-custom-init',
      aosWatchAnchors: 'data-aos-watch-anchors',
      aosTrigger: 'data-aos-trigger',
      aosCarouselMobile: 'data-aos-carousel-mobile',
      aosCarouselDesktop: 'data-aos-carousel-desktop',
    };

    const settings$6 = {
      intersectionRatio: 0.1,
      debounceTime: 0,
    };

    let anchorObserversCollection = new Set();

    /*
      Observe animated elements that have attribute [data-aos]
    */
    function anchorsIntersectionObserver() {
      const anchors = document.querySelectorAll(selectors$h.aosAnchor);

      // Get all anchors and attach observers
      initAnchorObservers(anchors);
    }

    function initAnchorObservers(anchors) {
      if (!anchors.length) return;

      // Prepare a Set with all anchor containers
      anchors.forEach((anchor) => {
        const containerId = anchor.dataset.aosAnchor;
        let container;
        if (containerId != '') container = document.getElementById(containerId.slice(1));
        if (container && !anchorObserversCollection.has(anchor)) {
          anchorObserversCollection.add(container);
        }
      });

      // Add anchor containers to the set of target elements being watched by the `IntersectionObserver`
      anchorObserversCollection.forEach((container) => {
        aosAnchorObserver.observe(container);
      });
    }

    /*
      Observe anchor elements
    */
    const aosAnchorObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          const target = entry.target;
          const intersectionRatio = entry.intersectionRatio;
          const isIntersecting = entry.isIntersecting;

          // Tells how much of the target element should be visible when animations are executed
          let intersectAt = settings$6.intersectionRatio;
          if (target.hasAttribute(attributes$c.aosIntersection)) {
            intersectAt = Number(target.getAttribute(attributes$c.aosIntersection));
          }

          // Determines whether elements should be animated as soon as the `target` has been intersected or after a given delay
          let timeout;
          let debounceTime = settings$6.debounceTime;
          if (target.hasAttribute(attributes$c.aosDebounce)) {
            debounceTime = Number(target.getAttribute(attributes$c.aosDebounce));
          }

          if (isIntersecting && intersectionRatio > intersectAt) {
            if (debounceTime !== 0) {
              if (timeout) clearTimeout(timeout);
              timeout = setTimeout(() => onIntersecting(target), debounceTime);
            } else {
              onIntersecting(target);
            }

            // Stop observing anchor element
            observer.unobserve(target);
            // Remove target element from the Set
            anchorObserversCollection.delete(target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 0.75, 1],
      }
    );

    function onIntersecting(target) {
      if (!target) return;

      // Animate anchor
      animate(target);

      // Trigger all elements' animations at once, if they are located in a layout with a slider on desktop, by making them dependent on the last active slide's animation execution
      if (target.hasAttribute(attributes$c.aosCarouselDesktop) && window.theme.isDesktop()) {
        const slider = target.querySelector(selectors$h.flickitySlider);
        if (slider) {
          const slide = target.querySelectorAll(selectors$h.slide);
          const activeSlides = [...slide].filter((slide) => {
            if (slide.matches(classes$e.isSelected)) return slide;
          });
          const inactiveSlides = [...slide].filter((slide) => {
            if (!slide.matches(classes$e.isSelected)) return slide;
          });

          if (activeSlides.length > 0) {
            const triggerId = activeSlides[activeSlides.length - 1].id;
            activeSlides[activeSlides.length - 1].setAttribute(attributes$c.aosTrigger, `#${triggerId}`);
            inactiveSlides.forEach((slide) => {
              slide.querySelectorAll(selectors$h.animatable).forEach((element) => {
                element.setAttribute(attributes$c.aosAnchor, `#${triggerId}`);
              });
            });
          }
        }
      }

      // Animate all anchors at once when there is a carousel with native scrolling on mobile
      if (target.hasAttribute(attributes$c.aosCarouselMobile) && window.theme.isMobile()) {
        const slider = target.querySelector(selectors$h.carouselMobile);

        if (slider) {
          const slides = [...slider.children];
          const triggerId = slides[0].id;

          if (slides.length > 1) {
            slides[0].setAttribute(attributes$c.aosTrigger, `#${triggerId}`);
            slides.forEach((slide) => {
              slide.querySelectorAll(selectors$h.animatable).forEach((element) => {
                element.setAttribute(attributes$c.aosAnchor, `#${triggerId}`);
              });
            });
          }
        }
      }

      // Trigger animations on other elements
      if (target.hasAttribute(attributes$c.aosTrigger)) {
        const triggerId = target.getAttribute(attributes$c.aosTrigger);
        const elementsToTrigger = document.querySelectorAll(`[${attributes$c.aosAnchor}="${triggerId}"]`);
        elementsToTrigger.forEach((element) => animate(element));
      }

      // Animate children
      let elementsToAnimate = target.querySelectorAll(selectors$h.aos);

      // Watch for other anchor elements inside current `target` container to prevent executing their animations until their intersecting
      if (target.hasAttribute(attributes$c.aosWatchAnchors)) {
        // Trigger animations only for elements that match with current `target` anchor
        const filteredElements = [...elementsToAnimate].filter((element) => {
          const anchor = element.hasAttribute(attributes$c.aosAnchor) ? element.getAttribute(attributes$c.aosAnchor) : false;
          if (anchor && `#${target.id}` === anchor) return element;
        });

        elementsToAnimate = filteredElements;
      }

      elementsToAnimate.forEach((item) => {
        // Prevents animations execution and relies on initialising them outside this module with the help of dispatching a CustomEvent
        let customInit = item.hasAttribute(attributes$c.aosCustomInit);
        if (customInit) {
          target.dispatchEvent(new CustomEvent('theme:target:animate', {bubbles: true, detail: item}));
          return;
        }

        // Execute animations as soon as anchor element has been intersected
        animate(item);
      });
    }

    function animate(element) {
      requestAnimationFrame(() => element.classList.add(classes$e.aosAnimate));

      animateTextHighlights(element);
      animateCounterUps(element);
    }

    function animateTextHighlights(element) {
      const textHighlight = element.querySelectorAll(selectors$h.textHighlight);
      textHighlight.forEach((highlight) => highlight.shouldAnimate());
    }

    function animateCounterUps(element) {
      const counterUps = element.querySelectorAll(selectors$h.counterUps);
      counterUps.forEach((countUp) => countUp.shouldAnimate());
    }

    /*
      Watch for mutations in the body and start observing the newly added animated elements and anchors
    */
    function bodyMutationObserver() {
      const isNode = (element) => element instanceof HTMLElement;

      const bodyObserver = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
          if (!mutation.type === 'childList') return;

          const target = mutation.target;
          const addedNodes = [...mutation.addedNodes];
          const removedNodes = [...mutation.removedNodes];
          const watchMutations =
            target.matches(selectors$h.watchMutations) ||
            addedNodes.some((item) => (isNode(item) ? item.matches(selectors$h.watchMutations) : false)) ||
            removedNodes.some((item) => (isNode(item) ? item.matches(selectors$h.watchMutations) : false));
          const isAnimatableElement = target.matches(selectors$h.animatable) || addedNodes.some((item) => (isNode(item) ? item.matches(selectors$h.animatable) : false));
          const hasElementToAnimate = target.querySelector(`[${attributes$c.aosAnchor}="#${target.id}"]`) !== null;

          if (isAnimatableElement || hasElementToAnimate || watchMutations) {
            const anchors = target.querySelectorAll(selectors$h.aosAnchor);

            // Get all anchors and attach observers
            initAnchorObservers(anchors);
          }
        }
      });

      bodyObserver.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true,
      });
    }

    function initAnimations() {
      anchorsIntersectionObserver();
      bodyMutationObserver();
    }

    const counterUp = ( el, options = {} ) => {
    	const {
    		action = 'start',
    		duration = 1000,
    		delay = 16,
    	} = options;

    	// Allow people to use this as a stop method.
    	if ( action === 'stop' ) {
    		stopCountUp( el );
    		return
    	}

    	stopCountUp( el );

    	// If no number, don't do anything.
    	if ( ! /[0-9]/.test( el.innerHTML ) ) {
    		return
    	}

    	const nums = divideNumbers( el.innerHTML, {
    		duration: duration || el.getAttribute( 'data-duration' ),
    		delay: delay || el.getAttribute( 'data-delay' ),
    	} );

    	// Remember the contents.
    	el._countUpOrigInnerHTML = el.innerHTML;

    	// Start counting.
    	el.innerHTML = nums[ 0 ] || '&nbsp;'; // Use a non-breaking space to prevent layout shift.
    	el.style.visibility = 'visible';

    	// Function for displaying output with the set time and delay.
    	const output = function() {
    		el.innerHTML = nums.shift() || '&nbsp;'; // Use a non-breaking space to prevent layout shift.
    		if ( nums.length ) {
    			clearTimeout( el.countUpTimeout );
    			el.countUpTimeout = setTimeout( output, delay );
    		} else {
    			el._countUpOrigInnerHTML = undefined;
    		}
    	};
    	el.countUpTimeout = setTimeout( output, delay );
    };

    const stopCountUp = el => {
    	clearTimeout( el.countUpTimeout );
    	if ( el._countUpOrigInnerHTML ) {
    		el.innerHTML = el._countUpOrigInnerHTML;
    		el._countUpOrigInnerHTML = undefined;
    	}
    	el.style.visibility = '';
    };

    const divideNumbers = ( numToDivide, options = {} ) => {
    	const {
    		duration = 1000,
    		delay = 16,
    	} = options;

    	// Number of times the number will change.
    	const divisions = duration / delay;

    	// Split numbers and html tags.
    	const splitValues = numToDivide.toString().split( /(<[^>]+>|[0-9.][,.0-9]*[0-9]*)/ );

    	// Contains all numbers to be displayed.
    	const nums = [];

    	// Set blank strings to ready the split values.
    	for ( let k = 0; k < divisions; k++ ) {
    		nums.push( '' );
    	}

    	// Loop through all numbers and html tags.
    	for ( let i = 0; i < splitValues.length; i++ ) {
    		// If number split it into smaller numbers and insert it to nums.
    		if ( /([0-9.][,.0-9]*[0-9]*)/.test( splitValues[ i ] ) && ! /<[^>]+>/.test( splitValues[ i ] ) ) {
    			let num = splitValues[ i ];

    			// Find all the occurances of . and ,
    			const symbols = [ ...num.matchAll( /[.,]/g ) ]
    				// Get all the locations of the characters so we can re-place them later on.
    				.map( m => ( { char: m[0], i: num.length - m.index - 1 } ) )
    				// Make sure we go through the characters from right to left
    				.sort( ( a, b ) => a.i - b.i );

    			// Remove commas and dots for computation purposes.
    			num = num.replace( /[.,]/g, '' );

    			// Start adding numbers from the end.
    			let k = nums.length - 1;

    			// Create small numbers we'll the count over.
    			for ( let val = divisions; val >= 1; val-- ) {
    				let newNum = parseInt( num / divisions * val, 10 );

    				// Re-insert the symbols in the indices they were at.
    				newNum = symbols.reduce( ( num, { char, i } ) => {
    					return num.length <= i ? num // If we don't have enough numbers, don't insert the symbol.
    						: num.slice( 0, -i ) + char + num.slice( -i )
    				}, newNum.toString() );

    				// Insert all small numbers.
    				nums[ k-- ] += newNum;
    			}
    		} else {
    			// Insert all non-numbers in the same place.
    			for ( let k = 0; k < divisions; k++ ) {
    				nums[ k ] += splitValues[ i ];
    			}
    		}
    	}

    	// The last value of the element should be the original one.
    	nums[ nums.length ] = numToDivide.toString();

    	return nums
    };

    const attributes$b = {
      countUpDuration: 'data-count-up-duration',
      countUpInit: 'data-count-up-init',
    };

    class TextCountUp extends HTMLElement {
      static observedAttributes = [attributes$b.countUpInit];

      constructor() {
        super();
        this.container = this;
        this.countUpDuration = this.getAttribute(attributes$b.countUpDuration);
        this.duration = 1000 * (100 / parseInt(this.countUpDuration, 10));
      }

      connectedCallback() {
        if (!theme.settings.animationsEnabled) {
          this.startCountUp();
        }
      }

      attributeChangedCallback(name, oldValue, newValue) {
        const countUpInitChange = name === attributes$b.countUpInit;
        const initialActiveSetting = oldValue === null && countUpInitChange;
        const becomesActive = newValue === 'true';

        if (initialActiveSetting && becomesActive) {
          this.startCountUp();
        }
      }

      shouldAnimate() {
        requestAnimationFrame(() => this.setTriggerAttribute());
      }

      setTriggerAttribute(active = true) {
        this.setAttribute(attributes$b.countUpInit, active);
      }

      startCountUp() {
        // Number of times the number will change is calculated by: `divisions = duration / delay`
        // Using `delay: 16` as a frame of reference, `0.016 * this.duration` gives us the same number of divisions for all durations coming from section settings
        counterUp(this, {
          duration: this.duration,
          delay: 0.016 * this.duration,
        });
      }
    }

    // Safari requestIdleCallback polyfill
    window.requestIdleCallback =
      window.requestIdleCallback ||
      function (cb) {
        var start = Date.now();
        return setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(0, 50 - (Date.now() - start));
            },
          });
        }, 1);
      };
    window.cancelIdleCallback =
      window.cancelIdleCallback ||
      function (id) {
        clearTimeout(id);
      };

    resizeListener();
    scrollListener();
    isTouch();
    loadedImagesEventHook();

    window.addEventListener('DOMContentLoaded', () => {
      preventOverflow(document);
      removeLoadingClassFromLoadedImages(document);

      if (window.theme.settings.animationsEnabled) {
        initAnimations();
      }
    });

    document.addEventListener('shopify:section:load', (e) => {
      const container = e.target;

      window.dispatchEvent(new Event('resize'), {bubbles: true});

      preventOverflow(container);

      if (window.theme.settings.animationsEnabled) {
        initAnimations();
      }
    });

    document.addEventListener('shopify:section:reorder', (e) => {
      e.target;

      if (window.theme.settings.animationsEnabled) {
        initAnimations();
      }
    });

    if (!customElements.get('deferred-loading')) {
      customElements.define('deferred-loading', DeferredLoading);
    }

    if (!customElements.get('loading-overlay')) {
      customElements.define('loading-overlay', LoadingOverlay);
    }

    if (!customElements.get('text-count-up')) {
      customElements.define('text-count-up', TextCountUp);
    }

    if (!customElements.get('hover-slideshow')) {
      customElements.define('hover-slideshow', HoverSlideshow);
    }

    if (!customElements.get('hover-button')) {
      customElements.define('hover-button', HoverButtons);
    }

    (function () {
      function n(n) {
        var i = window.innerWidth || document.documentElement.clientWidth,
          r = window.innerHeight || document.documentElement.clientHeight,
          t = n.getBoundingClientRect();
        return t.top >= 0 && t.bottom <= r && t.left >= 0 && t.right <= i;
      }
      function t(n) {
        var i = window.innerWidth || document.documentElement.clientWidth,
          r = window.innerHeight || document.documentElement.clientHeight,
          t = n.getBoundingClientRect(),
          u = (t.left >= 0 && t.left <= i) || (t.right >= 0 && t.right <= i),
          f = (t.top >= 0 && t.top <= r) || (t.bottom >= 0 && t.bottom <= r);
        return u && f;
      }
      function i(n, i) {
        function r() {
          var r = t(n);
          r != u && ((u = r), typeof i == 'function' && i(r, n));
        }
        var u = t(n);
        window.addEventListener('load', r);
        window.addEventListener('resize', r);
        window.addEventListener('scroll', r);
      }
      function r(t, i) {
        function r() {
          var r = n(t);
          r != u && ((u = r), typeof i == 'function' && i(r, t));
        }
        var u = n(t);
        window.addEventListener('load', r);
        window.addEventListener('resize', r);
        window.addEventListener('scroll', r);
      }
      window.visibilityHelper = {isElementTotallyVisible: n, isElementPartiallyVisible: t, inViewportPartially: i, inViewportTotally: r};
    })();

    if (!customElements.get('header-component')) {
      customElements.define(
        'header-component',
        class HeaderComponent extends HTMLElement {
          constructor() {
            super();
            this.background = document.querySelector('[data-header-background]');
            this.headerWrapper = this.querySelector('[data-wrapper]');
            this.logoTextLink = this.querySelector('[data-logo-text-link]');
            this.nav = this.querySelector('[data-nav]');
            this.mobileMenuTrigger = this.querySelector('[data-mobile-menu-trigger]');
            this.headerStateEvent = this.headerState.bind(this);
            this.handleTouchstartEvent = this.handleTouchstart.bind(this);
            this.updateBackgroundHeightEvent = this.updateBackgroundHeight.bind(this);
            this.triggerDrawerOpeningEvent = () => this.triggerDrawerOpening(this.mobileMenuTrigger);
          }

          connectedCallback() {
            if (this.classList.contains('js__header__clone')) return;

            this.initTransparentHeader();

            window.minWidth = this.getMinWidth();
            this.listenWidth();
            this.initMobileNavToggle();
            this.handleTextLinkLogos();
            this.initStickyHeader();
            this.handleBackgroundEvents();

            document.body.addEventListener('touchstart', this.handleTouchstartEvent, {passive: true});
            this.updateHeaderHover();
          }

          initTransparentHeader() {
            const isTransparent = this.dataset.transparent === 'true';
            const firstSection = document.querySelector('[data-main]').children[0];

            if (!firstSection) return;

            const preventTransparentHeader = firstSection.querySelector('[data-prevent-transparent-header]:first-of-type');
            window.isHeaderTransparent = isTransparent && firstSection.classList.contains('supports-transparent-header') && !preventTransparentHeader;
          }

          getMinWidth() {
            const headerWrapperStyles = this.headerWrapper.currentStyle || window.getComputedStyle(this.headerWrapper);
            const headerPaddings = parseInt(headerWrapperStyles.paddingLeft) * 2;
            const comparitor = this.cloneNode(true);
            comparitor.classList.add('js__header__clone');
            document.body.appendChild(comparitor);
            const wideElements = comparitor.querySelectorAll('[data-takes-space]');
            const navAlignment = this.getAttribute('data-nav-alignment');
            const minWidth = this._sumSplitWidths(wideElements, navAlignment);

            document.body.removeChild(comparitor);

            return minWidth + wideElements.length * 20 + headerPaddings;
          }

          listenWidth() {
            this.checkWidthEvent = this.checkWidth.bind(this);

            if ('ResizeObserver' in window) {
              this.resizeObserver = new ResizeObserver(this.checkWidthEvent);
              this.resizeObserver.observe(this);
            } else {
              document.addEventListener('theme:resize', this.checkWidthEvent);
            }

            this.checkWidth();
          }

          checkWidth() {
            if (this.isResizing) return;
            this.isResizing = true;
            const shouldCompress = window.innerWidth < window.minWidth;
            const hasCompress = this.classList.contains('site-header--compress');

            if (shouldCompress && !hasCompress) {
              this.classList.add('site-header--compress');
            } else if (!shouldCompress && hasCompress) {
              this.classList.remove('site-header--compress');
            }

            this.isResizing = false;
          }

          updateHeaderHover() {
            requestAnimationFrame(() => {
              const isHovered = this.matches(':hover');
              const hasHoveredClass = this.classList.contains('site-header--hovered');

              if (isHovered && !hasHoveredClass) this.classList.add('site-header--hovered');
            });
          }

          handleTouchstart(event) {
            const isInHeader = this.contains(event.target);
            const activeNavItem = this.querySelector('.is-visible[data-nav-item]');

            if (!isInHeader && activeNavItem) {
              activeNavItem.dispatchEvent(new Event('mouseleave', {bubbles: true}));
            }
          }

          handleTextLinkLogos() {
            if (this.logoTextLink === null) return;

            const headerHeight = this.offsetHeight;
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
            document.documentElement.style.setProperty('--header-sticky-height', `${headerHeight}px`);
          }

          initStickyHeader() {
            this.headerSticky = this.hasAttribute('data-header-sticky');
            this.hasScrolled = false;
            this.hasCollectionFilters = document.querySelector('[data-collection-filters]');
            this.position = this.dataset.position;

            const shouldShowCompactHeader = this.position === 'fixed' && !this.hasCollectionFilters;
            if (shouldShowCompactHeader) {
              this.headerState();
              document.addEventListener('theme:scroll', this.headerStateEvent);
              return;
            }

            document.body.classList.remove('has-scrolled');
            if (window.isHeaderTransparent) {
              this.classList.add('site-header--transparent');
            }
          }

          // Switch to "compact" header on scroll
          headerState(event) {
            const headerHeight = parseInt(this.dataset.height || this.offsetHeight);
            const announcementBar = document.querySelector('[data-announcement-wrapper]');
            const announcementHeight = announcementBar ? announcementBar.offsetHeight : 0;
            const pageOffset = headerHeight + announcementHeight;
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollUp = event && event.detail && event.detail.up;

            // Show compact header when scroll down
            this.hasScrolled = currentScrollTop > pageOffset;
            document.body.classList.toggle('has-scrolled', this.hasScrolled);

            // Hide compact header when scroll back to top
            const hideHeaderThreshold = pageOffset + window.stickyHeaderHeight;
            const bellowThreshold = currentScrollTop < hideHeaderThreshold;
            const shouldHideHeader = bellowThreshold && scrollUp;
            document.body.classList.toggle('hide-header', shouldHideHeader);

            if (window.isHeaderTransparent) {
              const shouldShowTransparentHeader = !this.hasScrolled || shouldHideHeader;
              this.classList.toggle('site-header--transparent', shouldShowTransparentHeader);
            }

            // Update header background height if users scroll the page with their mouse over the header or over an opened nav menu
            if (this.classList.contains('site-header--hovered')) {
              const activeNavItem = this.querySelector('.is-visible[data-nav-item]');

              if (activeNavItem != null) {
                activeNavItem.dispatchEvent(new Event('mouseenter', {bubbles: true}));
              } else {
                const currentHeight = this.hasScrolled ? window.stickyHeaderHeight : headerHeight;
                this.background.style.setProperty('--header-background-height', `${currentHeight}px`);
              }
            }
          }

          handleBackgroundEvents() {
            this.headerWrapper.addEventListener('mouseenter', this.updateBackgroundHeightEvent);

            this.headerWrapper.addEventListener('mouseleave', this.updateBackgroundHeightEvent);

            this.addEventListener('focusout', this.updateBackgroundHeightEvent);

            document.addEventListener('theme:cart:close', this.updateBackgroundHeightEvent);

            // Helps fixing Safari issues with background not being updated on search close and mouse over the header
            document.addEventListener('theme:search:close', this.updateBackgroundHeightEvent);
          }

          updateBackgroundHeight(event) {
            const isDesktop = matchMedia('(pointer:fine)').matches;
            const isFocusEnabled = !document.body.classList.contains('no-outline');
            const isNotTabbingOnDesktop = isDesktop && !isFocusEnabled;

            if (!event) return;

            let drawersVisible = ['js-drawer-open', 'js-drawer-open-cart', 'js-quick-view-visible', 'js-quick-view-from-cart'].some((popupClass) => document.body.classList.contains(popupClass));

            // Update header background height on:
            // 'mouseenter' event
            // opened Cart drawer/Quick View/Menu drawers
            if (event.type === 'mouseenter' || drawersVisible) {
              this.headerHeight = this.hasScrolled ? window.stickyHeaderHeight : this.offsetHeight;
              this.classList.add('site-header--hovered');

              if (!this.classList.contains('site-header--menu-opened')) {
                this.background.style.setProperty('--header-background-height', `${this.headerHeight}px`);
              }
            }

            if (event.type === 'mouseenter') return;

            requestAnimationFrame(() => {
              drawersVisible = ['js-drawer-open', 'js-drawer-open-cart', 'js-quick-view-visible', 'js-quick-view-from-cart'].some((popupClass) => document.body.classList.contains(popupClass));

              if (drawersVisible) return;

              // Remove header background and handle focus on:
              // 'mouseleave' event
              // 'theme:cart:close' event
              // 'theme:search:close' event
              // 'focusout' event
              // closed Cart drawer/Quick View/Menu drawers

              if (event.type === 'focusout' && !isDesktop) return;
              if (event.type === 'theme:search:close' && !isNotTabbingOnDesktop) return;
              if (this.hasScrolled) return;

              const focusOutOfHeader = document.activeElement.closest('header-component') === null;
              const isSearchOpened = document.body.classList.contains('search-opened');
              const headerMenuOpened = this.classList.contains('site-header--menu-opened');

              if (isSearchOpened || headerMenuOpened) return;

              if (event.type === 'focusout' && !focusOutOfHeader) return;

              this.classList.remove('site-header--hovered');
              this.background.style.setProperty('--header-background-height', '0px');

              if (!isFocusEnabled) {
                document.activeElement.blur();
              }
            });
          }

          initMobileNavToggle() {
            this.mobileMenuTrigger?.addEventListener('click', () => {
              if (!document.body.classList.contains('js-drawer-open')) {
                if (document.body.classList.contains('search-opened')) {
                  document.addEventListener('theme:search:close', this.triggerDrawerOpeningEvent);
                  return;
                }
                this.triggerDrawerOpening(this.mobileMenuTrigger);
              }
            });
          }

          triggerDrawerOpening(mobileMenuTrigger) {
            document.dispatchEvent(
              new CustomEvent('theme:drawer:opening', {
                bubbles: true,
                detail: {element: mobileMenuTrigger},
              })
            );
            document.removeEventListener('theme:search:close', this.triggerDrawerOpeningEvent);
          }

          _sumSplitWidths(nodes, alignment) {
            let arr = [];
            nodes.forEach((el) => {
              arr.push(el.clientWidth);
            });
            let [logoWidth, navWidth, iconsWidth] = arr;

            // Check if nav is left and set correct width
            if (alignment === 'left') {
              const tempWidth = logoWidth;
              logoWidth = navWidth;
              navWidth = tempWidth;
            }

            if (alignment !== 'right') {
              if (logoWidth > iconsWidth) {
                iconsWidth = logoWidth;
              } else {
                logoWidth = iconsWidth;
              }
            }

            return logoWidth + navWidth + iconsWidth;
          }

          disconnectedCallback() {
            if ('ResizeObserver' in window) {
              this.resizeObserver?.disconnect();
            } else {
              document.removeEventListener('theme:resize', this.checkWidthEvent);
            }

            document.documentElement.style.removeProperty('--header-height');
            document.documentElement.style.removeProperty('--header-sticky-height');

            document.body.classList.remove(...['js-drawer-open', 'js-drawer-open-cart', 'js-quick-view-visible', 'js-quick-view-from-cart']);
            document.removeEventListener('theme:scroll', this.headerStateEvent);
            document.removeEventListener('theme:cart:close', this.updateBackgroundHeightEvent);
            document.removeEventListener('theme:search:close', this.updateBackgroundHeightEvent);
            document.body.removeEventListener('touchstart', this.handleTouchstartEvent);
          }
        }
      );
    }

    if (!customElements.get('hover-disclosure')) {
      customElements.define(
        'hover-disclosure',
        class HoverDisclosure extends HTMLElement {
          constructor() {
            super();
            this.key = this.getAttribute('aria-controls');
            this.link = this.querySelector('[data-top-link]');
            this.grandparent = this.classList.contains('grandparent');
            this.disclosure = document.getElementById(this.key);
            this.header = this.closest('[data-site-header]');
            this.background = document.querySelector('[data-header-background]');
            this.setBackgroundHeightEvent = () => this.setBackgroundHeight();
          }

          connectedCallback() {
            this.setAttribute('aria-haspopup', true);
            this.setAttribute('aria-expanded', false);
            this.setAttribute('aria-controls', this.key);

            this.connectHoverToggle();
            this.handleTablets();
          }

          setBackgroundHeight() {
            const hasScrolled = document.body.classList.contains('has-scrolled');
            const headerHeight = hasScrolled ? window.stickyHeaderHeight : this.header.offsetHeight;

            if (this.grandparent) {
              this.disclosure.style.height = 'auto';
              this.dropdownHeight = this.disclosure.offsetHeight + headerHeight;
            } else {
              this.dropdownHeight = headerHeight;
            }

            this.background.style.setProperty('--header-background-height', `${this.dropdownHeight}px`);

            // Hide header dropdowns on mobile
            if (window.innerWidth < theme.sizes.small) {
              this.hideDisclosure();
            }
          }

          showDisclosure() {
            if (this.isVisible) return;
            this.isVisible = true;

            this.setBackgroundHeight();
            document.addEventListener('theme:resize', this.setBackgroundHeightEvent);

            if (!this.header.classList.contains('site-header--compress')) {
              if (this.grandparent) {
                document.body.classList.add('megamenu-opened');
              }
              this.header.classList.add('site-header--menu-opened');
            }

            // Set accessibility and classes
            this.setAttribute('aria-expanded', true);
            this.classList.add('is-visible');
            this.disclosure.classList.add('is-visible');

            this.updateHeaderHover();
          }

          hideDisclosure() {
            if (!this.isVisible) return;
            this.isVisible = false;

            this.background.style.removeProperty('--header-background-height');
            document.removeEventListener('theme:resize', this.setBackgroundHeightEvent);

            this.classList.remove('is-visible');
            this.disclosure.classList.remove('is-visible');
            this.setAttribute('aria-expanded', false);
            this.header.classList.remove('site-header--menu-opened');
            document.body.classList.remove('megamenu-opened');
          }

          updateHeaderHover() {
            requestAnimationFrame(() => {
              const isHovered = this.header.matches(':hover');
              const hasHoveredClass = this.header.classList.contains('site-header--hovered');

              if (isHovered && !hasHoveredClass) this.header.classList.add('site-header--hovered');
            });
          }

          handleTablets() {
            // first click opens the popup, second click opens the link
            this.addEventListener('touchstart', (e) => {
              const isOpen = this.classList.contains('is-visible');
              if (!isOpen) {
                e.preventDefault();

                // Hide the rest of the active nav items
                const activeNavItems = this.header.querySelectorAll('.is-visible[data-nav-item]');

                if (activeNavItems.length > 0) {
                  activeNavItems.forEach((item) => {
                    if (item !== this) {
                      item.dispatchEvent(new Event('mouseleave', {bubbles: true}));

                      const onTransitionEnd = () => {
                        requestAnimationFrame(() => {
                          this.showDisclosure();
                        });

                        item.removeEventListener('transitionend', onTransitionEnd);
                      };

                      item.addEventListener('transitionend', onTransitionEnd);
                    }
                  });

                  return;
                }

                this.showDisclosure();
              }
            });
          }

          connectHoverToggle() {
            this.addEventListener('mouseenter', () => this.showDisclosure());
            this.link.addEventListener('focus', () => this.showDisclosure());

            this.addEventListener('mouseleave', () => this.hideDisclosure());
            this.addEventListener('focusout', (e) => {
              const inMenu = this.contains(e.relatedTarget);

              if (!inMenu) {
                this.hideDisclosure();
              }
            });
            this.addEventListener('keyup', (e) => {
              if (e.code !== 'Escape') {
                return;
              }
              this.hideDisclosure();
            });
          }
        }
      );
    }

    /*
      Trigger event after animation completes
    */
    window.theme.waitForAnimationEnd = function (element) {
      return new Promise((resolve) => {
        function onAnimationEnd(event) {
          if (event.target != element) return;

          element.removeEventListener('animationend', onAnimationEnd);
          element.removeEventListener('transitionend', onAnimationEnd);
          resolve();
        }

        element?.addEventListener('animationend', onAnimationEnd);
        element?.addEventListener('transitionend', onAnimationEnd);
      });
    };

    function FetchError(object) {
      this.status = object.status || null;
      this.headers = object.headers || null;
      this.json = object.json || null;
      this.body = object.body || null;
    }
    FetchError.prototype = Error.prototype;

    /**
     * Notification Popup
     * ------------------------------------------------------------------------------
     * Shows a notification form in a Photoswipe popup when a product variant is sold out.
     * The form is loaded via AJAX from the api-notification.liquid section.
     *
     * @usage
     * To use this feature, add the following attributes to your button:
     * - data-handle="{{ product.handle }}"
     * - data-variant-id="{{ variant.id }}"
     *
     * Example:
     * <button
     *   type="button"
     *   data-handle="{{ product.handle }}"
     *   data-variant-id="{{ variant.id }}"
     * >
     *   Notify me when available
     * </button>
     *
     * Then initialize:
     * new NotificationPopup(button);
     */

    const settings$5 = {
      templateIndex: 1,
    };

    const options$1 = {
      history: false,
      focus: false,
      mainClass: 'pswp--notification pswp--not-close-btn',
      closeOnVerticalDrag: false,
    };

    class NotificationPopup {
      constructor(button) {
        this.button = button;
        this.a11y = window.theme.a11y;

        // Set the trigger element before calling trapFocus
        this.a11y.state.trigger = this.button;

        this.handle = this.button.getAttribute('data-handle');
        this.variantId = this.button.getAttribute('data-variant-id');

        this.init();
      }

      init() {
        // Build the URL for fetching the notification form
        const variantParam = this.variantId ? `&variant=${this.variantId}` : '';
        const url = `${theme.routes.root}products/${this.handle}?section_id=api-notification${variantParam}`;

        // Fetch and load the notification form
        this.loadPhotoswipeFromFetch(url);
      }

      loadPhotoswipeFromFetch(url) {
        fetch(url)
          .then((response) => {
            return response.text();
          })
          .then((data) => {
            const items = [
              {
                html: data,
              },
            ];

            new window.theme.LoadPhotoswipe(items, options$1, settings$5.templateIndex);
          })
          .catch((error) => console.log('error: ', error));
      }
    }

    const settings$4 = {
      cartDrawerEnabled: window.theme.settings.cartType === 'drawer',
      timers: {
        addProductTimeout: 1000,
      },
      animations: {
        data: 'data-aos',
        method: 'fade-up',
      },
    };

    if (!customElements.get('cart-element')) {
      customElements.define(
        'cart-element',
        class CartElement extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            // DOM Elements
            this.cart = this;
            this.cartToggleButtons = document.querySelectorAll('[data-cart-drawer-toggle]');

            // Determine if this is cart page or cart drawer
            this.isCartPage = this.hasAttribute('data-cart-page');
            this.isCartDrawer = this.hasAttribute('data-cart-drawer');
            this.cartDrawerEnabled = settings$4.cartDrawerEnabled && this.isCartDrawer;

            this.cartCount = this.getCartItemCount();

            this.assignArguments();

            this.recipientErrors = this.form?.getAttribute('data-recipient-errors') === 'true';
            this.flktyUpsell = null;
            this.form = null;
            this.variantTitle = null;
            this.a11y = window.theme.a11y;

            this.build = this.build.bind(this);

            // AJAX request
            this.addToCart = this.addToCart.bind(this);
            this.updateCart = this.updateCart.bind(this);

            // Cart events
            this.openCartDrawer = this.openCartDrawer.bind(this);
            this.closeCartDrawer = this.closeCartDrawer.bind(this);
            this.toggleCartDrawer = this.toggleCartDrawer.bind(this);
            this.formSubmitHandler = window.theme.throttle(this.formSubmitHandler.bind(this), 50);
            this.closeCartError = () => {
              this.cartErrorHolder.classList.remove('is-expanded');
            };
            this.cartDrawerCloseEvent = null;

            // Checking
            this.hasItemsInCart = this.hasItemsInCart.bind(this);

            // Set classes
            this.toggleClassesOnContainers = this.toggleClassesOnContainers.bind(this);

            // Flags
            this.totalItems = 0;
            this.isCartDrawerOpen = false;
            this.isCartDrawerLoaded = false;
            this.cartDrawerEnabled = settings$4.cartDrawerEnabled;
            this.cartUpdateFailed = false;
            this.showCannotAddMoreInCart = false;
            this.discountError = false;
            this.shippingDiscountError = false;
            this.pendingDiscountCheck = null;
            this.activeDiscountFetch = null;

            // Cart Events
            this.cartEvents();
            this.cartAddEvent();

            // Cart drawer specific events
            if (this.isCartDrawer) {
              this.cartDrawerToggleEvents();
            }

            // Init cart update for fields
            this.initCartUpdate();

            if (this.isCartPage) {
              this.renderPairProducts();
            }

            // Only add cart drawer close listener for cart drawer instances
            if (this.isCartDrawer) {
              document.addEventListener('theme:popup:open', this.closeCartDrawer);
            }
          }

          /**
           * Assign cart constructor arguments on page load or after cart drawer is loaded
           *
           * @return  {Void}
           */
          assignArguments() {
            this.outerSection = this.cart.closest('[data-section-id]');

            // Elements that should be scoped to this cart instance
            this.emptyMessage = this.cart.querySelector('[data-empty-message]');
            this.emptyMessageBottom = this.cart.querySelector('[data-empty-message-bottom]');
            this.buttonHolder = this.cart.querySelector('[data-foot-holder]');
            this.itemsHolder = this.cart.querySelector('[data-items-holder]');
            this.cartItemsQty = this.cart.querySelector('[data-cart-items-qty]');
            this.itemsWrapper = this.cart.querySelector('[data-items-wrapper]');
            this.items = this.cart.querySelectorAll('[data-cart-item]');
            this.cartTotal = this.cart.querySelector('[data-cart-total]');
            this.cartTotalPrice = this.cart.querySelector('[data-cart-total-price]');
            this.cartMessage = this.cart.querySelectorAll('[data-cart-message]');
            this.cartOriginalTotal = this.cart.querySelector('[data-cart-original-total]');
            this.cartErrorHolder = this.cart.querySelector('[data-cart-errors]');
            this.cartCloseErrorMessage = this.cart.querySelector('[data-cart-error-close]');
            this.pairProductsHolder = this.cart.querySelector('[data-pair-products-holder]');
            this.cartNoteHolder = this.cart.querySelector('[data-cart-notes-holder]');
            this.discountsInput = this.cart.querySelector('[data-discount-input]');
            this.discountsField = this.cart.querySelector('[data-discount-field]');
            this.discountsButton = this.cart.querySelector('[data-apply-discount]');
            this.discountErrorMessage = this.cart.querySelector('[data-discount-error-message]');
            this.existingDiscountCodes = [];
            this.discounts = this.cart.querySelectorAll('[data-discount-body]');
            this.pairProducts = this.cart.querySelector('[data-pair-products]');
            this.priceHolder = this.cart.querySelector('[data-cart-price-holder]');
            this.upsellHolders = this.cart.querySelectorAll('[data-upsell-holder]');
            this.cartTermsCheckbox = this.cart.querySelector('[data-cart-acceptance-checkbox]');
            this.cartCheckoutButtonWrapper = this.cart.querySelector('[data-cart-checkout-buttons]');
            this.cartCheckoutButton = this.cart.querySelector('[data-cart-checkout-button]');
            this.cartForm = this.cart.querySelector('[data-cart-form]');

            // Cart drawer specific elements
            if (this.isCartDrawer) {
              this.cartDrawerBody = this.cart.querySelector('[data-cart-drawer-body]');
            }

            this.cartItemCount = 0;
            this.subtotal = window.theme.subtotal;
            this.button = null;

            const {headerInitialHeight, announcementBarHeight} = window.theme.readHeights();
            this.headerInitialHeight = headerInitialHeight;
            this.announcementBarHeight = announcementBarHeight;

            if (this.cartMessage.length > 0) {
              this.cartFreeLimitShipping = Number(this.cartMessage[0].getAttribute('data-limit')) * 100 * window.Shopify.currency.rate;
            }

            // Bind event listeners for discount UI
            this.bindDiscountEventListeners();

            this.updateProgress();
          }

          /**
           * Clear discount error message UI
           *
           * @return {Void}
           */
          clearDiscountErrors() {
            if (this.discountErrorMessage) {
              this.discountErrorMessage.classList.add('hidden');
              this.discountErrorMessage.textContent = '';
            }
            this.discountError = false;
            this.shippingDiscountError = false;
            this.pendingDiscountCheck = null;
          }

          /**
           * Bind event listeners for discount elements.
           * This includes applying, removing, and clearing errors on UI interaction.
           *
           * @return  {Void}
           */
          bindDiscountEventListeners() {
            // Apply new discount
            this.discountsButton?.addEventListener('click', (event) => {
              event.preventDefault();

              const newDiscountCode = this.discountsInput.value.trim();
              this.discountsInput.value = '';

              if (newDiscountCode) {
                this.applyDiscount(newDiscountCode);
              }
            });

            // Remove existing discount (bind only; do not mutate local code list)
            document.querySelectorAll('[data-discount-body]')?.forEach((discount) => {
              const discountCode = discount.dataset.discountCode;

              // Add event listener to remove discount
              discount.querySelector('[data-discount-remove]')?.addEventListener('click', (event) => {
                event.preventDefault();
                this.removeDiscount(discountCode);
              });
            });

            // Clear error messages on user interaction
            if (this.discountsInput) {
              if (this.onDiscountInputChange) {
                this.discountsInput.removeEventListener('input', this.onDiscountInputChange);
              }
              this.onDiscountInputChange = () => this.clearDiscountErrors();
              this.discountsInput.addEventListener('input', this.onDiscountInputChange);
            }

            // Collapsible toggle clears error message
            const discountContainer = document.getElementById('discounts');
            if (discountContainer) {
              const discountTrigger = document.querySelector(`[data-collapsible-trigger][aria-controls="${discountContainer.id}"]`);
              if (discountTrigger) {
                if (this.onDiscountCollapsibleToggle) {
                  discountTrigger.removeEventListener('click', this.onDiscountCollapsibleToggle);
                  discountTrigger.removeEventListener('keyup', this.onDiscountCollapsibleToggle);
                }
                this.onDiscountCollapsibleToggle = () => this.clearDiscountErrors();
                discountTrigger.addEventListener('click', this.onDiscountCollapsibleToggle);
                discountTrigger.addEventListener('keyup', this.onDiscountCollapsibleToggle);
              }
            }
          }

          /**
           * Init cart item update functionality
           *
           * @return  {Void}
           */

          initCartUpdate() {
            this.items = document.querySelectorAll('[data-cart-item]');

            this.items?.forEach((item) => {
              this.cartUpdateEvent(item);
            });
          }

          /**
           * Custom event who change the cart
           *
           * @return  {Void}
           */

          cartUpdateEvent(item) {
            item.addEventListener('theme:cart:update', (event) => {
              this.updateCart(
                {
                  id: event.detail.id,
                  quantity: event.detail.quantity,
                },
                item
              );
            });
          }

          /**
           * Cart events
           *
           * @return  {Void}
           */

          cartEvents() {
            const cartItemRemove = document.querySelectorAll('[data-item-remove]');
            this.totalItems = cartItemRemove.length;

            cartItemRemove?.forEach((button) => {
              const item = button.closest('[data-cart-item]');
              button.addEventListener('click', (event) => {
                event.preventDefault();

                if (button.classList.contains('is-disabled')) return;

                this.updateCart(
                  {
                    id: item.getAttribute('data-id'),
                    quantity: 0,
                  },
                  item
                );
              });
            });

            if (this.cartCloseErrorMessage) {
              this.cartCloseErrorMessage.removeEventListener('click', this.closeCartError);
              this.cartCloseErrorMessage.addEventListener('click', this.closeCartError);
            }

            if (this.cartTermsCheckbox) {
              this.cartTermsCheckbox.removeEventListener('change', this.formSubmitHandler);
              this.cartCheckoutButtonWrapper.removeEventListener('click', this.formSubmitHandler);
              this.cartForm.removeEventListener('submit', this.formSubmitHandler);

              this.cartTermsCheckbox.addEventListener('change', this.formSubmitHandler);
              this.cartCheckoutButtonWrapper.addEventListener('click', this.formSubmitHandler);
              this.cartForm.addEventListener('submit', this.formSubmitHandler);
            }
          }

          /**
           * Cart event add product to cart
           *
           * @return  {Void}
           */

          cartAddEvent() {
            document.addEventListener('click', (event) => {
              const clickedElement = event.target;
              const isButtonATC = clickedElement?.matches('[data-add-to-cart]');
              const getButtonATC = clickedElement?.closest('[data-add-to-cart]');

              if (isButtonATC || getButtonATC) {
                event.preventDefault();

                this.button = isButtonATC ? clickedElement : getButtonATC;
                this.form = clickedElement.closest('form');
                this.recipientErrors = this.form?.getAttribute('data-recipient-errors') === 'true';
                this.formWrapper = this.button.closest('[data-form-wrapper]');
                const isVariantSoldOut = this.formWrapper?.classList.contains('variant--soldout');
                const isButtonDisabled = this.button.hasAttribute('disabled');
                const isQuickViewOnboarding = this.button.closest('[data-quick-view-onboarding]');
                const hasDataAtcTrigger = this.button.hasAttribute('data-atc-trigger');
                const hasNotificationPopup = this.button.hasAttribute('data-notification-popup');
                const hasFileInput = this.form?.querySelector('[type="file"]');

                if (isButtonDisabled || hasFileInput || isQuickViewOnboarding) return;

                // Notification popup
                if (isVariantSoldOut && hasNotificationPopup) {
                  new NotificationPopup(this.button);
                  return;
                }

                if (hasDataAtcTrigger) {
                  this.a11y.state.trigger = this.button;
                }

                let formData = new FormData(this.form);

                const hasInputsInNoScript = [...this.form.elements].some((el) => el.closest('noscript'));
                if (hasInputsInNoScript) {
                  formData = this.handleFormDataDuplicates([...this.form.elements], formData);
                }
                const maxInventoryReached = this.form.getAttribute('data-max-inventory-reached');
                const errorMessagePosition = this.form.getAttribute('data-error-message-position');
                this.variantTitle = this.form.getAttribute('data-variant-title');
                this.showCannotAddMoreInCart = false;
                if (maxInventoryReached === 'true' && errorMessagePosition === 'cart') {
                  this.showCannotAddMoreInCart = true;
                }

                this.addToCart(formData);

                // Hook for cart/add.js event
                document.dispatchEvent(
                  new CustomEvent('theme:cart:add', {
                    bubbles: true,
                    detail: {
                      selector: clickedElement,
                    },
                  })
                );
              }
            });
          }

          /**
           * Modify the `formData` object in case there are key/value pairs with an overlapping `key`
           *  - the presence of form input fields inside a `noscript` tag leads to a duplicate `key`, which overwrites the existing `value` when the `FormData` is constructed
           *  - such key/value pairs discrepancies occur in the Theme editor, when any setting is updated, and right before one presses the "Save" button
           *
           * @param   {Array}  A list of all `HTMLFormElement.elements` DOM nodes
           * @param   {Object}  `FormData` object, created with the `FormData()` constructor
           *
           * @return  {Object} Updated `FormData` object that does not contain any duplicate keys
           */
          handleFormDataDuplicates(elements, formData) {
            if (!elements.length || typeof formData !== 'object') return formData;

            elements.forEach((element) => {
              if (element.closest('noscript')) {
                const key = element.getAttribute('name');
                const value = element.value;

                if (key) {
                  const values = formData.getAll(key);
                  if (values.length > 1) values.splice(values.indexOf(value), 1);

                  formData.delete(key);
                  formData.set(key, values[0]);
                }
              }
            });

            return formData;
          }

          /**
           * Get response from the cart
           *
           * @return  {Void}
           */

          getCart() {
            // Render cart drawer if it exists but it's not loaded yet
            if (this.isCartDrawer && !this.isCartDrawerLoaded) {
              const alwaysOpen = false;
              this.renderCartDrawer(alwaysOpen);
            }

            fetch(theme.routes.cart_url + '?section_id=api-cart-items')
              .then(this.handleErrors)
              .then((response) => response.text())
              .then((response) => {
                const element = document.createElement('div');
                element.innerHTML = response;

                const cleanResponse = element.querySelector('[data-api-content]');
                this.build(cleanResponse);
              })
              .catch((error) => console.log(error));
          }

          /**
           * Add item(s) to the cart and show the added item(s)
           *
           * @param   {String}  data
           * @param   {DOM Element}  button
           *
           * @return  {Void}
           */

          addToCart(data) {
            if (this.cartDrawerEnabled && this.button) {
              this.button.classList.add('is-loading');
              this.button.setAttribute('disabled', true);
            }

            fetch(theme.routes.cart_add_url, {
              method: 'POST',
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'application/javascript',
              },
              body: data,
            })
              .then((response) => response.json())
              .then((response) => {
                this.button.disabled = true;
                this.addLoadingClass();

                if (response.status) {
                  this.addToCartError(response);
                  this.removeLoadingClass();
                  if (!this.showCannotAddMoreInCart) return;
                }

                this.hideAddToCartErrorMessage();

                if (this.cartDrawerEnabled) {
                  this.getCart();
                  if (this.showCannotAddMoreInCart) this.updateErrorText(this.variantTitle);
                  this.scrollToCartTop();
                } else {
                  window.location = theme.routes.cart_url;
                }
              })
              .catch((error) => console.log(error));
          }

          /**
           * Update cart
           *
           * @param   {Object}  updateData
           *
           * @return  {Void}
           */

          updateCart(updateData = {}, currentItem = null) {
            let updatedQuantity = updateData.quantity;
            if (currentItem !== null) {
              if (updatedQuantity) {
                currentItem.classList.add('is-loading');
              } else {
                currentItem.classList.add('is-removed');
              }
            }
            this.disableCartButtons();
            this.addLoadingClass();

            const newItem = this.cart.querySelector(`[data-item="${updateData.id}"]`) || currentItem;
            const lineIndex = newItem?.hasAttribute('data-item-index') ? parseInt(newItem.getAttribute('data-item-index')) : 0;
            const itemTitle = newItem?.hasAttribute('data-item-title') ? newItem.getAttribute('data-item-title') : null;

            if (lineIndex === 0) return;

            const data = {
              line: lineIndex,
              quantity: updatedQuantity,
            };

            fetch(theme.routes.cart_change_url, {
              method: 'post',
              headers: {'Content-Type': 'application/json', Accept: 'application/json'},
              body: JSON.stringify(data),
            })
              .then((response) => {
                if (response.status === 400) {
                  const error = new Error(response.status);
                  this.cartDrawerEnabled ? this.getCart() : (window.location = theme.routes.cart_url);
                  throw error;
                }

                return response.text();
              })
              .then((state) => {
                const parsedState = JSON.parse(state);

                if (parsedState.errors) {
                  this.cartUpdateFailed = true;
                  this.updateErrorText(itemTitle);
                  this.toggleErrorMessage();
                  this.resetLineItem(currentItem);
                  this.enableCartButtons();
                  this.removeLoadingClass();
                  this.scrollToCartTop();

                  return;
                }

                this.getCart();
              })
              .catch((error) => {
                console.log(error);
                this.enableCartButtons();
                this.removeLoadingClass();
              });
          }

          /**
           * Reset line item initial state
           *
           * @return  {Void}
           */
          resetLineItem(item) {
            const qtyInput = item.querySelector('[data-quantity-field]');
            const qtySelect = item.querySelector('[data-quantity-select]');
            let qty = qtyInput.getAttribute('value');
            const qtyMax = qtyInput.getAttribute('data-quantity-max');

            if (qtyInput) {
              if (qtyInput.value > qtyMax) {
                qty = qtyMax;
              }

              qtyInput.value = qty;

              if (qtySelect) qtySelect.innerText = qty;
            }
            item.classList.remove('is-loading');
          }

          /**
           * Apply a discount code to the cart.
           * - Reads current applied codes from /cart.js to avoid stale state
           * - Prevents duplicate submissions
           *
           * @param {string} discountCode - The code entered by the customer
           * @return {Promise<void>}
           */
          async applyDiscount(discountCode) {
            const inputCode = String(discountCode || '').trim();
            if (!inputCode) return;

            const currentCodes = await this.getExistingDiscountCodes();
            const lowerInput = inputCode.toLowerCase();
            const hasDuplicate = [...currentCodes, ...this.existingDiscountCodes].some((code) => String(code).toLowerCase() === lowerInput);

            if (hasDuplicate) {
              if (this.discountErrorMessage) {
                this.discountErrorMessage.classList.remove('hidden');
                this.discountErrorMessage.textContent = window.theme.strings.discount_already_applied;
              }
              return;
            }

            const proposedCodes = [...currentCodes, inputCode].join(',');
            this.updateCartDiscounts(proposedCodes, inputCode);
          }

          /**
           * Remove a discount code from the cart.
           * - Reads current applied codes from /cart.js
           * - Submits the remaining codes to the cart update endpoint
           *
           * @param {string} discountCode - The code to remove
           * @return {Promise<void>}
           */
          async removeDiscount(discountCode) {
            const currentCodes = await this.getExistingDiscountCodes();
            const target = String(discountCode || '').toLowerCase();
            const canonical = currentCodes.find((code) => String(code).toLowerCase() === target);
            if (!canonical) return;

            const proposedCodes = currentCodes.filter((code) => code !== canonical).join(',');
            this.updateCartDiscounts(proposedCodes);
          }

          /**
           * Create or replace the AbortController used for discount update requests.
           * Aborts any in-flight submission so the latest attempt is authoritative.
           *
           * @return {AbortController}
           */
          createDiscountAbortController() {
            if (this.activeDiscountFetch) {
              this.activeDiscountFetch.abort();
            }
            this.activeDiscountFetch = new AbortController();
            return this.activeDiscountFetch;
          }

          /**
           * Get currently applied discount codes from the Cart API (GET /cart.js).
           * Returns only codes that Shopify marks as applicable; falls back to in-memory state on error.
           *
           * @return {Promise<string[]>}
           */
          async getExistingDiscountCodes() {
            try {
              const response = await fetch(`${window.Shopify.routes.root}cart.js`, {headers: {Accept: 'application/json'}});
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const cart = await response.json();
              const raw = Array.isArray(cart.discount_codes) ? cart.discount_codes : [];
              return raw.filter((d) => d.applicable).map((d) => d.code);
            } catch (e) {
              return Array.isArray(this.existingDiscountCodes) ? this.existingDiscountCodes.slice() : [];
            }
          }

          /**
           * POST discount update to Shopify's cart update endpoint and parse result.
           *
           * @param {string} discountString - CSV of discount codes to attempt
           * @param {AbortSignal} [signal] - Optional abort signal for in-flight cancellation
           * @return {Promise<{data: any, appliedCodes: string[]}>}
           */
          async updateAndParse(discountString, signal) {
            const response = await fetch(window.theme.routes.cart_update_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                discount: discountString,
              }),
              signal,
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const text = await response.text();
            try {
              const data = JSON.parse(text);
              const rawCodes = Array.isArray(data.discount_codes) ? data.discount_codes : [];
              const appliedCodes = rawCodes.filter((d) => d.applicable).map((d) => d.code);
              return {data, appliedCodes};
            } catch (e) {
              console.error('Failed to parse cart update response:', text);
              throw new Error('Invalid JSON response from server.');
            }
          }

          /**
           * Make a cart discount update and refresh UI.
           * - Disables inputs, shows loading, and uses an AbortController
           * - Sets discountError when attemptedCode is present and not applicable
           * - Syncs local state from server and triggers a cart re-render
           *
           * @param {string} discountString - CSV of codes to set on the cart
           * @param {string|null} attemptedCode - Code the user just tried to add (for UX messaging)
           * @return {Promise<void>}
           */
          async updateCartDiscounts(discountString, attemptedCode = null) {
            this.disableCartButtons();
            this.addLoadingClass();
            this.discountError = false;
            this.shippingDiscountError = false;
            const abortController = this.createDiscountAbortController();

            try {
              // Capture currently visible discount codes rendered by Liquid (shipping codes are not rendered)
              const visibleCodesBefore = Array.from(document.querySelectorAll('[data-discount-body]'))
                .map((el) => el?.dataset?.discountCode)
                .filter(Boolean);

              const {data, appliedCodes} = await this.updateAndParse(discountString, abortController.signal);
              if (attemptedCode) {
                const attempted = (Array.isArray(data.discount_codes) ? data.discount_codes : []).find((d) => d.code === attemptedCode);
                this.discountError = Boolean(attempted && attempted.applicable === false);
                const attemptedApplicable = Boolean(attempted && attempted.applicable === true);
                const codeIncluded = appliedCodes.some((c) => String(c).toLowerCase() === String(attemptedCode).toLowerCase());
                // Defer detection to after the UI re-renders
                this.pendingDiscountCheck = {
                  attemptedCode,
                  attemptedApplicable,
                  codeIncluded,
                  visibleCodesBefore,
                };
              } else {
                this.discountError = false;
              }

              this.existingDiscountCodes = appliedCodes;
              this.getCart();
            } catch (error) {
              // Silently ignore aborted discount requests to avoid noisy logs and stale refreshes
              const isAbortError = error && (error.name === 'AbortError' || (typeof error.message === 'string' && error.message.toLowerCase().includes('abort')));
              if (!isAbortError) {
                console.log(error);
                this.getCart(); // Sync cart state on non-abort errors
              }
            } finally {
              this.activeDiscountFetch = null;
              this.removeLoadingClass();
              this.enableCartButtons();
            }
          }

          /**
           * Disable cart buttons and inputs
           *
           * @return  {Void}
           */
          disableCartButtons() {
            const inputs = this.cart.querySelectorAll('input');
            const buttons = this.cart.querySelectorAll('button, [data-item-remove]');

            if (inputs.length) {
              inputs.forEach((item) => {
                item.classList.add('is-disabled');
                item.blur();
                item.disabled = true;
              });
            }

            if (buttons.length) {
              buttons.forEach((item) => {
                item.setAttribute('disabled', true);
              });
            }
          }

          /**
           * Enable cart buttons and inputs
           *
           * @return  {Void}
           */
          enableCartButtons() {
            const inputs = this.cart.querySelectorAll('input');
            const buttons = this.cart.querySelectorAll('button, [data-item-remove]');

            if (inputs.length) {
              inputs.forEach((item) => {
                item.classList.remove('is-disabled');
                item.disabled = false;
              });
            }

            if (buttons.length) {
              buttons.forEach((item) => {
                item.removeAttribute('disabled');
              });
            }
          }

          /**
           * Update error text
           *
           * @param   {String}  itemTitle
           *
           * @return  {Void}
           */

          updateErrorText(itemTitle) {
            this.cartErrorHolder.querySelector('[data-error-message]').innerText = itemTitle;
          }

          /**
           * Toggle error message
           *
           * @return  {Void}
           */

          toggleErrorMessage() {
            if (!this.cartErrorHolder) return;

            this.cartErrorHolder.classList.toggle('is-expanded', this.cartUpdateFailed || this.showCannotAddMoreInCart);

            if (this.cartUpdateFailed) {
              const cartCloseError = this.cartErrorHolder.querySelector('[data-cart-error-close]');
              this.focusOnErrorMessage(this.cartErrorHolder, cartCloseError);
            }

            // Reset cart error events flag
            this.showCannotAddMoreInCart = false;
            this.cartUpdateFailed = false;
          }

          /**
           * Handle errors
           *
           * @param   {Object}  response
           *
           * @return  {Object}
           */

          handleErrors(response) {
            if (!response.ok) {
              return response.json().then(function (json) {
                const e = new FetchError({
                  status: response.statusText,
                  headers: response.headers,
                  json: json,
                });
                throw e;
              });
            }
            return response;
          }

          /**
           * Add to cart error handle
           *
           * @param   {Object}  data
           * @param   {DOM Element/Null} button
           *
           * @return  {Void}
           */

          addToCartError(data) {
            const buttonQuickBuyForm = this.button.closest('[data-quickbuy-form]');
            const buttonUpsellHolder = this.button.closest('[data-upsell-holder]');
            const isFocusEnabled = !document.body.classList.contains('no-outline');
            // holder: Product form containers or Upsell products in Cart form
            let holder = this.button.closest('[data-product-form], [data-product-form-upsell]')
              ? this.button.closest('[data-product-form], [data-product-form-upsell]')
              : this.button.closest('[data-upsell-holder]');
            let errorContainer = holder.querySelector('[data-cart-errors-container]');

            // Upsell products in Cart form
            if (buttonUpsellHolder) {
              errorContainer = buttonUpsellHolder.querySelector('[data-cart-errors-container]');
            }

            if (this.cartDrawerEnabled && this.button && this.isCartDrawer && !this.cart.contains(this.button)) {
              this.closeCartDrawer();
            }

            this.button.classList.remove('is-loading');
            this.button.removeAttribute('disabled');

            // Error message content
            const closeErrorButton = buttonQuickBuyForm
              ? ''
              : `
      <button type="button" class="errors__button-close" data-close-error>
        ${theme.icons.close}
      </button>
    `;

            let errorMessages = `${data.message}: ${data.description}`;

            if (data.message === data.description) errorMessages = data.message;

            if (this.recipientErrors && data.description && typeof data.description === 'object') {
              errorMessages = Object.entries(data.description)
                .map(([key, value]) => `${value}`)
                .join('<br>');
            }

            errorContainer.innerHTML = `
      <div class="errors" data-error autofocus>
        ${errorMessages}
        ${closeErrorButton}
      </div>
    `;

            // Quick buy in PGI errors
            if (buttonQuickBuyForm) {
              const productItem = errorContainer.closest('[data-product-block]');
              if (!productItem) return;
              const productMediaContainer = productItem.querySelector('[data-product-media-container]');
              if (!productMediaContainer) return;

              productMediaContainer.classList.add('product-grid-item__image--error');

              errorContainer.querySelector('[data-error]').addEventListener('animationend', () => {
                productMediaContainer.classList.remove('product-grid-item__image--error');
                errorContainer.innerHTML = '';

                if (!isFocusEnabled) {
                  document.activeElement.blur();
                }
              });
            } else {
              // PDP form, Quick view popup forms and Upsell sliders errors
              errorContainer.classList.add('is-visible');
              errorContainer.addEventListener('transitionend', () => {
                this.resizeSliders(errorContainer);
                errorContainer.scrollIntoView({behavior: 'smooth', block: 'end'});
              });

              this.handleCloseErrorMessages(errorContainer);
            }
          }

          /**
           * Handle close buttons in error messages containers
           *
           * @param   {Object}  The error container that holds the close button
           * @return  {Void}
           */
          handleCloseErrorMessages(container) {
            const formErrorClose = container.querySelector('[data-close-error]');

            formErrorClose?.addEventListener('click', (event) => {
              const clickedElement = event.target;
              const isFormCloseError = clickedElement.matches('[data-close-error]') || clickedElement.closest('[data-close-error]');

              if (!isFormCloseError) return;

              event.preventDefault();
              container.classList.remove('is-visible');
              container.querySelector('[data-error]').addEventListener('transitionend', () => {
                container.innerHTML = '';
                this.resizeSliders(clickedElement);
              });
            });

            this.focusOnErrorMessage(container, formErrorClose);
          }

          /**
           * Focus on the error container's close button so that the alert message is read outloud on voiceover assistive technologies
           *
           * @param   {Object}  The error container that holds the error message
           * @param   {Object}  The button that closes the error message
           * @return  {Void}
           */
          focusOnErrorMessage(container, button) {
            const isFocusEnabled = !document.body.classList.contains('no-outline');

            if (!isFocusEnabled) return;

            container.addEventListener('transitionend', () => {
              requestAnimationFrame(() => button?.focus({focusVisible: true}));
            });
          }

          /**
           * Hide error message container as soon as an item is successfully added to the cart
           */
          hideAddToCartErrorMessage() {
            const holder = this.button.closest('[data-upsell-holder]') ? this.button.closest('[data-upsell-holder]') : this.button.closest('[data-product-form], [data-product-form-upsell]');
            const errorContainer = holder?.querySelector('[data-cart-errors-container]');
            errorContainer?.classList.remove('is-visible');
          }

          /**
           * Resize sliders height
           *
           * @param   {Object}  Element within the slider container that would be resized
           * @return  {Void}
           */
          resizeSliders(element) {
            const slider = element.closest('.flickity-enabled');

            if (!slider) return;

            const flkty = window.theme.Flickity.data(slider);
            requestAnimationFrame(() => flkty.resize());
          }

          /**
           * Render cart and define all elements after cart drawer is open for a first time
           *
           * @return  {Void}
           */
          renderCartDrawer(alwaysOpen = true) {
            // Only applicable for cart drawer instances
            if (!this.isCartDrawer) {
              return;
            }

            const cartDrawerTemplate = this.cart.querySelector('[data-cart-drawer-template]');

            if (!cartDrawerTemplate) {
              return;
            }

            // Append cart items HTML to the cart drawer container
            this.cart.innerHTML = cartDrawerTemplate.innerHTML;
            this.assignArguments();

            // Bind cart update event
            this.initCartUpdate();

            // Bind cart events
            this.cartEvents();

            // Bind discount event listeners
            this.bindDiscountEventListeners();

            // Bind cart drawer close button event
            this.cartDrawerToggle = this.cart.querySelector('[data-cart-drawer-toggle]');
            this.cartDrawerToggle.addEventListener('click', this.cartDrawerToggleClickEvent);

            this.isCartDrawerLoaded = true;

            this.renderPairProducts();

            // Hook for cart drawer loaded event
            document.dispatchEvent(new CustomEvent('theme:cart:loaded', {bubbles: true}));

            // Open cart drawer after cart items and events are loaded
            if (alwaysOpen) {
              this.openCartDrawer();
            }
          }

          /**
           * Open cart dropdown and add class on body
           *
           * @return  {Void}
           */

          openCartDrawer() {
            // Only applicable for cart drawer instances
            if (!this.isCartDrawer || this.isCartDrawerOpen) {
              return;
            }

            if (!this.isCartDrawerLoaded) {
              this.renderCartDrawer();
              return;
            }

            // Hook for cart drawer open event
            document.dispatchEvent(new CustomEvent('theme:cart:open', {bubbles: true}));
            document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cart}));
            document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawerBody}));

            this.scrollToCartTop();

            document.body.classList.add('js-drawer-open-cart');
            this.cart.classList.add('is-open');
            this.cart.classList.remove('cv-h');

            // Reinit animations on Cart drawer open
            requestAnimationFrame(() => this.animateCartItems('in'));

            this.cartToggleButtons.forEach((button) => {
              button.setAttribute('aria-expanded', true);
            });

            this.a11y.trapFocus({
              container: this.cart,
            });

            // Observe Additional Checkout Buttons
            this.observeAdditionalCheckoutButtons();
            this.isCartDrawerOpen = true;
          }

          /**
           * Animate cart items on cart drawer open/close or cart update
           *
           * @return  {Void}
           */
          animateCartItems(state = 'in') {
            const items = this.cart.querySelectorAll('[data-aos]');

            // Init
            if (state === 'in') {
              items.forEach((item) => requestAnimationFrame(() => item.classList.add('aos-animate')));
            }

            // Reset
            if (state === 'out') {
              items.forEach((item) => item.classList.remove('aos-animate'));
            }
          }

          /**
           * Close cart dropdown and remove class on body
           *
           * @return  {Void}
           */

          closeCartDrawer() {
            // Only applicable for cart drawer instances
            if (!this.isCartDrawer || !this.isCartDrawerOpen) {
              return;
            }

            // Hook for cart drawer close event
            document.dispatchEvent(new CustomEvent('theme:cart:close', {bubbles: true}));

            this.cartErrorHolder.classList.remove('is-expanded');

            this.a11y.removeTrapFocus();

            this.cartToggleButtons.forEach((button) => {
              button.setAttribute('aria-expanded', false);
            });

            document.body.classList.remove('js-drawer-open-cart');
            this.cart.classList.remove('is-open');
            this.itemsHolder.classList.remove('is-updated');

            const onCartDrawerTransitionEnd = (event) => {
              if (event.target !== this.cart) return;

              this.animateCartItems('out');

              this.cart.removeEventListener('transitionend', onCartDrawerTransitionEnd);
            };

            this.cart.addEventListener('transitionend', onCartDrawerTransitionEnd);

            // Fixes header background update on cart-drawer close
            const isFocusEnabled = !document.body.classList.contains('no-outline');
            if (!isFocusEnabled) {
              requestAnimationFrame(() => {
                document.activeElement.blur();
              });
            }

            // Enable page scroll right after the closing animation ends
            const timeout = 400;
            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: timeout}));

            this.isCartDrawerOpen = false;
          }

          /**
           * Toggle cart dropdown
           *
           * @return  {Void}
           */

          toggleCartDrawer() {
            // Only applicable for cart drawer instances
            if (!this.isCartDrawer) return;

            if (this.isCartDrawerOpen) {
              this.closeCartDrawer();
            } else {
              this.openCartDrawer();
            }
          }

          /**
           * Cart drawer toggle events
           *
           * @return  {Void}
           */

          cartDrawerToggleEvents() {
            // Only applicable for cart drawer instances
            if (!this.isCartDrawer) return;

            // Close cart drawer on ESC key pressed
            this.cart.addEventListener('keyup', (event) => {
              if (event.code === theme.keyboardKeys.ESCAPE) {
                this.closeCartDrawer();
              }
            });

            // Define cart drawer toggle button click event
            this.cartDrawerToggleClickEvent = (event) => {
              event.preventDefault();
              const button = event.target;

              if (button.getAttribute('aria-expanded') === 'false') {
                this.a11y.state.trigger = button;
              }

              this.toggleCartDrawer();
            };

            // Define cart drawer close event
            this.cartDrawerCloseEvent = (event) => {
              const isCartDrawerToggle = event.target.matches('[data-cart-drawer-toggle]');
              const isCartDrawerChild = this.cart.contains(event.target);
              const isPopupQuickView = event.target.closest('.popup-quick-view');

              if (!isCartDrawerToggle && !isCartDrawerChild && !isPopupQuickView) {
                this.closeCartDrawer();
              }
            };

            // Bind cart drawer toggle buttons click event
            this.cartToggleButtons.forEach((button) => {
              button.addEventListener('click', this.cartDrawerToggleClickEvent);
            });

            // Close drawers on click outside
            //   Replaced 'click' with 'mousedown' as a quick and simple fix to the dragging issue on the upsell slider
            //   which was causing the cart-drawer to close when we start dragging the slider and finish our drag outside the cart-drawer
            //   which was triggering the 'click' event
            document.addEventListener('mousedown', this.cartDrawerCloseEvent);
          }

          /**
           * Toggle classes on different containers and messages
           *
           * @return  {Void}
           */

          toggleClassesOnContainers() {
            const that = this;

            if (this.isCartPage) {
              this.buttonHolder.classList.toggle('hidden', !that.hasItemsInCart());
            } else {
              this.pairProductsHolder.classList.toggle('hidden', !that.hasItemsInCart());
              this.cartForm.classList.toggle('hidden', !that.hasItemsInCart());
              this.emptyMessageBottom.classList.toggle('hidden', that.hasItemsInCart());
              this.cartNoteHolder.classList.toggle('hidden', !that.hasItemsInCart());
            }
            this.emptyMessage.classList.toggle('hidden', that.hasItemsInCart());
            this.itemsHolder.classList.toggle('hidden', !that.hasItemsInCart());
            this.cartItemsQty.classList.toggle('hidden', !that.hasItemsInCart());
          }

          /**
           * Build cart depends on results
           *
           * @param   {Object}  data
           *
           * @return  {Void}
           */

          build(data) {
            const cartItemsData = data.querySelector('[data-api-line-items]');
            const upsellItemsData = data.querySelector('[data-api-upsell-items]');
            const cartEmptyData = Boolean(cartItemsData === null && upsellItemsData === null);
            const priceData = data.querySelector('[data-api-cart-price]');
            const cartTotal = data.querySelector('[data-cart-total]');

            if (this.priceHolder && priceData) {
              this.priceHolder.innerHTML = priceData.innerHTML;
            }

            // Remove items animate class to reinit animations
            this.animateCartItems('out');

            if (cartEmptyData) {
              this.itemsHolder.innerHTML = '';

              if (this.pairProductsHolder) {
                this.pairProductsHolder.innerHTML = '';
              }
            } else {
              this.itemsHolder.innerHTML = cartItemsData.innerHTML;

              if (this.pairProductsHolder) {
                this.pairProductsHolder.innerHTML = upsellItemsData.innerHTML;
              }

              this.renderPairProducts();
            }

            this.newTotalItems = cartItemsData && cartItemsData.querySelectorAll('[data-cart-item]').length ? cartItemsData.querySelectorAll('[data-cart-item]').length : 0;
            this.subtotal = cartTotal && cartTotal.hasAttribute('data-cart-total') ? parseInt(cartTotal.getAttribute('data-cart-total')) : 0;
            this.cartCount = this.getCartItemCount();

            if (this.cartMessage.length > 0) {
              this.updateProgress();
            }

            this.cartToggleButtons.forEach((button) => {
              button.classList.remove('cart__toggle--has-items');

              if (this.newTotalItems > 0) {
                button.classList.add('cart__toggle--has-items');
              }
            });

            this.toggleErrorMessage();
            this.updateItemsQuantity(this.cartCount);

            // Update cart total price
            this.cartTotalPrice.innerHTML = this.subtotal === 0 ? window.theme.strings.free : window.theme.formatMoney(this.subtotal, theme.moneyWithCurrencyFormat);

            if (this.totalItems !== this.newTotalItems) {
              this.totalItems = this.newTotalItems;

              this.toggleClassesOnContainers();
            }

            // Add class "is-updated" line items holder to reduce cart items animation delay via CSS variables
            if (this.isCartDrawerOpen || this.isCartPage) {
              this.itemsHolder.classList.add('is-updated');
            }

            this.cartEvents();
            this.initCartUpdate();
            this.bindDiscountEventListeners();

            if (this.discountsField) {
              this.discountsField.value = this.existingDiscountCodes.join(',');
            }

            // Post-render check for shipping-only discounts based on UI not gaining a new "remove-discount" pill
            if (this.pendingDiscountCheck) {
              const currentVisibleCodes = Array.from(this.cart.querySelectorAll('[data-discount-body]'))
                .map((el) => el?.dataset?.discountCode)
                .filter(Boolean)
                .map((c) => String(c).toLowerCase());
              const beforeSet = new Set(this.pendingDiscountCheck.visibleCodesBefore.map((c) => String(c).toLowerCase()));
              const attemptedLower = String(this.pendingDiscountCheck.attemptedCode).toLowerCase();
              const uiGainedAttempted = currentVisibleCodes.includes(attemptedLower) && !beforeSet.has(attemptedLower);

              this.shippingDiscountError = Boolean(this.pendingDiscountCheck.attemptedApplicable && this.pendingDiscountCheck.codeIncluded && !uiGainedAttempted);

              this.pendingDiscountCheck = null;
            }

            if (this.shippingDiscountError) {
              if (this.discountErrorMessage) {
                this.discountErrorMessage.textContent = window.theme.strings.shipping_discounts_at_checkout;
                this.discountErrorMessage.classList.remove('hidden');
              }
            } else if (this.discountError) {
              if (this.discountErrorMessage) {
                this.discountErrorMessage.textContent = window.theme.strings.discount_not_applicable;
                this.discountErrorMessage.classList.remove('hidden');
              }
            } else {
              this.discountErrorMessage?.classList.add('hidden');
            }

            this.enableCartButtons();
            this.resetButtonClasses();
            this.removeLoadingClass();

            document.dispatchEvent(new CustomEvent('theme:cart:added', {bubbles: true}));

            if (this.isCartDrawer) {
              this.openCartDrawer();

              // Reinit animations in Cart Drawer after Drawer transition ends
              const onCartDrawerTransitionEnd = (event) => {
                if (event.target !== this.cart) return;

                this.animateCartItems('in');

                this.cart.removeEventListener('transitionend', onCartDrawerTransitionEnd);
              };

              this.cart.addEventListener('transitionend', onCartDrawerTransitionEnd);
            }

            // Reinit animations in Cart
            requestAnimationFrame(() => this.animateCartItems('in'));
          }

          /**
           * Get cart item count
           *
           * @return  {Void}
           */

          getCartItemCount() {
            // Returning 0 and not the actual cart items count is done only for when "Cart type" settings are set to "Page"
            // The actual count is necessary only when we build and render the cart/cart-drawer after we get a response from the Cart API
            if (!this.cart) return 0;
            return Array.from(this.cart.querySelectorAll('[data-quantity-field]')).reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);
          }

          /**
           * Check for items in the cart
           *
           * @return  {Void}
           */

          hasItemsInCart() {
            return this.totalItems > 0;
          }

          /**
           * Show/hide free shipping message
           *
           * @param   {Number}  total
           *
           * @return  {Void}
           */

          freeShippingMessageHandle(total) {
            if (this.cartMessage.length > 0) {
              document.querySelectorAll('[data-cart-message]').forEach((message) => {
                const hasFreeShipping = message.hasAttribute('data-cart-message') && message.getAttribute('data-cart-message') === 'true' && total !== 0;
                const cartMessageDefault = message.querySelector('[data-message-default]');

                message.classList.toggle('is-success', total >= this.cartFreeLimitShipping && hasFreeShipping);
                message.classList.toggle('is-hidden', total === 0);
                if (cartMessageDefault) {
                  cartMessageDefault.classList.toggle('is-hidden', total >= this.cartFreeLimitShipping);
                }
              });
            }
          }

          /**
           * Update progress when update cart
           *
           * @return  {Void}
           */

          updateProgress() {
            const newPercentValue = (this.subtotal / this.cartFreeLimitShipping) * 100;
            let leftToSpend = window.theme.formatMoney(this.cartFreeLimitShipping - this.subtotal, theme.moneyFormat);
            if (leftToSpend.endsWith('.00') || leftToSpend.endsWith(',00')) {
              leftToSpend = leftToSpend.slice(0, -3);
            }

            if (theme.settings.currency_code_enable) {
              leftToSpend += ` ${theme.current_iso_code}`;
            }

            if (this.cartMessage.length > 0) {
              document.querySelectorAll('[data-cart-message]').forEach((message) => {
                const cartMessageProgressItems = message.querySelectorAll('[data-cart-message-progress]');
                const leftToSpendMessage = message.querySelector('[data-left-to-spend]');

                if (leftToSpendMessage) {
                  leftToSpendMessage.innerHTML = leftToSpend;
                }

                if (cartMessageProgressItems.length) {
                  cartMessageProgressItems.forEach((cartMessageProgress, index) => {
                    cartMessageProgress.classList.toggle('is-hidden', this.subtotal / this.cartFreeLimitShipping >= 1);
                    cartMessageProgress.style.setProperty('--progress-width', `${newPercentValue}%`);
                    if (index === 0) {
                      cartMessageProgress.setAttribute('value', newPercentValue);
                    }
                  });
                }

                this.freeShippingMessageHandle(this.subtotal);
              });
            }
          }

          /**
           * Render Upsell Products
           */
          renderPairProducts() {
            this.flktyUpsell = null;
            this.pairProductsHolder = document.querySelector('[data-pair-products-holder]');
            this.pairProducts = document.querySelector('[data-pair-products]');
            this.upsellHolders = document.querySelectorAll('[data-upsell-holder]');

            if (this.pairProductsHolder === null || this.pairProductsHolder === undefined) {
              return;
            }

            // Upsell slider
            const that = this;
            if (this.upsellHolders.length > 1) {
              const flktyUpsell = new window.theme.Flickity(this.pairProducts, {
                wrapAround: true,
                pageDots: true,
                adaptiveHeight: true,
                prevNextButtons: false,
                on: {
                  ready: function () {
                    this.reloadCells();
                    requestAnimationFrame(() => this.resize());

                    that.upsellHolders.forEach((item) => {
                      if (!item.classList.contains('is-selected')) {
                        const links = item.querySelectorAll('a, button');
                        if (links.length) {
                          links.forEach((link) => {
                            link.setAttribute('tabindex', '-1');
                          });
                        }
                      }
                    });
                  },
                },
              });

              flktyUpsell.on('change', (index) => {
                flktyUpsell.cells.forEach((slide, i) => {
                  const links = slide.element.querySelectorAll('a, button');
                  if (links.length) {
                    links.forEach((link) => {
                      link.setAttribute('tabindex', i === index ? '0' : '-1');
                    });
                  }
                });
              });

              return;
            }
          }

          updateItemsQuantity(itemsQty) {
            let oneItemText = theme.strings.cart_items_one;
            let manyItemsText = theme.strings.cart_items_many;
            oneItemText = oneItemText.split('}}')[1];
            manyItemsText = manyItemsText.split('}}')[1];

            if (this.cartItemsQty) {
              this.cartItemsQty.textContent = itemsQty === 1 ? `${itemsQty} ${oneItemText}` : `${itemsQty} ${manyItemsText}`;
            }
          }

          observeAdditionalCheckoutButtons() {
            // identify an element to observe
            const additionalCheckoutButtons = this.cart.querySelector('[data-additional-checkout-button]');
            if (additionalCheckoutButtons) {
              // create a new instance of `MutationObserver` named `observer`,
              // passing it a callback function
              const observer = new MutationObserver(() => {
                this.a11y.removeTrapFocus();
                this.a11y.trapFocus({
                  container: this.cart,
                });
                observer.disconnect();
              });

              // call `observe()` on that MutationObserver instance,
              // passing it the element to observe, and the options object
              observer.observe(additionalCheckoutButtons, {subtree: true, childList: true});
            }
          }

          formSubmitHandler() {
            const termsAccepted = document.querySelector('[data-cart-acceptance-checkbox]').checked;
            const termsError = document.querySelector('[data-terms-error-message]');

            // Disable form submit if terms and conditions are not accepted
            if (!termsAccepted) {
              if (document.querySelector('[data-terms-error-message]').length > 0) {
                return;
              }

              termsError.innerText = theme.strings.cart_acceptance_error;
              this.cartCheckoutButton.setAttribute('disabled', true);
              termsError.classList.add('is-expanded');
            } else {
              termsError.classList.remove('is-expanded');
              this.cartCheckoutButton.removeAttribute('disabled');
            }
            if (this.discountsField) {
              this.discountsField.value = this.existingDiscountCodes.join(',');
            }
          }

          resetButtonClasses() {
            const buttons = document.querySelectorAll('[data-add-to-cart]');
            if (buttons) {
              buttons.forEach((button) => {
                if (button.classList.contains('is-loading')) {
                  button.classList.remove('is-loading');
                  button.classList.add('is-success');

                  setTimeout(() => {
                    button.removeAttribute('disabled');
                    button.classList.remove('is-success');
                  }, settings$4.timers.addProductTimeout);
                }
              });
            }
          }

          addLoadingClass() {
            if (this.isCartDrawer) {
              this.cart.classList.add('is-loading');
            } else if (this.itemsWrapper) {
              this.itemsWrapper.classList.add('is-loading');
            }
          }

          removeLoadingClass() {
            if (this.isCartDrawer) {
              this.cart.classList.remove('is-loading');
            } else if (this.itemsWrapper) {
              this.itemsWrapper.classList.remove('is-loading');
            }
          }

          scrollToCartTop() {
            if (this.isCartDrawer) {
              this.cartDrawerBody.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant',
              });
              return;
            }

            window.scrollTo({
              top: this.outerSection?.offsetTop - this.headerInitialHeight - this.announcementBarHeight,
              left: 0,
              behavior: 'smooth',
            });
          }

          disconnectedCallback() {
            // Clean up cart drawer specific event listeners
            if (this.isCartDrawer) {
              if (this.cartDrawerToggle) {
                this.cartDrawerToggle.removeEventListener('click', this.cartDrawerToggleClickEvent);
              }

              this.cartToggleButtons.forEach((button) => {
                button.removeEventListener('click', this.cartDrawerToggleClickEvent);
              });

              // Close drawers on click outside
              document.removeEventListener('mousedown', this.cartDrawerCloseEvent);

              // Remove popup close listener
              document.removeEventListener('theme:popup:open', this.closeCartDrawer);
            }

            // Clean up will be handled by the browser when the element is removed

            // Clean up cart error close listener if it exists
            if (this.cartCloseErrorMessage) {
              this.cartCloseErrorMessage.removeEventListener('click', this.closeCartError);
            }
          }
        }
      );
    }

    // Drawer Element
    if (!customElements.get('drawer-element')) {
      customElements.define(
        'drawer-element',
        class DrawerElement extends HTMLElement {
          constructor() {
            super();
            this.body = document.body;
            this.a11y = window.theme.a11y;
            this.isMobileMenu = this.hasAttribute('data-drawer-header') || this.hasAttribute('data-drawer-section');

            // Bind methods
            this.handleToggle = this.handleToggle.bind(this);
            this.handleKeyPress = this.handleKeyPress.bind(this);
            this.handleOutsideClick = this.handleOutsideClick.bind(this);
            this.checkScroll = this.checkScroll.bind(this);
            this.handleDrawerOpening = this.handleDrawerOpening.bind(this);
          }

          connectedCallback() {
            this.initListeners();
            this.initMutationObserver();

            // Initialize mobile menu functionality if this is a mobile menu
            if (this.isMobileMenu) {
              this.initMobileMenuBehavior();
            }

            this.checkScroll();
          }

          disconnectedCallback() {
            this.removeEventListener('theme:drawer:toggle', this.handleToggle);
            document.removeEventListener('theme:drawer:opening', this.handleDrawerOpening);
            document.removeEventListener('click', this.handleOutsideClick);
            this.removeEventListener('keyup', this.handleKeyPress);
            window.removeEventListener('resize', this.checkScroll);
            document.removeEventListener('theme:drawer:open', this.checkScroll);

            if (this.mutationObserver) {
              this.mutationObserver.disconnect();
            }
          }

          initListeners() {
            // Listen for toggle events from drawer-toggle elements
            this.addEventListener('theme:drawer:toggle', this.handleToggle);

            // Listen for global events
            document.addEventListener('theme:drawer:opening', this.handleDrawerOpening);
            document.addEventListener('click', this.handleOutsideClick);
            this.addEventListener('keyup', this.handleKeyPress);

            // Scroll detection
            window.addEventListener('resize', this.checkScroll);
            document.addEventListener('theme:drawer:open', this.checkScroll);
          }

          handleDrawerOpening(e) {
            const trigger = e.detail.element;
            if (!trigger || !trigger.hasAttribute('data-mobile-menu-trigger')) {
              return;
            }

            // Handle mobile menu opening
            if (this.isMobileMenu) {
              const targetDrawer = this.determineMobileMenuTarget();
              if (targetDrawer === this) {
                this.open(e);
              }
            }
          }

          determineMobileMenuTarget() {
            const headerMobileDrawer = document.querySelector(`drawer-element[data-drawer-header]`);
            const sectionMobileDrawer = document.querySelector(`drawer-element[data-drawer-section]`);
            return theme.settings.mobileMenuType === 'new' ? sectionMobileDrawer || headerMobileDrawer : headerMobileDrawer;
          }

          handleToggle(e) {
            e.preventDefault();
            const trigger = e.detail.trigger;

            if (this.classList.contains('is-open')) {
              this.close();
            } else {
              this.open({detail: {element: trigger}, target: trigger});
            }
          }

          handleKeyPress(e) {
            if (e.code === theme.keyboardKeys.ESCAPE) {
              this.close(e);
            }
          }

          handleOutsideClick(e) {
            const activeDrawer = document.querySelector(`drawer-element.is-open`);
            if (!activeDrawer || activeDrawer !== this) {
              return;
            }

            const isDrawerToggle = e.target.closest('button')?.querySelector('drawer-toggle') || e.target.closest('drawer-toggle');
            const isDrawerChild = this.contains(e.target);
            const quickviewItem = this.closest('[data-quick-view-item]');
            const isQuickviewChild = quickviewItem ? quickviewItem.contains(e.target) : false;

            if (!isDrawerToggle && !isDrawerChild && !isQuickviewChild) {
              this.close();
            }
          }

          open(e) {
            let trigger = e?.detail?.element || e?.target;
            const drawerScroller = this.querySelector('[data-scroll]') || this;

            // Disable page scroll
            document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: drawerScroller}));
            document.dispatchEvent(new CustomEvent('theme:drawer:open', {bubbles: true}));

            this.body.classList.add('js-drawer-open');

            // Handle special drawer types
            const triggerControls = trigger?.getAttribute('aria-controls');
            if (triggerControls?.includes('size-chart') || triggerControls?.includes('popup-text')) {
              this.body.classList.add('js-drawer-open--inner');

              if (triggerControls.includes('quickview')) {
                this.body.classList.add('js-drawer-open--inner-qv');
              }
            }

            this.classList.add('is-open');
            this.setAttribute('aria-hidden', false);
            this.classList.remove('cv-h');

            if (trigger) {
              trigger.setAttribute('aria-expanded', true);
            }

            // Handle transition end
            const onDrawerTransitionEnd = (event) => {
              const eventProperty = event.propertyName === 'transform' || event.propertyName === 'top';
              if (event.target !== this || !eventProperty) return;

              this.a11y.state.trigger = trigger;
              this.a11y.trapFocus({container: this});
              this.removeEventListener('transitionend', onDrawerTransitionEnd);
            };

            this.addEventListener('transitionend', onDrawerTransitionEnd);
          }

          close(event = false) {
            if (!this.body.classList.contains('js-drawer-open')) {
              return;
            }

            // Update all drawer toggles
            const allToggles = document.querySelectorAll('drawer-toggle');
            allToggles.forEach((toggle) => toggle.updateAriaExpanded(false));

            this.a11y.removeTrapFocus({container: this});
            this.classList.remove('is-open');

            const onDrawerTransitionEnd = (event) => {
              if (event.target !== this) return;

              requestAnimationFrame(() => {
                this.classList.add('cv-h');
                document.dispatchEvent(new CustomEvent('theme:drawer:close', {bubbles: true}));
                document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
                this.setAttribute('aria-hidden', true);
              });

              this.removeEventListener('transitionend', onDrawerTransitionEnd);
            };

            this.addEventListener('transitionend', onDrawerTransitionEnd);

            this.body.classList.remove('js-drawer-open');
            this.body.classList.remove('js-drawer-open--inner');

            if (this.body.classList.contains('js-drawer-open--inner-qv')) {
              this.body.classList.remove('js-drawer-open--inner-qv');

              if (event && event.code === theme.keyboardKeys.ESCAPE) {
                // If Esc pressed - close all drawers and focus the main trigger
                this.a11y.state.trigger = this.a11y.state.mainTrigger;
                this.a11y.state.trigger.focus();
                return;
              }

              // Trap focus in QV drawer
              const quickViewFocus = this.a11y.state.trigger.closest('[data-quick-view-focus]');
              this.a11y.trapFocus({
                container: quickViewFocus,
                elementToFocus: this.a11y.state.trigger,
              });
              this.a11y.state.trigger = this.a11y.state.mainTrigger;
            }
          }

          initMobileMenuBehavior() {
            // Search popdown functionality
            const navSearchOpen = this.querySelectorAll('[data-nav-search-open]');

            navSearchOpen?.forEach((element) => {
              element.addEventListener('click', (event) => {
                event.preventDefault();

                const mobileMenu = document.querySelector('[data-mobile-menu]');
                const navCompress = document.querySelector('[data-nav-items-compress]');

                let isTouch = matchMedia('(pointer:coarse)').matches;
                const viewportMobile = window.innerWidth < theme.sizes.small;

                if (viewportMobile && window.Shopify.designMode) {
                  isTouch = true;
                }

                const popdownToggle = isTouch ? mobileMenu?.querySelector('[data-popdown-toggle]') : navCompress?.querySelector('[data-popdown-toggle]');

                // Trigger drawer opening
                this.dispatchEvent(
                  new CustomEvent('theme:drawer:toggle', {
                    detail: {trigger: element},
                  })
                );

                const onDrawerTransitionEnd = (e) => {
                  if (e.target !== this) return;
                  requestAnimationFrame(() => popdownToggle?.dispatchEvent(new Event('click', {bubbles: true})));
                  this.removeEventListener('transitionend', onDrawerTransitionEnd);
                };

                this.addEventListener('transitionend', onDrawerTransitionEnd);
              });
            });

            // Mobile nav link behavior
            if (theme.settings.mobileMenuBehaviour === 'link') return;

            const navMobileLinks = this.querySelectorAll('[data-nav-link-mobile]');
            if (navMobileLinks.length) {
              navMobileLinks.forEach((link) => {
                link.addEventListener('click', (e) => {
                  const hasDropdown = link.parentNode.querySelectorAll('[data-collapsible-trigger]').length;
                  const dropdownTrigger = link.nextElementSibling;

                  if (hasDropdown) {
                    e.preventDefault();
                    dropdownTrigger.dispatchEvent(new Event('click'), {bubbles: true});
                  }
                });
              });
            }
          }

          initMutationObserver() {
            const scrollableMenuBlocks = this.querySelector('[data-scrollable-menu-blocks]');
            if (!scrollableMenuBlocks) return;

            this.mutationObserver = new MutationObserver((mutations) => {
              const needsScrollCheck = mutations.some((mutation) => {
                return mutation.type === 'childList' || (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class'));
              });

              if (needsScrollCheck) {
                this.checkScroll();
              }
            });

            this.mutationObserver.observe(scrollableMenuBlocks, {
              childList: true,
              subtree: true,
              attributes: true,
            });
          }

          checkScroll() {
            const scrollElement = this.querySelector('[data-scrollable-menu-blocks]');
            if (!scrollElement) return;

            const hasScroll = scrollElement.scrollHeight > scrollElement.clientHeight;
            scrollElement.classList.toggle('drawer__content-scroll--has-scroll', hasScroll);
          }
        }
      );
    }

    // Drawer Toggle
    if (!customElements.get('drawer-toggle')) {
      customElements.define(
        'drawer-toggle',
        class DrawerToggle extends HTMLElement {
          constructor() {
            super();
            this.handleClick = this.handleClick.bind(this);
          }

          connectedCallback() {
            // Get reference to parent button
            this.button = this.closest('button');

            // Set initial ARIA state on button
            this.button.setAttribute('aria-expanded', 'false');

            // Add click listener to button
            this.button.addEventListener('click', this.handleClick);
          }

          disconnectedCallback() {
            if (this.button) {
              this.button.removeEventListener('click', this.handleClick);
            }
          }

          handleClick(e) {
            e.preventDefault();

            // Handle mobile menu triggers differently
            if (this.button.hasAttribute('data-mobile-menu-trigger')) {
              this.handleMobileMenuTrigger(e);
            } else {
              this.handleStandardToggle(e);
            }
          }

          handleMobileMenuTrigger(e) {
            // Dispatch event for mobile menu opening
            document.dispatchEvent(
              new CustomEvent('theme:drawer:opening', {
                bubbles: true,
                detail: {element: this.button},
              })
            );
          }

          handleStandardToggle(e) {
            const targetId = this.button.getAttribute('aria-controls');
            if (!targetId) {
              console.warn('DrawerToggle: Missing aria-controls attribute on button');
              return;
            }

            const targetDrawer = document.getElementById(targetId);
            if (!targetDrawer) {
              console.warn(`DrawerToggle: Target drawer "${targetId}" not found`);
              return;
            }

            // Dispatch toggle event to the target drawer
            targetDrawer.dispatchEvent(
              new CustomEvent('theme:drawer:toggle', {
                detail: {trigger: this.button},
              })
            );
          }

          // Method to update ARIA expanded state (called by drawer)
          updateAriaExpanded(expanded) {
            if (this.button) {
              this.button.setAttribute('aria-expanded', expanded.toString());
            }
          }
        }
      );
    }

    function getScript(url, callback, callbackError) {
      let head = document.getElementsByTagName('head')[0];
      let done = false;
      let script = document.createElement('script');
      script.src = url;

      // Attach handlers for all browsers
      script.onload = script.onreadystatechange = function () {
        if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
          done = true;
          callback();
        } else {
          callbackError();
        }
      };

      head.appendChild(script);
    }

    const loaders = {};
    window.isYoutubeAPILoaded = false;
    window.isVimeoAPILoaded = false;

    function loadScript(options = {}) {
      if (!options.type) {
        options.type = 'json';
      }

      if (options.url) {
        if (loaders[options.url]) {
          return loaders[options.url];
        } else {
          return getScriptWithPromise(options.url, options.type);
        }
      } else if (options.json) {
        if (loaders[options.json]) {
          return Promise.resolve(loaders[options.json]);
        } else {
          return window
            .fetch(options.json)
            .then((response) => {
              return response.json();
            })
            .then((response) => {
              loaders[options.json] = response;
              return response;
            });
        }
      } else if (options.name) {
        const key = ''.concat(options.name, options.version);
        if (loaders[key]) {
          return loaders[key];
        } else {
          return loadShopifyWithPromise(options);
        }
      } else {
        return Promise.reject();
      }
    }

    function getScriptWithPromise(url, type) {
      const loader = new Promise((resolve, reject) => {
        if (type === 'text') {
          fetch(url)
            .then((response) => response.text())
            .then((data) => {
              resolve(data);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          getScript(
            url,
            function () {
              resolve();
            },
            function () {
              reject();
            }
          );
        }
      });

      loaders[url] = loader;
      return loader;
    }

    function loadShopifyWithPromise(options) {
      const key = ''.concat(options.name, options.version);
      const loader = new Promise((resolve, reject) => {
        try {
          window.Shopify.loadFeatures([
            {
              name: options.name,
              version: options.version,
              onLoad: (err) => {
                onLoadFromShopify(resolve, reject, err);
              },
            },
          ]);
        } catch (err) {
          reject(err);
        }
      });
      loaders[key] = loader;
      return loader;
    }

    function onLoadFromShopify(resolve, reject, err) {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    }

    const hosts = {
      html5: 'html5',
      youtube: 'youtube',
      vimeo: 'vimeo',
    };

    const selectors$g = {
      deferredMediaButton: '[data-deferred-media-button]',
      productMediaWrapper: '[data-product-single-media-wrapper]',
      singleMediaGroup: '[data-product-single-media-group]',
      mediaContainer: '[data-media-id]',
      mediaHidden: '.media--hidden',
    };

    const classes$d = {
      mediaHidden: 'media--hidden',
      isLoading: 'is-loading',
    };

    const attributes$a = {
      loaded: 'loaded',
      dataAutoplayVideo: 'data-autoplay-video',
      mediaId: 'data-media-id',
    };

    class DeferredMedia extends HTMLElement {
      constructor() {
        super();

        this.autoplayVideo = this.getAttribute(attributes$a.dataAutoplayVideo) === 'true';
        this.mediaContainer = this.closest(selectors$g.mediaContainer);
        this.mediaId = this.mediaContainer?.dataset.mediaId;
        this.element = null;
        this.host = null;
        this.player = null;

        this.pauseContainerMedia = () => this.pauseOtherMedia();
      }

      connectedCallback() {
        const deferredMediaButton = this.querySelector(selectors$g.deferredMediaButton);

        if (deferredMediaButton) {
          deferredMediaButton.addEventListener('click', () => {
            this.loadContent();
          });
        }

        if (this.autoplayVideo) {
          this.loadContent();
        }
      }

      loadContent() {
        if (this.getAttribute(attributes$a.loaded)) {
          return;
        }

        this.mediaContainer.classList.add(classes$d.isLoading);
        const content = document.createElement('div');
        content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

        this.element = content.querySelector('video, iframe, model-viewer');
        this.appendChild(this.element);
        this.setAttribute('loaded', true);
        this.host = this.hostFromVideoElement(this.element);

        this.element.addEventListener('load', () => {
          this.mediaContainer.classList.remove(classes$d.isLoading);
        });

        switch (this.host) {
          case hosts.html5:
            this.createPlayer(this.mediaId);
            break;
          case hosts.vimeo:
            if (window.isVimeoAPILoaded) {
              this.createPlayer(this.mediaId);
            } else {
              loadScript({url: 'https://player.vimeo.com/api/player.js'}).then(() => this.createPlayer(this.mediaId));
            }
            break;
          case hosts.youtube:
            if (window.isYoutubeAPILoaded) {
              this.createPlayer(this.mediaId);
            } else {
              loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.createPlayer(this.mediaId));
            }
            break;
        }
      }

      hostFromVideoElement(video) {
        if (video.tagName === 'VIDEO') {
          return hosts.html5;
        }

        if (video.tagName === 'IFRAME') {
          if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(video.src)) {
            return hosts.youtube;
          } else if (video.src.includes('vimeo.com')) {
            return hosts.vimeo;
          }
        }

        return null;
      }

      createPlayer() {
        switch (this.host) {
          case hosts.html5:
            this.element.addEventListener('play', () => {
              this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
            });

            this.element.addEventListener('pause', () => {
              this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
            });

            if (this.autoplayVideo) {
              this.observeVideo();
            }

            break;
          case hosts.vimeo:
            this.player = new Vimeo.Player(this.element);
            this.player.play(); // Force video play on iOS
            this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});

            window.isVimeoAPILoaded = true;

            this.player.on('play', () => {
              this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
            });

            this.player.on('pause', () => {
              this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
            });

            if (this.autoplayVideo) {
              this.observeVideo();
            }

            break;
          case hosts.youtube:
            if (this.host == hosts.youtube && this.player) {
              return;
            }

            YT.ready(() => {
              const videoId = this.mediaContainer.dataset.videoId;

              this.player = new YT.Player(this.element, {
                videoId: videoId,
                events: {
                  onReady: (event) => {
                    event.target.playVideo(); // Force video play on iOS
                    this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
                  },
                  onStateChange: (event) => {
                    // Playing
                    if (event.data == 1) {
                      this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
                    }

                    // Paused
                    if (event.data == 2) {
                      this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
                    }

                    // Ended
                    if (event.data == 0) {
                      this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
                    }
                  },
                },
              });

              window.isYoutubeAPILoaded = true;

              if (this.autoplayVideo) {
                this.observeVideo();
              }
            });

            break;
        }

        this.mediaContainer.addEventListener('theme:media:visible', (event) => this.onVisible(event));
        this.mediaContainer.addEventListener('theme:media:hidden', (event) => this.onHidden(event));
        this.mediaContainer.addEventListener('xrLaunch', (event) => this.onHidden(event));
      }

      observeVideo() {
        let observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              const outsideViewport = entry.intersectionRatio == 0;
              const isVisible = !this.element.closest(selectors$g.mediaHidden);

              if (outsideViewport) {
                this.pauseVideo();
              } else if (isVisible) {
                this.playVideo();
              }
            });
          },
          {
            rootMargin: '200px',
            threshold: [0, 0.25, 0.75, 1],
          }
        );
        observer.observe(this.element);
      }

      playVideo() {
        if (this.player && this.player.playVideo) {
          this.player.playVideo();
        } else if (this.element && this.element.play) {
          this.element.play();
        } else if (this.player && this.player.play) {
          this.player.play();
        }

        this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
      }

      pauseVideo() {
        if (this.player && this.player.pauseVideo) {
          // Youtube
          if (this.player.playerInfo.playerState == '1') {
            // If Youtube video is playing
            // There is no need to trigger the 'pause' event since we are listening for it when initializing the YT Video
            this.player.pauseVideo();
          }
        } else if (this.player && this.player.pause) {
          // Vimeo
          this.player.pause();
        } else if (this.element && !this.element.paused) {
          // HTML5
          // If HTML5 video is playing (we used .paused because there is no 'playing' property)
          if (typeof this.element.pause === 'function') {
            this.element?.pause();
          }
        }
      }

      onHidden(event) {
        if (typeof event.target.dataset.mediaId !== 'undefined') {
          this.pauseVideo();
        }
      }

      onVisible(event) {
        if (typeof event.target.dataset.mediaId !== 'undefined') {
          // Using a timeout so the video "play" event can triggers after the previous video "pause" event
          // because both events change the "draggable" option of the slider and we need to time it right
          setTimeout(() => {
            this.playVideo();
          }, 50);

          this.pauseContainerMedia();
        }
      }

      pauseOtherMedia() {
        const currentMedia = `[${attributes$a.mediaId}="${this.mediaId}"]`;
        const mediaGroup = this.closest(selectors$g.singleMediaGroup);
        const otherMedia = mediaGroup.querySelectorAll(`${selectors$g.productMediaWrapper}:not(${currentMedia})`);

        if (otherMedia.length) {
          otherMedia.forEach((media) => {
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$d.mediaHidden);
          });
        }
      }
    }

    if (!customElements.get('deferred-media')) {
      customElements.define('deferred-media', DeferredMedia);
    }

    window.theme.DeferredMedia = window.theme.DeferredMedia || DeferredMedia;

    const selectors$f = {
      collapsible: '[data-collapsible]',
      toggleEllipsis: 'toggle-ellipsis',
      content: '[data-content]',
      actions: '[data-actions]',
      height: '[data-height]',
      collapsibleContent: '[data-collapsible-content]',
      collapsibleContainer: '[data-collapsible-container]',
      single: '[data-collapsible-single]', // Add this attribute when we want only one item expanded at the same time
      trigger: '[data-collapsible-trigger]',
      transitionOverride: '[data-collapsible-transition-override]',
    };

    const classes$c = {
      isExpanded: 'is-expanded',
      isOpen: 'is-open',
    };

    const attributes$9 = {
      expanded: 'aria-expanded',
      controls: 'aria-controls',
      triggerMobile: 'data-collapsible-trigger-mobile',
      single: 'data-collapsible-single',
    };

    const settings$3 = {
      animationDelay: 500,
    };

    if (!customElements.get('collapsible-elements')) {
      customElements.define(
        'collapsible-elements',
        class CollapsibleElements extends HTMLElement {
          constructor() {
            super();

            this.single = this.hasAttribute(attributes$9.single);
            this.triggers = this.querySelectorAll(selectors$f.trigger);
            this.resetHeightTimer = 0;
            this.isTransitioning = false;
            this.transitionOverride = this.closest(selectors$f.transitionOverride);
            this.collapsibleToggleEvent = (event) => window.theme.throttle(this.collapsibleToggle(event), 1250);
            this.onResizeEvent = () => this.onResize();
          }

          connectedCallback() {
            window.addEventListener('theme:resize:width', this.onResizeEvent);

            this.triggers.forEach((trigger) => {
              trigger.addEventListener('click', this.collapsibleToggleEvent);
              trigger.addEventListener('keyup', this.collapsibleToggleEvent);
            });

            this.addEventListener('theme:ellipsis:toggle', (event) => {
              this.handleEllipsisToggle(event);
            });
          }

          disconnectedCallback() {
            window.removeEventListener('theme:resize:width', this.onResizeEvent);
          }

          handleEllipsisToggle(event) {
            const {dropdownHeight = 0, isExpanded = false} = event.detail;
            const productAccordion = event.target.closest(selectors$f.collapsible);

            if (!productAccordion) return;

            const trigger = productAccordion.querySelector(selectors$f.trigger);
            if (!trigger) return;

            const dropdownId = trigger.getAttribute(attributes$9.controls);
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;

            const heightElement = productAccordion.querySelector(selectors$f.height);
            const ellipsisClosedHeight = heightElement ? parseInt(heightElement.dataset.height, 10) || 0 : 0;

            this.setDropdownHeight(dropdown, isExpanded ? dropdownHeight : ellipsisClosedHeight);
          }

          collapsibleToggle(e) {
            e.preventDefault();

            const trigger = e.target.matches(selectors$f.trigger) ? e.target : e.target.closest(selectors$f.trigger);
            const dropdownId = trigger.getAttribute(attributes$9.controls);
            const dropdown = document.getElementById(dropdownId);
            const triggerMobile = trigger.hasAttribute(attributes$9.triggerMobile);
            const isExpanded = trigger.classList.contains(classes$c.isExpanded);
            const isSpace = e.code === theme.keyboardKeys.SPACE;
            const isEscape = e.code === theme.keyboardKeys.ESCAPE;
            const isMobile = window.innerWidth < theme.sizes.small;

            // Do nothing if transitioning
            if (this.isTransitioning && !this.transitionOverride) {
              return;
            }

            // Do nothing if any different than ESC and Space key pressed
            if (e.code && !isSpace && !isEscape) {
              return;
            }

            // Do nothing if ESC key pressed and not expanded or mobile trigger clicked and screen not mobile
            if ((!isExpanded && isEscape) || (triggerMobile && !isMobile)) {
              return;
            }

            this.isTransitioning = true;
            trigger.disabled = true;

            // Close other expanded items when single expansion is enabled
            if (this.single) {
              this.closeOtherItems(trigger);
            }

            // requestAnimationFrame fixes content jumping when item is sliding down
            requestAnimationFrame(() => {
              isExpanded ? this.closeItem(dropdown, trigger) : this.openItem(dropdown, trigger);
            });
          }

          closeOtherItems(trigger) {
            const triggerContainer = trigger.closest(selectors$f.single);

            this.triggers.forEach((otherTrigger) => {
              // Skip if it's the same trigger or not expanded
              if (trigger === otherTrigger || !otherTrigger.classList.contains(classes$c.isExpanded)) {
                return;
              }

              // Skip if triggers are in different parent containers
              const otherTriggerContainer = otherTrigger.closest(selectors$f.single);
              if (triggerContainer !== otherTriggerContainer) {
                return;
              }

              // Close the expanded item
              const dropdown = document.getElementById(otherTrigger.getAttribute(attributes$9.controls));
              requestAnimationFrame(() => this.closeItem(dropdown, otherTrigger));
            });
          }

          openItem(dropdown, trigger) {
            const dropdownHeight = dropdown.querySelector(selectors$f.collapsibleContent).offsetHeight;
            this.setDropdownHeight(dropdown, dropdownHeight);
            this.handleTransitioning(dropdown, true);
            this.updateAttributes(trigger, dropdown, true);

            trigger.dispatchEvent(
              new CustomEvent('theme:form:sticky', {
                bubbles: true,
                detail: {
                  element: 'accordion',
                },
              })
            );
          }

          closeItem(dropdown, trigger) {
            let dropdownHeight = dropdown.querySelector(selectors$f.collapsibleContent).offsetHeight;
            this.setDropdownHeight(dropdown, dropdownHeight);
            this.handleTransitioning(dropdown, false);
            this.updateAttributes(trigger, dropdown, false);

            requestAnimationFrame(() => {
              dropdownHeight = 0;
              this.setDropdownHeight(dropdown, 0);
            });
          }

          setDropdownHeight(dropdown, height) {
            dropdown.style.height = `${height}px`;
          }

          handleTransitioning(dropdown, isExpanded = false) {
            if (this.resetHeightTimer) clearTimeout(this.resetHeightTimer);

            if (isExpanded) {
              this.resetHeightTimer = setTimeout(() => {
                const toggleEllipsis = dropdown.querySelector(selectors$f.toggleEllipsis);
                if (!toggleEllipsis) dropdown.style.height = 'auto';
                this.isTransitioning = false;
              }, settings$3.animationDelay);
            } else {
              this.isTransitioning = false;
              this.resetHeightTimer = setTimeout(() => {
                dropdown.style.height = '';
              }, settings$3.animationDelay);
            }
          }

          updateAttributes(trigger, dropdown, isExpanded) {
            dropdown.classList.toggle(classes$c.isExpanded, isExpanded);
            trigger.setAttribute(attributes$9.expanded, isExpanded);
            trigger.classList.toggle(classes$c.isExpanded, isExpanded);

            // Always remove trigger disabled attribute after animation completes
            setTimeout(() => {
              trigger.disabled = false;
            }, settings$3.animationDelay);
          }

          onResize() {
            if (!this.querySelector(`.${classes$c.isExpanded}`)) return;

            const expandedDropdowns = Array.from(document.querySelectorAll(`${selectors$f.collapsible}:has(.${classes$c.isExpanded})`));
            const openedEllipsis = document.querySelectorAll(`${selectors$f.collapsible}:has(${selectors$f.toggleEllipsis}.${classes$c.isOpen})`);

            expandedDropdowns.forEach((dropdown) => {
              const toggleEllipsis = dropdown.querySelector(selectors$f.toggleEllipsis);
              if (toggleEllipsis?.classList.contains(classes$c.isOpen)) {
                this.updateDropdownHeight(dropdown);
              }
            });

            openedEllipsis.forEach((accordion) => {
              if (!expandedDropdowns.includes(accordion)) {
                this.updateDropdownHeight(accordion, true);
              }
            });
          }

          updateDropdownHeight = (dropdown, ellipsis = false) => {
            const container = dropdown.querySelector(selectors$f.collapsibleContainer);
            const toggleEllipsis = dropdown.querySelector(selectors$f.toggleEllipsis);
            const actions = toggleEllipsis.querySelector(selectors$f.actions);
            const content = toggleEllipsis.querySelector(selectors$f.content);
            const dropdownHeight = content.offsetHeight + actions.offsetHeight * 2;

            if (!ellipsis) {
              this.setDropdownHeight(container, dropdownHeight);
            }

            toggleEllipsis.style.setProperty('--height', `${dropdownHeight}px`);
          };
        }
      );
    }

    const selectors$e = {
      scrollbar: '[data-custom-scrollbar]',
      scrollbarItems: '[data-custom-scrollbar-items]',
      scrollbarThumb: '[data-custom-scrollbar-thumb]',
      current: '.current',
    };

    if (!customElements.get('custom-scrollbar')) {
      customElements.define(
        'custom-scrollbar',
        class CustomScrollbar extends HTMLElement {
          constructor() {
            super();

            this.scrollbarItems = this.querySelector(selectors$e.scrollbarItems);
            this.scrollbar = this.querySelector(selectors$e.scrollbar);
            this.scrollbarThumb = this.querySelector(selectors$e.scrollbarThumb);
            this.trackWidth = 0;
            this.calcScrollbarEvent = () => this.calculateScrollbar();
            this.onScrollbarChangeEvent = (e) => this.onScrollbarChange(e);
          }

          connectedCallback() {
            if (!this.scrollbar || !this.scrollbarItems) return;

            this.events();
            this.calculateScrollbar();
            if (this.scrollbarItems.children.length) {
              this.calculateTrack(this.scrollbarItems.querySelector(selectors$e.current));
            }
          }

          calculateTrack(element) {
            if (!element) {
              this.scrollbar.style.setProperty('--thumb-scale', 0);
              this.scrollbar.style.setProperty('--thumb-position', '0px');
              return;
            }

            const thumbScale = element.clientWidth / this.scrollbarThumb.parentElement.clientWidth;
            const thumbPosition = element.offsetLeft / this.scrollbarThumb.parentElement.clientWidth;
            this.scrollbar.style.setProperty('--thumb-scale', thumbScale);
            this.scrollbar.style.setProperty('--thumb-position', `${this.trackWidth * thumbPosition}px`);
          }

          calculateScrollbar() {
            if (this.scrollbarItems.children.length) {
              const childrenArr = [...this.scrollbarItems.children];
              this.trackWidth = 0;

              childrenArr.forEach((element) => {
                this.trackWidth += element.getBoundingClientRect().width + parseInt(window.getComputedStyle(element).marginRight);
              });
              this.scrollbar.style.setProperty('--track-width', `${this.trackWidth}px`);
            }
          }

          onScrollbarChange(e) {
            if (e?.detail?.element && this.contains(e.detail.element)) {
              this.calculateTrack(e.detail.element);
            }
          }

          events() {
            document.addEventListener('theme:resize:width', this.calcScrollbarEvent);
            this.addEventListener('theme:custom-scrollbar:change', this.onScrollbarChangeEvent);
          }

          disconnectedCallback() {
            document.removeEventListener('theme:resize:width', this.calcScrollbarEvent);
            this.removeEventListener('theme:custom-scrollbar:change', this.onScrollbarChangeEvent);
          }
        }
      );
    }

    if (!customElements.get('grid-slider')) {
      customElements.define(
        'grid-slider',

        class GridSlider extends HTMLElement {
          constructor() {
            super();

            this.flkty = null;
            this.recentlyViewedParent = null;
            this.checkSlidesSizeCallback = () => this.checkSlidesSize();
            this.resetSliderEvent = (e) => this.resetSlider(e);
            this.resizeSliderEvent = () => this.resizeSlider();
          }
          get items() {
            return [...this.querySelectorAll('[data-slide]')];
          }

          connectedCallback() {
            this.listen();
            this.handleLastSlideOverlayOnMobile();
            this.listenForRecentlyViewedLoaded();
          }

          initSlider() {
            this.classList.remove('carousel--inactive');
            this.flkty = new window.theme.Flickity.data(this);

            if (!this.flkty.isActive && this.items.length > 1) {
              this.flkty = new window.theme.Flickity(this, {
                pageDots: false,
                cellSelector: '[data-slide]',
                cellAlign: 'left',
                groupCells: true,
                contain: true,
                wrapAround: false,
                adaptiveHeight: false,
                on: {
                  ready: () => {
                    this.setSliderArrowsPosition();
                    setTimeout(() => {
                      this.changeTabIndex();
                    }, 0);
                  },
                  change: () => {
                    this.changeTabIndex();
                  },
                },
              });

              this.handleLastSlideOverlayOnTablet();
            } else {
              this.setSliderArrowsPosition();
            }
          }

          destroySlider() {
            if (this.classList.contains('carousel')) {
              this.classList.add('carousel--inactive');
            }

            if (this.flkty !== null) {
              this.flkty.destroy();
            }
          }

          // Move slides to their initial position
          resetSlider(e) {
            const slider = e.target;

            if (this.flkty !== null) {
              this.flkty.select(0, false, true);
            } else {
              slider.scrollTo({
                left: 0,
                behavior: 'instant',
              });
            }
          }

          resizeSlider() {
            if (this.flkty !== null) {
              this.flkty.resize();
              requestAnimationFrame(() => this.setSliderArrowsPosition());
            }
          }

          checkSlidesSize() {
            const columns = parseInt(this.dataset.columns);
            const isDesktop = window.innerWidth >= theme.sizes.large;
            const isLaptop = window.innerWidth >= theme.sizes.large && window.innerWidth < theme.sizes.widescreen;
            const isTablet = window.innerWidth >= theme.sizes.small && window.innerWidth < theme.sizes.large;
            const slides = this.querySelectorAll('[data-slide]');
            let itemsCount = slides.length;
            const promos = this.querySelectorAll('[data-promo]');

            // If there are promos in the grid with different width
            if (promos.length && isDesktop) {
              promos.forEach((promo) => {
                if (promo.classList.contains('collection-promo--full')) {
                  itemsCount += columns - 1;
                } else if (promo.classList.contains('collection-promo--two-columns')) {
                  itemsCount += 1;
                }
              });
            }

            // If tab collection has show image enabled
            if (this.hasAttribute('data-slider-show-image')) {
              itemsCount += 1;
            }

            if ((isDesktop && itemsCount > columns) || (isLaptop && itemsCount > 3) || (isTablet && itemsCount > 2)) {
              this.initSlider();
              this.getTallestProductGridItem();
              requestAnimationFrame(() => {
                this.dispatchEvent(new CustomEvent('theme:slider:resize', {bubbles: true}));
              });
            } else {
              this.destroySlider();
            }
          }

          changeTabIndex() {
            const selectedElementsIndex = this.flkty.selectedIndex;

            this.flkty.slides.forEach((slide, index) => {
              slide.cells.forEach((cell) => {
                cell.element.querySelectorAll('a, button').forEach((link) => {
                  link.setAttribute('tabindex', selectedElementsIndex === index ? '0' : '-1');
                });
              });
            });
          }

          setSliderArrowsPosition() {
            const arrows = this.querySelectorAll('.flickity-button');
            const image = this.querySelector('[data-product-media-container]');

            if (arrows.length && image) {
              arrows.forEach((arrow) => {
                arrow.style.top = `${image.offsetHeight / 2}px`;
              });
            }
          }

          handleLastSlideOverlayOnTablet() {
            this.flkty.on('select', () => {
              const isTablet = window.innerWidth >= theme.sizes.small && window.innerWidth < theme.sizes.large;

              if (!isTablet) return;

              const selectedIndex = this.flkty.selectedIndex;
              const sliderGroups = this.flkty.slides.length - 1;
              const isLastSliderGroup = sliderGroups === selectedIndex;

              this.parentNode.classList.toggle('is-last-slide-visible', isLastSliderGroup);
            });
          }

          getTallestProductGridItem() {
            const promos = this.querySelectorAll('[data-promo]');

            if (promos.length) {
              const productGridItems = this.querySelectorAll('[data-product-block]');
              const tallestGridItemHeight = Math.max(...Array.from(productGridItems).map((productGridItem) => productGridItem.offsetHeight));

              this.style.setProperty('--carousel-promo-height', `${tallestGridItemHeight}px`);
            }
          }

          handleLastSlideOverlayOnMobile() {
            this.addEventListener('scroll', (event) => {
              const isMobile = window.innerWidth < theme.sizes.small;

              if (!isMobile) return;

              const offsetWidth = event.target.offsetWidth;
              const lastSlide = Array.from(this.children).pop();
              const rect = lastSlide.getBoundingClientRect();
              const isLastSlideVisible = rect.left + 80 < offsetWidth; // 80px is enough to negate the small visible part of the slide on the right

              this.parentNode.classList.toggle('is-last-slide-visible', isLastSlideVisible);
            });
          }

          listen() {
            this.checkSlidesSize();
            document.addEventListener('theme:resize:width', this.checkSlidesSizeCallback);

            this.addEventListener('theme:tab:change', this.resetSliderEvent);
            this.addEventListener('theme:slider:resize', this.resizeSliderEvent);
          }

          listenForRecentlyViewedLoaded() {
            // Find the recently-viewed parent element
            this.recentlyViewedParent = this.closest('recently-viewed');

            if (this.recentlyViewedParent) {
              // Listen for the recently viewed products loaded event
              this.recentlyViewedParent.addEventListener('theme:recently-viewed:loaded', this.checkSlidesSizeCallback);
            }
          }

          /**
           * Event callback for Theme Editor `shopify:section:unload` event
           */
          disconnectedCallback() {
            this.destroySlider();

            document.removeEventListener('theme:resize:width', this.checkSlidesSizeCallback);

            this.removeEventListener('theme:tab:change', this.resetSliderEvent);
            this.removeEventListener('theme:slider:resize', this.resizeSliderEvent);

            // Clean up recently viewed event listener
            if (this.recentlyViewedParent) {
              this.recentlyViewedParent.removeEventListener('theme:recently-viewed:loaded', this.checkSlidesSizeCallback);
            }
          }
        }
      );
    }

    const selectors$d = {
      scrollToTop: '[data-scroll-top-button]',
    };
    const classes$b = {
      isVisible: 'is-visible',
    };

    // Scroll to top button
    const scrollTopButton = document.querySelector(selectors$d.scrollToTop);
    if (scrollTopButton) {
      scrollTopButton.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      });
      document.addEventListener(
        'scroll',
        window.theme.throttle(() => {
          scrollTopButton.classList.toggle(classes$b.isVisible, window.pageYOffset > window.innerHeight);
        }, 150)
      );
    }

    const selectors$c = {
      details: 'details',
      popdownBody: '[data-popdown-body]',
      popdownClose: '[data-popdown-close]',
      popdownToggle: '[data-popdown-toggle]',
      searchFormInner: '[data-search-form-inner]',
      input: 'input:not([type="hidden"])',
      popularSearchesLink: '[data-popular-searches-link]',
      header: '[data-site-header]',
      nav: '[data-nav]',
      navItemsCompress: '[data-nav-items-compress]',
      navIcons: '[data-nav-icons]',
      mobileMenu: '[data-mobile-menu]',
      predictiveSearch: 'predictive-search',
      searchForm: 'search-form',
    };

    const attributes$8 = {
      popdownInHeader: 'data-popdown-in-header',
      popdownInPage: 'data-popdown-in-page',
      searchPerformed: 'data-search-performed',
      ariaActivedescendant: 'aria-activedescendant',
      ariaExpanded: 'aria-expanded',
      open: 'open',
      role: 'role',
    };

    const classes$a = {
      searchOpened: 'search-opened',
      headerMenuOpened: 'site-header--menu-opened',
      headerCompress: 'site-header--compress',
      open: 'is-open',
    };

    class SearchPopdown extends HTMLElement {
      constructor() {
        super();
        this.isPopdownInHeader = this.hasAttribute(attributes$8.popdownInHeader);
        this.isPopdownInPage = this.hasAttribute(attributes$8.popdownInPage);
        this.popdownBody = this.querySelector(selectors$c.popdownBody);
        this.popdownClose = this.querySelector(selectors$c.popdownClose);
        this.searchFormInner = this.querySelector(selectors$c.searchFormInner);
        this.popularSearchesLink = this.querySelectorAll(selectors$c.popularSearchesLink);
        this.searchFormWrapper = this.querySelector(selectors$c.searchForm) ? this.querySelector(selectors$c.searchForm) : this.querySelector(selectors$c.predictiveSearch);
        this.predictiveSearch = this.searchFormWrapper.matches(selectors$c.predictiveSearch);
        this.header = document.querySelector(selectors$c.header);
        this.headerSection = this.header?.parentNode;
        this.nav = this.header?.querySelector(selectors$c.nav);
        this.mobileMenu = this.headerSection?.querySelector(selectors$c.mobileMenu);
        this.a11y = window.theme.a11y;
        this.ensureClosingOnResizeEvent = () => this.ensureClosingOnResize();
        this.popdownTransitionCallbackEvent = (event) => this.popdownTransitionCallback(event);
        this.detailsToggleCallbackEvent = (event) => this.detailsToggleCallback(event);

        if (this.isPopdownInHeader) {
          this.details = this.querySelector(selectors$c.details);
          this.popdownToggle = this.querySelector(selectors$c.popdownToggle);
        }
      }

      connectedCallback() {
        if (this.isPopdownInHeader) {
          this.searchFormInner.addEventListener('transitionend', this.popdownTransitionCallbackEvent);
          this.details.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
          this.details.addEventListener('toggle', this.detailsToggleCallbackEvent);
          this.popdownClose.addEventListener('click', (event) => this.close(event));
          this.popdownToggle.addEventListener('click', (event) => this.onPopdownToggleClick(event));
          this.popdownToggle.setAttribute(attributes$8.role, 'button');
        }

        if (this.isPopdownInPage) {
          this.popdownClose.addEventListener('click', () => this.triggerPopdownClose());
          this.searchFormWrapper.addEventListener('focusout', () => this.onFocusOut());
          this.searchFormWrapper.input?.addEventListener('click', (event) => this.triggerPopdownOpen(event));
        }

        this.popularSearchesLink.forEach((element) => {
          element.addEventListener('click', (event) => {
            event.preventDefault();
            const popularSearchText = event.target.textContent;

            this.searchFormWrapper.input.value = popularSearchText;
            this.searchFormWrapper.submit();
          });
        });
      }

      // Prevent the default details toggle and close manually the popdown
      onPopdownToggleClick(event) {
        const isChrome = navigator.userAgent.includes('Chrome');
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isChrome && !isIOS) {
          event.target.closest(selectors$c.details).setAttribute(attributes$8.open, '');
        }
        if (event.target.closest(selectors$c.details).hasAttribute(attributes$8.open)) {
          event.preventDefault();
          this.close();
        }
      }

      // Use default details toggle to open the search popdown
      detailsToggleCallback(event) {
        if (event.target.hasAttribute(attributes$8.open)) {
          this.open();
        }
      }

      popdownTransitionCallback(event) {
        if (event.target !== this.searchFormInner) return;

        if (!this.details.classList.contains(classes$a.open)) {
          this.onClose();
        } else if (event.propertyName === 'transform') {
          // Wait for the 'transform' transition to complete in order to prevent jumping content issues because of the trapFocus
          this.a11y.trapFocus({
            container: this.searchFormInner,
          });
        }
      }

      onBodyClick(event) {
        const isTargetInPopdown = this.contains(event.target);
        const isHeaderMenuOpened = this.header?.classList.contains(classes$a.headerMenuOpened);

        if (isHeaderMenuOpened || isTargetInPopdown) return;
        if (!isTargetInPopdown) this.close();
      }

      onFocusOut() {
        if (!this.predictiveSearch) return;

        requestAnimationFrame(() => {
          if (!this.searchFormWrapper.contains(document.activeElement)) {
            this.searchFormWrapper.close();
          }
        });
      }

      triggerPopdownOpen(event) {
        let isTouch = matchMedia('(pointer:coarse)').matches;
        const viewportMobile = window.innerWidth < theme.sizes.small;
        const shouldOpenPopdownOnTouchDevice = isTouch || viewportMobile;

        if (viewportMobile && window.Shopify.designMode) {
          isTouch = true;
        }

        if (!this.nav || !this.mobileMenu) return;

        if (shouldOpenPopdownOnTouchDevice) {
          event.preventDefault();

          const isHeaderCompressed = this.header.classList.contains(classes$a.headerCompress);
          let popdownToggle = this.mobileMenu.querySelector(selectors$c.popdownToggle);

          if (!isTouch) {
            popdownToggle = isHeaderCompressed
              ? this.nav.querySelector(`${selectors$c.navItemsCompress} ${selectors$c.popdownToggle}`)
              : this.nav.querySelector(`${selectors$c.navIcons} ${selectors$c.popdownToggle}`);
          }

          setTimeout(() => {
            popdownToggle?.dispatchEvent(new Event('click', {bubbles: true}));
          }, 300);
        }
      }

      open() {
        this.onBodyClickEvent = (event) => this.onBodyClick(event);
        this.searchFormWrapper.input.setAttribute(attributes$8.ariaExpanded, true);

        document.body.classList.add(classes$a.searchOpened);
        document.body.addEventListener('click', this.onBodyClickEvent);
        document.addEventListener('theme:resize', this.ensureClosingOnResizeEvent);
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));

        // Safari opening transition fix
        requestAnimationFrame(() => {
          this.details.classList.add(classes$a.open);
        });
      }

      close(event) {
        // Do nothing if there are selected items and the target element is the close button
        const ariaActivedescendant = this.searchFormWrapper.input.getAttribute(attributes$8.ariaActivedescendant);
        if (event && event.target === this.popdownClose && ariaActivedescendant && ariaActivedescendant !== '') return;
        this.a11y.removeTrapFocus();
        this.details.classList.remove(classes$a.open);
        if (this.predictiveSearch) this.searchFormWrapper.close();
        this.searchFormWrapper.handleFocusableDescendants(true);
      }

      triggerPopdownClose() {
        if (this.predictiveSearch) this.searchFormWrapper.close();

        if (this.searchFormWrapper.popularSearches) {
          requestAnimationFrame(() => document.activeElement.blur());
        }
      }

      onClose() {
        this.details.removeAttribute(attributes$8.open);
        document.dispatchEvent(new CustomEvent('theme:search:close', {bubbles: true}));
        document.body.classList.remove(classes$a.searchOpened);
        document.body.removeEventListener('click', this.onBodyClickEvent);
        document.removeEventListener('theme:resize', this.ensureClosingOnResizeEvent);
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }

      ensureClosingOnResize() {
        // Due to having multiple <search-popdown> elements in `.mobile-menu`, `.nav--default` or `.menu__item--compress` parents,
        // the element can become hidden when the browser is resized
        // `transitionend` event is then not fired and the closing methods are not finished properly
        const isElementHiddenFromView = this.offsetParent === null;
        if (!isElementHiddenFromView) return;

        this.onClose();
      }
    }

    customElements.define('search-popdown', SearchPopdown);

    /**
     * Module to show Recently Viewed Products
     *
     * Copyright (c) 2014 Caroline Schnapp (11heavens.com)
     * Dual licensed under the MIT and GPL licenses:
     * http://www.opensource.org/licenses/mit-license.php
     * http://www.gnu.org/licenses/gpl.html
     *
     */

    Shopify.Products = (function () {
      const config = {
        howManyToShow: 4,
        howManyToStoreInMemory: 10,
        wrapperId: 'recently-viewed-products',
        section: null,
        onComplete: null,
      };

      let productHandleQueue = [];
      let wrapper = null;
      let howManyToShowItems = null;

      const today = new Date();
      const expiresDate = new Date();
      const daysToExpire = 90;
      expiresDate.setTime(today.getTime() + 3600000 * 24 * daysToExpire);

      const cookie = {
        configuration: {
          expires: expiresDate.toGMTString(),
          path: '/',
          domain: window.location.hostname,
          sameSite: 'none',
          secure: true,
        },
        name: 'shopify_recently_viewed',
        write: function (recentlyViewed) {
          const recentlyViewedString = encodeURIComponent(recentlyViewed.join(' '));
          document.cookie = `${this.name}=${recentlyViewedString}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
        },
        read: function () {
          let recentlyViewed = [];
          let cookieValue = null;

          if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
            cookieValue = document.cookie
              .split('; ')
              .find((row) => row.startsWith(this.name))
              .split('=')[1];
          }

          if (cookieValue !== null) {
            recentlyViewed = decodeURIComponent(cookieValue).split(' ');
          }

          return recentlyViewed;
        },
        destroy: function () {
          const cookieVal = null;
          document.cookie = `${this.name}=${cookieVal}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
        },
        remove: function (productHandle) {
          const recentlyViewed = this.read();
          const position = recentlyViewed.indexOf(productHandle);
          if (position !== -1) {
            recentlyViewed.splice(position, 1);
            this.write(recentlyViewed);
          }
        },
      };

      const finalize = (wrapper, section) => {
        wrapper.classList.remove('hidden');
        const cookieItemsLength = cookie.read().length;

        if (Shopify.recentlyViewed && howManyToShowItems && cookieItemsLength && cookieItemsLength < howManyToShowItems && wrapper.children.length) {
          let allClassesArr = [];
          let addClassesArr = [];
          let objCounter = 0;
          for (const property in Shopify.recentlyViewed) {
            objCounter += 1;
            const objString = Shopify.recentlyViewed[property];
            const objArr = objString.split(' ');
            const propertyIdx = parseInt(property.split('_')[1]);
            allClassesArr = [...allClassesArr, ...objArr];

            if (cookie.read().length === propertyIdx || (objCounter === Object.keys(Shopify.recentlyViewed).length && !addClassesArr.length)) {
              addClassesArr = [...addClassesArr, ...objArr];
            }
          }

          for (let i = 0; i < wrapper.children.length; i++) {
            const element = wrapper.children[i];
            if (allClassesArr.length) {
              element.classList.remove(...allClassesArr);
            }

            if (addClassesArr.length) {
              element.classList.add(...addClassesArr);
            }
          }
        }

        // If we have a callback.
        if (config.onComplete) {
          try {
            config.onComplete(wrapper, section);
          } catch (error) {
            console.log(error);
          }
        }
      };

      const moveAlong = (shown, productHandleQueue, wrapper, section) => {
        if (productHandleQueue.length && shown < config.howManyToShow) {
          fetch(`${window.theme.routes.root}products/${productHandleQueue[0]}?section_id=api-product-grid-item`)
            .then((response) => response.text())
            .then((product) => {
              const aosDelay = shown * 150;
              const aosAnchor = wrapper.id ? `#${wrapper.id}` : '';
              const fresh = document.createElement('div');
              let productReplaced = product;

              // Unpublished products that are draft or archived can still be displayed in Theme editor
              // Preventing them from showing cleans all JS errors that are present because of the missing products and JSON data
              if (productReplaced.includes('data-unpublished')) {
                cookie.remove(productHandleQueue[0]);
                productHandleQueue.shift();
                moveAlong(shown, productHandleQueue, wrapper, section);
                return;
              }

              productReplaced = productReplaced.includes('||itemAosDelay||') ? productReplaced.replaceAll('||itemAosDelay||', aosDelay) : productReplaced;
              productReplaced = productReplaced.includes('||itemAosAnchor||') ? productReplaced.replaceAll('||itemAosAnchor||', aosAnchor) : productReplaced;
              fresh.innerHTML = productReplaced;

              const newContent = fresh.querySelector('[data-api-content]');
              if (newContent) {
                // Move all child nodes to preserve DOM structure
                while (newContent.firstChild) {
                  wrapper.appendChild(newContent.firstChild);
                }
              }

              productHandleQueue.shift();
              shown++;
              moveAlong(shown, productHandleQueue, wrapper, section);
            })
            .catch(() => {
              cookie.remove(productHandleQueue[0]);
              productHandleQueue.shift();
              moveAlong(shown, productHandleQueue, wrapper, section);
            });
        } else {
          finalize(wrapper, section);
        }
      };

      return {
        showRecentlyViewed: function (params) {
          const paramsNew = params || {};
          const shown = 0;

          // Update defaults.
          Object.assign(config, paramsNew);

          // Read cookie.
          productHandleQueue = cookie.read();

          // Element where to insert.
          wrapper = document.getElementById(config.wrapperId);

          // How many products to show.
          howManyToShowItems = config.howManyToShow;
          config.howManyToShow = Math.min(productHandleQueue.length, config.howManyToShow);

          // If we have any to show.
          if (config.howManyToShow && wrapper) {
            // Getting each product with an Ajax call and rendering it on the page.
            moveAlong(shown, productHandleQueue, wrapper, config.section);
          }
        },

        getConfig: function () {
          return config;
        },

        clearList: function () {
          cookie.destroy();
        },

        recordRecentlyViewed: function (params) {
          const paramsNew = params || {};

          // Update defaults.
          Object.assign(config, paramsNew);

          // Read cookie.
          let recentlyViewed = cookie.read();

          // If we are on a product page.
          if (window.location.pathname.indexOf('/products/') !== -1) {
            // What is the product handle on this page.
            let productHandle = decodeURIComponent(window.location.pathname)
              .match(
                /\/products\/([a-z0-9\-]|[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|[\u203B]|[\w\u0430-\u044f]|[\u0400-\u04FF]|[\u0900-\u097F]|[\u0590-\u05FF\u200f\u200e]|[\u0621-\u064A\u0660-\u0669 ])+/
              )[0]
              .split('/products/')[1];

            if (config.handle) {
              productHandle = config.handle;
            }

            // In what position is that product in memory.
            const position = recentlyViewed.indexOf(productHandle);

            // If not in memory.
            if (position === -1) {
              // Add product at the start of the list.
              recentlyViewed.unshift(productHandle);
              // Only keep what we need.
              recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
            } else {
              // Remove the product and place it at start of list.
              recentlyViewed.splice(position, 1);
              recentlyViewed.unshift(productHandle);
            }

            // Update cookie.
            cookie.write(recentlyViewed);
          }
        },

        hasProducts: cookie.read().length > 0,
      };
    })();

    const selectors$b = {
      actions: '[data-actions]',
      button: '[data-button]',
      content: '[data-content]',
      collapsibleContainer: '[data-collapsible-container]',
    };

    const attributes$7 = {
      height: 'data-height',
      ariaExpanded: 'aria-expanded',
    };

    const classes$9 = {
      open: 'is-open',
      enabled: 'is-enabled',
    };

    class ToggleEllipsis extends HTMLElement {
      constructor() {
        super();

        this.initialHeight = this.getAttribute(attributes$7.height);
        this.content = this.querySelector(selectors$b.content);
        this.actions = this.querySelector(selectors$b.actions);
        this.button = this.querySelector(selectors$b.button);
        this.toggle = this.toggle.bind(this);
        this.toggleActions = this.toggleActions.bind(this);
      }

      connectedCallback() {
        this.button.addEventListener('click', this.toggle);

        if (this.content.offsetHeight < this.initialHeight) {
          this.setHeight(this.content.offsetHeight);
        } else {
          this.setHeight(this.initialHeight);
        }

        this.toggleActions();

        document.addEventListener('theme:resize', this.toggleActionsEvent.bind(this));
      }

      toggle() {
        const isExpanded = !this.classList.contains(classes$9.open);
        const expandedHeight = this.content.offsetHeight + this.actions.offsetHeight * 2;

        this.setHeight(isExpanded ? expandedHeight : this.initialHeight);
        this.classList.toggle(classes$9.open, isExpanded);

        this.updateTabIndex();

        this.dispatchEvent(
          new CustomEvent('theme:ellipsis:toggle', {
            bubbles: true,
            detail: {
              isExpanded,
              dropdownHeight: expandedHeight,
            },
          })
        );
      }

      disconnectedCallback() {
        document.removeEventListener('theme:resize', this.toggleActions);
      }

      setHeight(contentHeight) {
        this.style.setProperty('--height', `${contentHeight}px`);
      }

      toggleActions() {
        this.classList.toggle(classes$9.enabled, this.content.offsetHeight + this.actions.offsetHeight > this.initialHeight);
        this.updateTabIndex();
      }

      toggleActionsEvent() {
        const isCollapsibleExpanded = this.closest(selectors$b.collapsibleContainer).getAttribute(attributes$7.ariaExpanded) === 'true';

        if (isCollapsibleExpanded) {
          this.toggleActions();
        }
      }

      updateTabIndex() {
        const links = this.content.querySelectorAll('a');
        const toggleActionsHeight = this.actions.offsetHeight;

        if (this.observer) {
          this.observer.disconnect();
        }

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.setAttribute('tabindex', '0');
              } else {
                entry.target.setAttribute('tabindex', '-1');
              }
            });
          },
          {
            root: this,
            threshold: 1,
            rootMargin: `0px 0px -${toggleActionsHeight}px 0px`, // Exclude height of the read more/less button as it's not part of the content
          }
        );

        links.forEach((link) => {
          this.observer.observe(link);
        });
      }
    }

    if (!customElements.get('toggle-ellipsis')) {
      customElements.define('toggle-ellipsis', ToggleEllipsis);
    }

    const selectors$a = {
      form: 'form',
      selectorWrapper: '[data-selector-wrapper]',
      popoutList: '[data-popout-list]',
      popoutToggle: '[data-popout-toggle]',
      popoutInput: '[data-popout-input]',
      popoutOptions: '[data-popout-option]',
      popoutText: '[data-popout-text]',
      ariaCurrent: '[aria-current]',
      productGridImage: '[data-product-image]',
      productGrid: '[data-product-grid-item]',
      quickViewItem: '[data-quick-view-item]',
      quickViewFooter: '[data-quick-view-foot]',
      cartItem: '[data-cart-item]',
      popoutQuantity: '[data-quantity-field]',
      cartDrawer: '[data-cart-drawer]',
      cartDrawerMessage: '[data-cart-message]',
      cartDrawerErrors: '[data-cart-errors]',
      cartDrawerBody: '[data-cart-drawer-body]',
      cartDrawerItems: '[data-items-holder]',
    };

    const classes$8 = {
      selectorOpen: 'selector-wrapper--open',
      popoutListTop: 'select-popout__list--top',
      listVisible: 'select-popout__list--visible',
      active: 'is-active',
      currentSuffix: '--current',
      visible: 'is-visible',
      cartItemOpen: 'cart__item--open',
    };

    const attributes$6 = {
      ariaCurrent: 'aria-current',
      ariaExpanded: 'aria-expanded',
      dataValue: 'data-value',
      popoutPrevent: 'data-popout-prevent',
      popoutQuantity: 'data-quantity-field',
      quickViewInner: 'data-quick-view-inner',
      quickViewFocus: 'data-quick-view-focus',
      popoutInitialized: 'data-popout-initialized',
      quantityHolder: 'data-quantity-holder',
    };

    if (!customElements.get('popout-select')) {
      customElements.define(
        'popout-select',
        class Popout extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            this.popout = this;
            this.selectorWrapper = this.popout.closest(selectors$a.selectorWrapper);
            this.popoutList = this.popout.querySelector(selectors$a.popoutList);
            this.popoutToggle = this.popout.querySelector(selectors$a.popoutToggle);
            this.popoutText = this.popout.querySelector(selectors$a.popoutText);
            this.popoutInput = this.popout.querySelector(selectors$a.popoutInput);
            this.popoutOptions = this.popout.querySelectorAll(selectors$a.popoutOptions);
            this.popoutPrevent = this.popout.getAttribute(attributes$6.popoutPrevent) === 'true';
            this.cartItem = this.popoutList.closest(selectors$a.cartItem);
            this.popupToggleFocusoutEvent = (evt) => this.popupToggleFocusout(evt);
            this.popupListFocusoutEvent = (evt) => this.popupListFocusout(evt);
            this.popupToggleClickEvent = (evt) => this.popupToggleClick(evt);
            this.popoutKeyupEvent = (evt) => this.popoutKeyup(evt);
            this.popupOptionsClickEvent = (evt) => this.popupOptionsClick(evt);
            this._connectOptionsDispatchEvent = (evt) => this._connectOptionsDispatch(evt);
            this.bodyClick = this.bodyClick.bind(this);
            this.popoutTop = false;

            this._connectOptions();
            this._connectToggle();
            this._onFocusOut();
            this.popupListSetDimensions();
            this.toggleListPosition();
          }

          popupToggleClick(evt) {
            const ariaExpanded = evt.currentTarget.getAttribute(attributes$6.ariaExpanded) === 'true';

            if (this.popoutList.closest(selectors$a.productGrid)) {
              const productGridItemImage = this.popoutList.closest(selectors$a.productGrid).querySelector(selectors$a.productGridImage);

              if (productGridItemImage) {
                productGridItemImage.classList.toggle(classes$8.visible, !ariaExpanded);
              }
            }

            if (this.cartItem) {
              this.cartItem.classList.toggle(classes$8.cartItemOpen);
            }

            evt.currentTarget.setAttribute(attributes$6.ariaExpanded, !ariaExpanded);
            this.popoutList.classList.toggle(classes$8.listVisible);
            this.toggleListPosition();
            this.popupListSetDimensions();
          }

          popupToggleFocusout(evt) {
            const ariaExpanded = this.popoutToggle.getAttribute(attributes$6.ariaExpanded) === 'true';

            if (!evt.relatedTarget) {
              return;
            }

            const popoutLostFocus = this.popout.contains(evt.relatedTarget);
            const popoutFromQuickView = evt.relatedTarget.hasAttribute(attributes$6.quickViewInner) || evt.relatedTarget.hasAttribute(attributes$6.quickViewFocus);

            if (!popoutLostFocus && !popoutFromQuickView && ariaExpanded) {
              this._hideList();
            }
          }

          popupListFocusout(evt) {
            const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
            const isVisible = this.popoutList.classList.contains(classes$8.listVisible);

            if (isVisible && !childInFocus) {
              this._hideList();
            }
          }

          calc(get = 'shouldBeOnTop') {
            const {headerHeight, stickyHeaderHeight, announcementBarHeight} = window.theme.readHeights();
            const quickViewItem = this.popout.closest(selectors$a.quickViewItem);
            const cartDrawer = this.popout.closest(selectors$a.cartDrawer);
            let popoutTop = Math.floor(this.popout.getBoundingClientRect().top);

            // Header and Announcement bar adjustments
            let headerH = headerHeight || 0;
            let announcementBarH = 0;
            if (announcementBarHeight !== 0 && window.scrollY < announcementBarHeight) announcementBarH = announcementBarHeight;
            if (window.scrollY > announcementBarH + headerHeight) headerH = stickyHeaderHeight;

            // Available height and initial adjustments
            let availableHeight = window.innerHeight;
            let adjustments = headerH + announcementBarH;

            // Quick view drawer calculations adjustments
            if (quickViewItem) {
              const quickViewFooter = quickViewItem.querySelector(selectors$a.quickViewFooter);
              const quickViewFooterH = quickViewFooter?.offsetHeight || 0;
              const quickViewOffsetTop = Math.floor(quickViewItem.getBoundingClientRect().top);
              popoutTop -= quickViewOffsetTop;
              availableHeight -= quickViewFooterH;
              adjustments = quickViewOffsetTop;

              if (window.theme.isMobile()) {
                availableHeight = quickViewItem.offsetHeight - quickViewFooterH;
              }
            }

            if (cartDrawer) {
              const cartDrawerMessage = cartDrawer.querySelector(selectors$a.cartDrawerMessage);
              const cartDrawerErrors = cartDrawer.querySelector(selectors$a.cartDrawerErrors);
              const cartDrawerBody = cartDrawer.querySelector(selectors$a.cartDrawerBody);
              const cartDrawerItems = cartDrawer.querySelector(selectors$a.cartDrawerItems);
              const cartDrawerMessageH = cartDrawerMessage?.offsetHeight || 0;
              const cartDrawerErrorsH = cartDrawerErrors?.offsetHeight || 0;
              const cartDrawerBodyH = cartDrawerBody?.scrollHeight || 0;
              const cartDrawerItemsOffsetTop = Math.floor(cartDrawerItems?.getBoundingClientRect().top);
              popoutTop -= cartDrawerItemsOffsetTop;
              availableHeight = cartDrawerBodyH - cartDrawerMessageH - cartDrawerErrorsH;
              adjustments = 0;
            }

            // Available height total
            let availableHeightTotal = availableHeight - adjustments;
            if (quickViewItem && window.theme.isMobile()) {
              availableHeightTotal = availableHeight;
            }

            // Getters:
            // 'shouldBeOnTop': check whether the space above the select toggle is more than what's below it
            if (get === 'shouldBeOnTop') {
              return availableHeightTotal / 2 < popoutTop;
            }

            // 'availableHeightAbove': calculate the available space above the select toggle
            if (get === 'availableHeightAbove') {
              const buttonOffsetTop = Math.floor(this.popoutToggle.getBoundingClientRect().top - 1);
              adjustments += 10; // (2 * 5px) to make up for the offset above the select toggle and below the top part of the available space
              return `${parseInt(buttonOffsetTop - adjustments)}px`;
            }

            // 'availableHeightBelow': calculate the available space below the select toggle
            if (get === 'availableHeightBelow') {
              const listOffsetTop = Math.floor(this.popoutList.getBoundingClientRect().top - 1);
              adjustments = 10; // (2 * 5px) to make up for the offset above the options list and below the bottom part of the available space
              return `${parseInt(availableHeight - listOffsetTop - adjustments)}px`;
            }
          }

          toggleListPosition() {
            const ariaExpanded = this.popoutToggle.getAttribute(attributes$6.ariaExpanded) === 'true';
            const shouldBeOnTop = this.calc('shouldBeOnTop');

            if (ariaExpanded) {
              this.selectorWrapper?.classList.add(classes$8.selectorOpen);
            }

            if (shouldBeOnTop) {
              this.popoutList.classList.add(classes$8.popoutListTop);
              this.popoutTop = true;
            } else {
              this.popoutList.classList.remove(classes$8.popoutListTop);
              this.popoutTop = false;
            }
          }

          popupListSetDimensions() {
            this.popoutList.style.setProperty('--max-height', '100vh');

            requestAnimationFrame(() => {
              if (this.popoutTop) {
                this.popoutList.style.setProperty('--max-height', this.calc('availableHeightAbove'));
              } else {
                this.popoutList.style.setProperty('--max-height', this.calc('availableHeightBelow'));
              }
            });
          }

          popupOptionsClick(evt) {
            const link = evt.target.closest(selectors$a.popoutOptions);
            if (link.attributes.href.value === '#') {
              evt.preventDefault();

              let attrValue = '';

              if (evt.currentTarget.getAttribute(attributes$6.dataValue)) {
                attrValue = evt.currentTarget.getAttribute(attributes$6.dataValue);
              }

              if (!this.popoutInput && this.popout.nextSibling.hasAttribute(attributes$6.quantityHolder)) {
                this.popoutInput = this.popout.nextSibling.querySelector(selectors$a.popoutQuantity);
              }

              this.popoutInput.value = attrValue;

              if (this.popoutPrevent) {
                this.popoutInput.dispatchEvent(new Event('change'));

                if (this.cartItem) {
                  this.popoutInput.dispatchEvent(new Event('input'));
                }

                // Switch from a "1..10" quantity dropdown to an input with "+/-" buttons
                this.switchQuantityInputBehavior(evt.detail.preventTrigger);

                const currentElement = this.popoutList.querySelector(`[class*="${classes$8.currentSuffix}"]`);
                let targetClass = classes$8.currentSuffix;

                if (currentElement && currentElement.classList.length) {
                  for (const currentElementClass of currentElement.classList) {
                    if (currentElementClass.includes(classes$8.currentSuffix)) {
                      targetClass = currentElementClass;
                      break;
                    }
                  }
                }

                const listTargetElement = this.popoutList.querySelector(`.${targetClass}`);

                if (listTargetElement) {
                  listTargetElement.classList.remove(`${targetClass}`);
                  evt.currentTarget.parentElement.classList.add(`${targetClass}`);
                }

                const targetAttribute = this.popoutList.querySelector(selectors$a.ariaCurrent);

                if (targetAttribute) {
                  targetAttribute.removeAttribute(attributes$6.ariaCurrent);
                  evt.currentTarget.setAttribute(attributes$6.ariaCurrent, 'true');
                }

                if (attrValue !== '') {
                  this.popoutText.textContent = attrValue;
                }

                // Uncomment when the "cards" is selected as the subscription layout
                // this.toggleVariantSubscriptionPlans();

                this.popupToggleFocusout(evt);
                this.popupListFocusout(evt);
              } else {
                this._submitForm(attrValue);
              }
            }
          }

          // Function to toggle visibility of variant-specific subscription plans
          toggleVariantSubscriptionPlans() {
            // ⭐ 0. Snapshot before changes
            const previouslyActiveCard = document.querySelector('.program-card--active');

            // Groups that were hidden BEFORE we change anything
            const hiddenGroupsBefore = new Set();
            document.querySelectorAll('.program-card.hidden').forEach((card) => {
              const gid = card.getAttribute('data-selling-plan-group-id');
              if (gid) hiddenGroupsBefore.add(gid);
            });

            // 1️⃣ Get current variant ID from the main product form
            const variantInput = document.querySelector('form.product__form [name="id"][data-product-select]');
            if (!variantInput) return;

            const currentVariantId = variantInput.value;

            // ⭐ Always update One-Time card price for current variant
            const oneTimeCard = document.querySelector('.program-card--one-time');
            if (oneTimeCard) {
              updateProgramCardPrice(oneTimeCard, currentVariantId, '');
            }

            // 2️⃣ Get selling plans for this variant from global map (Liquid exported)
            const variantPlanMap = window.variantSellingPlans || {};
            const planIdsForVariant = variantPlanMap[currentVariantId] || [];
            const currentPlanIds = new Set(planIdsForVariant);

            // 3️⃣ Show/hide subscription cards
            const variantCards = document.querySelectorAll('.program-card:not(.program-card--one-time)');

            let introCard = null;
            let introCardHasPlan = false;

            variantCards.forEach((card) => {
              const isIntroCard = card.classList.contains('program-card--intro');
              const planRadios = card.querySelectorAll('.product__subs__plans input[name="selling_plan"]');
              let hasPlanForVariant = false;

              planRadios.forEach((radio) => {
                if (currentPlanIds.has(radio.value)) {
                  hasPlanForVariant = true;
                }
              });

              if (hasPlanForVariant || isIntroCard) {
                // Intro card is ALWAYS visible, even if no allocation
                card.classList.remove('hidden');
              } else {
                card.classList.add('hidden');
              }

              if (isIntroCard) {
                introCard = card;
                introCardHasPlan = hasPlanForVariant;
              }
            });

            // 🔁 Update prices for ALL visible subscription cards
            document
              .querySelectorAll('.program-card:not(.program-card--one-time):not(.hidden)')
              .forEach((card) => {
                const planRadio =
                  card.querySelector('.product__subs__plans input[name="selling_plan"]:checked') ||
                  card.querySelector('.product__subs__plans input[name="selling_plan"]');

                if (!planRadio) return;

                const planId = planRadio.value;
                if (!planId) return;

                updateProgramCardPrice(card, currentVariantId, planId);
              });

            // =========================
            // 4️⃣ Decide FINAL active card
            // =========================

            let finalActiveCard = previouslyActiveCard;

            // 🔸 If user explicitly clicked 12-week just before variant change, respect that
            if (window.forceIntroCardNext && introCard && introCardHasPlan) {
              finalActiveCard = introCard;
              window.forceIntroCardNext = false;
            } else if (window.forceIntroCardNext) {
              // Clear flag even if we couldn't use intro (no plan)
              window.forceIntroCardNext = false;
            }

            // If previous active is intro card but it's NOT compatible with this variant -> reset
            if (
              finalActiveCard &&
              finalActiveCard.classList.contains('program-card--intro') &&
              !introCardHasPlan
            ) {
              finalActiveCard = null;
            }

            // If previous active card is gone/hidden, choose a new one
            if (!finalActiveCard || finalActiveCard.classList.contains('hidden')) {
              let newlyVisibleCards = Array.from(
                document.querySelectorAll('.program-card:not(.program-card--one-time):not(.hidden)')
              ).filter((card) => {
                const gid = card.getAttribute('data-selling-plan-group-id');
                return gid && hiddenGroupsBefore.has(gid);
              });

              if (newlyVisibleCards.length > 0) {
                finalActiveCard = newlyVisibleCards[0];
              } else {
                finalActiveCard =
                  document.querySelector('.program-card:not(.program-card--one-time):not(.hidden)') ||
                  document.querySelector('.program-card--one-time');
              }
            }

            if (!finalActiveCard) return;

            // =========================
            // 5️⃣ Apply active state + radios
            // =========================

            document.querySelectorAll('.program-card').forEach((c) => {
              c.classList.remove('program-card--active');
            });

            finalActiveCard.classList.add('program-card--active');

            if (window.updateProgramCardButtons) {
              window.updateProgramCardButtons();
            }

            const groupRadio = finalActiveCard.querySelector('.program-card__radio');
            if (groupRadio) {
              groupRadio.checked = true;
              groupRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            let planRadio =
              finalActiveCard.querySelector('.product__subs__plans input[name="selling_plan"]:checked') ||
              finalActiveCard.querySelector('.product__subs__plans input[name="selling_plan"]');

            if (planRadio && !finalActiveCard.classList.contains('program-card--one-time')) {
              planRadio.checked = true;
              planRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // =========================
            // 6️⃣ SYNC STICKY SUBSCRIPTION (if present)
            // =========================

            const stickyPlanInput = document.querySelector('[data-sticky-selling-plan]');
            const stickySelects = document.querySelectorAll('.custom-sticky-select');

            if (!stickyPlanInput && (!stickySelects || stickySelects.length === 0)) {
              return;
            }

            let planIdForSticky = '';

            if (finalActiveCard.classList.contains('program-card--one-time')) {
              planIdForSticky = '';
            } else if (planRadio) {
              planIdForSticky = planRadio.value;
            }

            if (stickyPlanInput) {
              stickyPlanInput.value = planIdForSticky;
            }

            if (stickySelects && stickySelects.length > 0) {
              stickySelects.forEach((sel) => {
                const vid = sel.getAttribute('data-variant-id');

                if (vid === currentVariantId) {
                  sel.classList.remove('hidden');

                  let matched = false;

                  Array.from(sel.options).forEach((opt) => {
                    const optPlanId = opt.getAttribute('data-selling-plan-id') || '';
                    if (String(optPlanId) === String(planIdForSticky)) {
                      opt.selected = true;
                      matched = true;
                    }
                  });

                  if (!matched) {
                    Array.from(sel.options).forEach((opt) => {
                      const optPlanId = opt.getAttribute('data-selling-plan-id');
                      if (!optPlanId && !matched) {
                        opt.selected = true;
                        matched = true;
                      }
                    });
                  }
                } else {
                  sel.classList.add('hidden');
                }
              });
            }

            if (window.updateProgramCardButtons) {
              window.updateProgramCardButtons();
            }
          }

          switchQuantityInputBehavior(prevent = true) {
            if (prevent || !this.popoutInput.hasAttribute(attributes$6.popoutQuantity)) return;

            const targetElement = this.popoutList.querySelector(`[${attributes$6.dataValue}="${this.popoutInput.value}"]`);
            if (!targetElement) return;
            if (targetElement.parentElement.nextSibling) return;

            this.popout.classList.add(classes$8.active);
            this.selectorWrapper?.classList.remove(classes$8.selectorOpen);
          }

          popoutKeyup(event) {
            if (event.code !== theme.keyboardKeys.ESCAPE) {
              return;
            }
            this._hideList();
            this.popoutToggle.focus();
          }

          bodyClick(event) {
            const isOption = this.popout.contains(event.target);
            const isVisible = this.popoutList.classList.contains(classes$8.listVisible);

            if (isVisible && !isOption) {
              this._hideList();
            }
          }

          _connectToggle() {
            this.popout.setAttribute(attributes$6.popoutInitialized, '');
            this.popoutToggle.addEventListener('click', this.popupToggleClickEvent);
          }

          _connectOptions() {
            if (this.popoutOptions.length) {
              this.popoutOptions.forEach((element) => {
                element.addEventListener('theme:popout:click', this.popupOptionsClickEvent);
                element.addEventListener('click', this._connectOptionsDispatchEvent);
              });
            }
          }

          _connectOptionsDispatch(evt) {
            const event = new CustomEvent('theme:popout:click', {
              cancelable: true,
              bubbles: true,
              detail: {
                preventTrigger: false,
              },
            });

            if (!evt.target.dispatchEvent(event)) {
              evt.preventDefault();
            }
          }

          _onFocusOut() {
            this.popoutToggle.addEventListener('focusout', this.popupToggleFocusoutEvent);
            this.popoutList.addEventListener('focusout', this.popupListFocusoutEvent);
            this.popout.addEventListener('keyup', this.popoutKeyupEvent);

            document.body.addEventListener('click', this.bodyClick);
          }

          _submitForm() {
            const form = this.popout.closest(selectors$a.form);
            if (form) {
              form.submit();
            }
          }

          _hideList() {
            this.popoutList.classList.remove(classes$8.listVisible);
            this.popoutToggle.setAttribute(attributes$6.ariaExpanded, false);
            this.toggleListPosition();

            if (this.cartItem) {
              this.cartItem.classList.remove(classes$8.cartItemOpen);
            }
          }

          disconnectedCallback() {
            if (this.popoutOptions.length) {
              this.popoutOptions.forEach((element) => {
                element.removeEventListener('theme:popout:click', this.popupOptionsClickEvent);
                element.removeEventListener('click', this._connectOptionsDispatchEvent);
              });
            }

            this.popoutToggle.removeEventListener('click', this.popupToggleClickEvent);
            this.popoutToggle.removeEventListener('focusout', this.popupToggleFocusoutEvent);
            this.popoutList.removeEventListener('focusout', this.popupListFocusoutEvent);
            this.popout.removeEventListener('keyup', this.popoutKeyupEvent);
            document.body.removeEventListener('click', this.bodyClick);
          }
        }
      );
    }

    function Listeners() {
      this.entries = [];
    }

    Listeners.prototype.add = function (element, event, fn) {
      this.entries.push({element: element, event: event, fn: fn});
      element.addEventListener(event, fn);
    };

    Listeners.prototype.removeAll = function () {
      this.entries = this.entries.filter(function (listener) {
        listener.element.removeEventListener(listener.event, listener.fn);
        return false;
      });
    };

    /**
     * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
     * @param {Object} product Product JSON object
     * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
     * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
     */
    function getVariantFromSerializedArray(product, collection) {
      _validateProductStructure(product);

      // If value is an array of options
      var optionArray = _createOptionArrayFromOptionCollection(product, collection);
      return getVariantFromOptionArray(product, optionArray);
    }

    /**
     * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
     * @param {Object} product Product JSON object
     * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
     * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
     */
    function getVariantFromOptionArray(product, options) {
      _validateProductStructure(product);
      _validateOptionsArray(options);

      var result = product.variants.filter(function (variant) {
        return options.every(function (option, index) {
          return variant.options[index] === option;
        });
      });

      return result[0] || null;
    }

    /**
     * Creates an array of selected options from the object
     * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
     * @param {Object} product Product JSON object
     * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
     * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
     */
    function _createOptionArrayFromOptionCollection(product, collection) {
      _validateProductStructure(product);
      _validateSerializedArray(collection);

      var optionArray = [];

      collection.forEach(function (option) {
        for (var i = 0; i < product.options.length; i++) {
          var name = product.options[i].name || product.options[i];
          if (name.toLowerCase() === option.name.toLowerCase()) {
            optionArray[i] = option.value;
            break;
          }
        }
      });

      return optionArray;
    }

    /**
     * Check if the product data is a valid JS object
     * Error will be thrown if type is invalid
     * @param {object} product Product JSON object
     */
    function _validateProductStructure(product) {
      if (typeof product !== 'object') {
        throw new TypeError(product + ' is not an object.');
      }

      if (Object.keys(product).length === 0 && product.constructor === Object) {
        throw new Error(product + ' is empty.');
      }
    }

    /**
     * Validate the structure of the array
     * It must be formatted like jQuery's serializeArray()
     * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
     */
    function _validateSerializedArray(collection) {
      if (!Array.isArray(collection)) {
        throw new TypeError(collection + ' is not an array.');
      }

      if (collection.length === 0) {
        throw new Error(collection + ' is empty.');
      }

      if (collection[0].hasOwnProperty('name')) {
        if (typeof collection[0].name !== 'string') {
          throw new TypeError('Invalid value type passed for name of option ' + collection[0].name + '. Value should be string.');
        }
      } else {
        throw new Error(collection[0] + 'does not contain name key.');
      }
    }

    /**
     * Validate the structure of the array
     * It must be formatted as list of values
     * @param {Array} collection Array of object (e.g. ['36', 'Black'])
     */
    function _validateOptionsArray(options) {
      if (Array.isArray(options) && typeof options[0] === 'object') {
        throw new Error(options + 'is not a valid array of options.');
      }
    }

    var selectors$9 = {
      idInput: '[name="id"]',
      planInput: '[name="selling_plan"]',
      optionInput: '[name^="options"]',
      quantityInput: '[name="quantity"]',
      propertyInput: '[name^="properties"]',
    };

    // Public Methods
    // -----------------------------------------------------------------------------

    /**
     * Returns a URL with a variant ID query parameter. Useful for updating window.history
     * with a new URL based on the currently select product variant.
     * @param {string} url - The URL you wish to append the variant ID to
     * @param {number} id  - The variant ID you wish to append to the URL
     * @returns {string} - The new url which includes the variant ID query parameter
     */

    function getUrlWithVariant(url, id) {
      if (/variant=/.test(url)) {
        return url.replace(/(variant=)[^&]+/, '$1' + id);
      } else if (/\?/.test(url)) {
        return url.concat('&variant=').concat(id);
      }

      return url.concat('?variant=').concat(id);
    }

    /**
     * Constructor class that creates a new instance of a product form controller.
     *
     * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
     * @param {Object} product - A product object
     * @param {Object} options - Optional options object
     * @param {Function} options.onOptionChange - Callback for whenever an option input changes
     * @param {Function} options.onPlanChange - Callback for changes to name=selling_plan
     * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
     * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
     * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
     */
    // Flag to prevent infinite loop of event dispatching
    let isDispatchingVariantChange = false;
    class ProductFormReader {
      constructor(element, product, options) {
        this.element = element;
        this.form = this.element.tagName == 'FORM' ? this.element : this.element.querySelector('form');
        this.product = this._validateProductObject(product);
        this.variantElement = this.element.querySelector(selectors$9.idInput);

        options = options || {};

        this._listeners = new Listeners();
        this._listeners.add(this.element, 'submit', this._onSubmit.bind(this, options));

        this.optionInputs = this._initInputs(selectors$9.optionInput, options.onOptionChange);

        this.planInputs = this._initInputs(selectors$9.planInput, options.onPlanChange);

        this.quantityInputs = this._initInputs(selectors$9.quantityInput, options.onQuantityChange);

        this.propertyInputs = this._initInputs(selectors$9.propertyInput, options.onPropertyChange);
      }

      /**
       * Cleans up all event handlers that were assigned when the Product Form was constructed.
       * Useful for use when a section needs to be reloaded in the theme editor.
       */
      destroy() {
        this._listeners.removeAll();
      }

      /**
       * Getter method which returns the array of currently selected option values
       *
       * @returns {Array} An array of option values
       */
      options() {
        return this._serializeInputValues(this.optionInputs, function (item) {
          var regex = /(?:^(options\[))(.*?)(?:\])/;
          item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
          return item;
        });
      }

      /**
       * Getter method which returns the currently selected variant, or `null` if variant
       * doesn't exist.
       *
       * @returns {Object|null} Variant object
       */
      variant() {
        const opts = this.options();
        if (opts.length) {
          return getVariantFromSerializedArray(this.product, opts);
        } else {
          return this.product.variants[0];
        }
      }

      /**
       * Getter method which returns the current selling plan, or `null` if plan
       * doesn't exist.
       *
       * @returns {Object|null} Variant object
       */
      plan(variant) {
        let plan = {
          allocation: null,
          group: null,
          detail: null,
        };
        const formData = new FormData(this.form);
        const id = formData.get('selling_plan');

        if (id && variant) {
          plan.allocation = variant.selling_plan_allocations.find(function (item) {
            return item.selling_plan_id.toString() === id.toString();
          });
        }
        if (plan.allocation) {
          plan.group = this.product.selling_plan_groups.find(function (item) {
            return item.id.toString() === plan.allocation.selling_plan_group_id.toString();
          });
        }
        if (plan.group) {
          plan.detail = plan.group.selling_plans.find(function (item) {
            return item.id.toString() === id.toString();
          });
        }

        if (plan && plan.allocation && plan.detail && plan.allocation) {
          return plan;
        } else return null;
      }

      /**
       * Getter method which returns a collection of objects containing name and values
       * of property inputs
       *
       * @returns {Array} Collection of objects with name and value keys
       */
      properties() {
        return this._serializeInputValues(this.propertyInputs, function (item) {
          var regex = /(?:^(properties\[))(.*?)(?:\])/;
          item.name = regex.exec(item.name)[2]; // Use just the value between 'properties[' and ']'
          return item;
        });
      }

      /**
       * Getter method which returns the current quantity or 1 if no quantity input is
       * included in the form
       *
       * @returns {Array} Collection of objects with name and value keys
       */
      quantity() {
        return this.quantityInputs[0] ? Number.parseInt(this.quantityInputs[0].value, 10) : 1;
      }

      getFormState() {
        const variant = this.variant();
        return {
          options: this.options(),
          variant: variant,
          properties: this.properties(),
          quantity: this.quantity(),
          plan: this.plan(variant),
        };
      }

      // Private Methods
      // -----------------------------------------------------------------------------
      _setIdInputValue(variant) {
        if (variant && variant.id) {
          this.variantElement.value = variant.id.toString();
        } else {
          this.variantElement.value = '';
        }
        if (isDispatchingVariantChange) return;
        // Set flag to indicate we're dispatching an event 
        isDispatchingVariantChange = true;
        // Dispatch a custom event when the variant changes 
        const event = new CustomEvent('variantChanged', { detail: 
            { 
              variantId: variant.id, 
              variant: variant, 
            }, 
        });
        document.dispatchEvent(event);
        isDispatchingVariantChange = false;
        this.variantElement.dispatchEvent(new Event('change'));
      }

      _onSubmit(options, event) {
        event.dataset = this.getFormState();
        if (options.onFormSubmit) {
          options.onFormSubmit(event);
        }
      }

      _onOptionChange(event) {
        this._setIdInputValue(event.dataset.variant);
      }

      _onFormEvent(cb) {
        if (typeof cb === 'undefined') {
          return Function.prototype.bind();
        }

        return function (event) {
          event.dataset = this.getFormState();
          this._setIdInputValue(event.dataset.variant);
          cb(event);
        }.bind(this);
      }

      _initInputs(selector, cb) {
        var elements = Array.prototype.slice.call(this.element.querySelectorAll(selector));

        return elements.map(
          function (element) {
            this._listeners.add(element, 'change', this._onFormEvent(cb));
            return element;
          }.bind(this)
        );
      }

      _serializeInputValues(inputs, transform) {
        return inputs.reduce(function (options, input) {
          if (
            input.checked || // If input is a checked (means type radio or checkbox)
            (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
          ) {
            options.push(transform({name: input.name, value: input.value}));
          }

          return options;
        }, []);
      }

      _validateProductObject(product) {
        if (typeof product !== 'object') {
          throw new TypeError(product + ' is not an object.');
        }

        if (typeof product.variants[0].options === 'undefined') {
          throw new TypeError('Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route');
        }
        return product;
      }
    }

    /**
     * Variant Sellout Precrime Click Preview
     * I think of this like the precrime machine in Minority report.  It gives a preview
     * of every possible click action, given the current form state.  The logic is:
     *
     * for each clickable name=options[] variant selection element
     * find the value of the form if the element were clicked
     * lookup the variant with those value in the product json
     * clear the classes, add .unavailable if it's not found,
     * and add .sold-out if it is out of stock
     *
     * Caveat: we rely on the option position so we don't need
     * to keep a complex map of keys and values.
     */

    const selectors$8 = {
      form: '[data-product-form]',
      optionPosition: '[data-option-position]',
      optionInput: '[name^="options"], [data-popout-option]',
    };

    const classes$7 = {
      soldOut: 'sold-out',
      unavailable: 'unavailable',
    };

    const attributes$5 = {
      optionPosition: 'data-option-position',
      selectOptionValue: 'data-value',
    };

    class SelloutVariants {
      constructor(container, productJSON) {
        this.container = container;
        this.productJSON = productJSON;
        this.form = this.container.querySelector(selectors$8.form);
        this.formData = new FormData(this.form);
        this.optionElements = this.container.querySelectorAll(selectors$8.optionInput);

        if (this.productJSON && this.form) {
          this.init();
        }
      }

      init() {
        this.update();
      }

      update() {
        this.getCurrentState();

        this.optionElements.forEach((el) => {
          const val = el.value || el.getAttribute(attributes$5.selectOptionValue);
          const optionSelector = el.closest(selectors$8.optionPosition);

          if (!optionSelector) {
            return;
          }

          const positionString = optionSelector.getAttribute(attributes$5.optionPosition);
          // subtract one because option.position in liquid does not count form zero, but JS arrays do
          const position = parseInt(positionString, 10) - 1;

          let newVals = [...this.selections];
          newVals[position] = val;

          const found = this.productJSON.variants.find((element) => {
            // only return true if every option matches our hypothetical selection
            let perfectMatch = true;
            for (let index = 0; index < newVals.length; index++) {
              if (element.options[index] !== newVals[index]) {
                perfectMatch = false;
              }
            }
            return perfectMatch;
          });

          el.parentElement.classList.remove(classes$7.soldOut, classes$7.unavailable);
          if (typeof found === 'undefined') {
            el.parentElement.classList.add(classes$7.unavailable);
          } else if (found?.available === false) {
            el.parentElement.classList.add(classes$7.soldOut);
          }
        });
      }

      getCurrentState() {
        this.formData = new FormData(this.form);
        this.selections = [];
        for (var value of this.formData.entries()) {
          if (value[0].includes('options[')) {
            // push the current state of the form, dont worry about the group name
            // we will be using the array position instead of the name to match values
            this.selections.push(value[1]);
          }
        }
      }
    }

    if (!customElements.get('product-form')) {
      customElements.define(
        'product-form',

        class ProductForm extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            this.product = this.closest('product-component') || this.closest('[data-product]');
            this.productForm = this.querySelector('[data-product-form]');

            if (!this.product || !this.productForm) return;

            this.addToCartButton = this.querySelector('[data-add-to-cart]');
            this.buyItNow = this.querySelector('[data-buy-it-now]');
            this.hasPaymentButton = this.buyItNow !== null;
            this.variantOptionImages = this.querySelectorAll('[data-variant-option-image]');
            this.hasVariantOptionWithImage = this.variantOptionImages.length > 0;
            this.subSelectors = this.querySelector('[data-subscription-selectors]');
            this.subPrices = this.querySelector('[data-subscription-watch-price]');
            this.planDecription = this.querySelector('[data-plan-description]');
            this.swatchesContainers = this.querySelectorAll('[data-swatches-container]');

            this.container = this.closest('[data-section-type]') || this.closest('[data-quick-view-item-holder]') || this.closest('[data-quick-view-inner]');
            if (!this.container) return;

            this.tallLayout = this.product.getAttribute('data-tall-layout') === 'true';
            this.storeAvailabilityContainer = this.container.querySelector('[data-store-availability-container]');
            this.enableHistoryState = this.container.getAttribute('data-enable-history-state') === 'true';
            this.hasUnitPricing = this.container.querySelector('[data-product-unit]');
            this.priceOffWrap = this.container.querySelector('[data-price-off]');
            this.priceOffAmount = this.container.querySelector('[data-price-off-amount]');
            this.sellout = null;

            this.sessionStorage = window.sessionStorage;

            this.remainingWrapper = this.container.querySelector('[data-remaining-wrapper]');

            if (this.remainingWrapper) {
              this.remainingMaxInt = parseInt(this.remainingWrapper.dataset.remainingMax, 10);
              this.remainingCount = this.container.querySelector('[data-remaining-count]');
              this.remainingJSONWrapper = this.container.querySelector('[data-product-remaining-json]');
              this.remainingJSON = null;

              if (this.remainingJSONWrapper && this.remainingJSONWrapper.innerHTML !== '') {
                this.remainingJSON = JSON.parse(this.remainingJSONWrapper.innerHTML);
              }
            }

            this.init();

            if (this.hasVariantOptionWithImage) {
              this.onResizeCallback = () => this.resizeEvents();
              window.addEventListener('theme:resize:width', this.onResizeCallback);
            }

            if (this.hasPaymentButton) {
              this.mutationObserver = null;
              this.observeContainer();
            }

            // Prepare bound resize handler for swatches
            this.boundHandleSwatchResize = this.handleSwatchResize.bind(this);
          }

          init() {
            let productJSON = null;
            const productElemJSON = this.container.querySelector('[data-product-json]');

            if (productElemJSON) {
              productJSON = productElemJSON.innerHTML;
            }
            if (productJSON) {
              this.productJSON = JSON.parse(productJSON);
              this.linkForm();
              this.sellout = new SelloutVariants(this.container, this.productJSON);
            } else {
              console.error('Missing product JSON');
            }

            if (this.hasVariantOptionWithImage) {
              this.variantButtonsContainer = this.variantOptionImages[0].closest('[data-variant-buttons]');
              this.equalizeImageOptionContainers();
            }
          }

          resizeEvents() {
            if (this.hasVariantOptionWithImage) this.equalizeImageOptionContainers();
          }

          linkForm() {
            this.productForm = new ProductFormReader(this.productForm, this.productJSON, {
              onOptionChange: this.onOptionChange.bind(this),
              onPlanChange: this.onPlanChange.bind(this),
              onQuantityChange: this.onQuantityChange.bind(this),
            });
            const formState = this.productForm.getFormState();
            this.pushState(formState, true);
            this.subsToggleListeners();

            // Swatches show more functionality
            if (this.swatchesContainers.length > 0) {
              this.swatchesContainers.forEach((swatchesContainer) => {
                this.observeSwatch(formState, swatchesContainer);

                this.checkSwatchesHeight(swatchesContainer);

                const selectorWrapper = swatchesContainer.closest('[data-option-position]');
                const moreLink = selectorWrapper.querySelector('[data-swatches-more]');
                moreLink?.addEventListener('click', (event) => {
                  event.preventDefault();
                  if (selectorWrapper.classList.contains('selector-wrapper--visible')) {
                    selectorWrapper.classList.remove('selector-wrapper--visible');
                  } else {
                    selectorWrapper.classList.add('selector-wrapper--visible');
                  }
                });
              });

              // Add the single resize listener for swatches if needed
              document.addEventListener('theme:resize:width', this.boundHandleSwatchResize);
            }

            this.checkLiveCartInfoCallback = () => this.checkLiveCartInfo();
            document.addEventListener('theme:cart:close', this.checkLiveCartInfoCallback);
          }

          onOptionChange(evt) {
            this.pushState(evt.dataset);
            this.updateProductImage(evt);
          }

          onPlanChange(evt) {
            if (this.subPrices) {
              this.pushState(evt.dataset);
            }
          }

          onQuantityChange(evt) {
            this.pushState(evt.dataset);
          }

          pushState(formState, init = false) {
            this.productState = this.setProductState(formState);
            this.updateAddToCartState(formState);
            this.updateProductPrices(formState);
            this.updateSaleText(formState);
            this.updateSubscriptionText(formState);
            this.updateTitleAttr(formState);
            this.fireHookEvent(formState);
            this.updateRemaining(formState);
            this.checkLiveCartInfo(formState);
            this.sellout?.update(formState);

            if (this.enableHistoryState && !init) {
              this.updateHistoryState(formState);
            }
          }

          updateTitleAttr(formState) {
            const variant = formState.variant;
            if (!variant) return;
            let titleText = this.productForm.product.title;
            if (variant.public_title) {
              titleText += ` - ${variant.title}`;
            }
            this.productForm.element.setAttribute('data-variant-title', titleText);
          }

          updateAddToCartState(formState) {
            const variant = formState.variant;
            const priceWrapper = this.container.querySelectorAll('[data-price-wrapper]');
            const addToCart = this.container.querySelectorAll('[data-add-to-cart]');
            const addToCartText = this.container.querySelectorAll('[data-add-to-cart-text]');
            const formWrapper = this.container.querySelectorAll('[data-form-wrapper]');
            const buyItNow = this.container.querySelector('[data-buy-it-now]');
            let addText = theme.strings.add_to_cart;

            if (theme.settings.atcButtonShowPrice) {
              addText = `${addText}<span data-product-price class="product__price--regular"></span> <s data-compare-price class="product__price--compare"></s>`; // Show price on ATC button
            }

            if (this.productJSON.tags.includes('_preorder')) {
              addText = theme.strings.preorder;
            }

            // Price wrapper elements
            priceWrapper?.forEach((element) => {
              // Hide price if there is no variant
              if (element.hasAttribute('data-atc-button')) return; // Skip if the price is on the ATC button
              element.classList.toggle('product__price--hidden', !variant);
            });

            // ATC Button elements
            addToCart?.forEach((element) => {
              // Skip the upsell "add to cart" button
              if (element.matches('[data-upsell-btn]')) return;

              element.disabled = true;
              buyItNow?.classList.add('hidden');

              // No variant
              if (!variant) return;

              // Available variant
              element.disabled = false;
              if (variant.available) {
                buyItNow?.classList.remove('hidden');
              }

              // Notification popup
              if (!element.hasAttribute('data-notification-popup')) return;

              let variantId = variant.id;
              let notificationFormSubmitted = false;
              const notificationFormId = `NotificationForm--api-notification`;
              const formID = this.sessionStorage.getItem('notification_form_id');

              if (formID) {
                const sessionId = formID.substring(0, formID.lastIndexOf('--'));
                const sessionVariantId = formID.split('--').slice(-1)[0];
                notificationFormSubmitted = notificationFormId === sessionId;

                if (notificationFormSubmitted) {
                  variantId = Number(sessionVariantId);
                }
              }

              // Set the handle and variant ID for the notification popup
              element.setAttribute('data-handle', this.productJSON.handle);
              element.setAttribute('data-variant-id', variantId);

              if (notificationFormSubmitted) {
                this.scrollToForm(this.product.closest('.shopify-section'));
                new NotificationPopup(element);
              }
            });

            // ATC Buttons' text elements
            addToCartText?.forEach((element) => {
              // No variant
              if (!variant) {
                element.innerHTML = theme.strings.unavailable;
                return;
              }

              // Unavailable variant
              if (!variant.available) {
                element.innerHTML = theme.strings.sold_out;

                if (element.parentNode.hasAttribute('data-notification-popup')) {
                  if (element.closest('[data-quick-view-item]')) return; // Disable 'notify me' text change for Quickview

                  element.innerHTML = `${theme.strings.sold_out} - ${theme.strings.newsletter_product_availability}`;
                }

                return;
              }

              // Available variant
              element.innerHTML = addText;
            });

            // Form wrapper elements
            formWrapper?.forEach((element) => {
              // No variant
              if (!variant) {
                element.classList.add('variant--unavailabe');
                element.classList.remove('variant--soldout');
                return;
              }

              const formSelect = element.querySelector('[data-product-select]');
              if (formSelect) {
                formSelect.value = variant.id;
              }

              // Unavailable variant
              if (!variant.available) {
                element.classList.add('variant--soldout');
                element.classList.remove('variant--unavailabe');
                return;
              }

              // Available variant
              element.classList.remove('variant--soldout', 'variant--unavailabe');
            });
          }

          updateHistoryState(formState) {
            const variant = formState.variant;
            const plan = formState.plan;
            const location = window.location.href;
            if (variant && location.includes('/product')) {
              const url = new window.URL(location);
              const params = url.searchParams;
              params.set('variant', variant.id);
              if (plan && plan.detail && plan.detail.id && this.productState.hasPlan) {
                params.set('selling_plan', plan.detail.id);
              } else {
                params.delete('selling_plan');
              }
              url.search = params.toString();
              const urlString = url.toString();
              window.history.replaceState({path: urlString}, '', urlString);
            }
          }

          updateRemaining(formState) {
            const variant = formState.variant;
            const remainingClasses = ['count-is-in', 'count-is-out', 'count-is-unavailable', 'count-is-low'];

            if (variant && this.remainingWrapper && this.remainingJSON) {
              const remaining = this.remainingJSON[variant.id];

              if (remaining === 'out' || remaining < 1) {
                this.remainingWrapper.classList.remove(...remainingClasses);
                this.remainingWrapper.classList.add('count-is-out');
              }

              if (remaining === 'in' || remaining >= this.remainingMaxInt) {
                this.remainingWrapper.classList.remove(...remainingClasses);
                this.remainingWrapper.classList.add('count-is-in');
              }

              if (remaining === 'low' || (remaining > 0 && remaining < this.remainingMaxInt)) {
                this.remainingWrapper.classList.remove(...remainingClasses);
                this.remainingWrapper.classList.add('count-is-low');

                if (this.remainingCount) {
                  this.remainingCount.innerHTML = remaining;
                }
              }
            } else if (!variant && this.remainingWrapper) {
              this.remainingWrapper.classList.remove(...remainingClasses);
              this.remainingWrapper.classList.add('count-is-unavailable');
            }
          }

          checkLiveCartInfo(formState) {
            const state = formState ? formState : this.productForm.getFormState();
            const variant = state.variant;
            if (!variant) return;

            const productUrl = `${theme.routes.root}products/${this.productJSON.handle}?section_id=api-live-cart-info&variant=${variant.id}`;

            fetch(productUrl)
              .then((response) => response.text())
              .then((data) => {
                const markup = new DOMParser().parseFromString(data, 'text/html');
                const itemCountForVariant = Number(markup.querySelector('[data-item-count-for-variant]').innerHTML);
                const maxInventory = markup.querySelector('[data-max-inventory]').innerHTML;
                const maxInventoryCount = Number(maxInventory);
                const addingMoreThanAvailable = Boolean(this.productForm.quantity() + itemCountForVariant > maxInventoryCount);
                const maxInventoryReached = maxInventory !== '' ? addingMoreThanAvailable : false;
                const errorMessagePosition = maxInventory !== '' && itemCountForVariant === maxInventoryCount ? 'form' : 'cart';

                this.productForm.element.setAttribute('data-max-inventory-reached', maxInventoryReached);
                this.productForm.element.setAttribute('data-error-message-position', errorMessagePosition);
              })
              .catch((error) => console.log('error: ', error));
          }

          equalizeImageOptionContainers() {
            if (this.variantOptionImages.length <= 1) return;

            const heights = [...this.variantOptionImages].map((item) => Math.floor(item.offsetHeight));
            const widths = [...this.variantOptionImages].map((item) => Math.floor(item.offsetWidth));
            const widest = Math.max(...widths);
            const tallest = Math.max(...heights);

            this.variantButtonsContainer.style.setProperty('--option-image-width', widest + 'px');
            this.variantButtonsContainer.style.setProperty('--option-image-height', tallest + 'px');
          }

          getBaseUnit(variant) {
            return variant.unit_price_measurement.reference_value === 1
              ? variant.unit_price_measurement.reference_unit
              : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
          }

          subsToggleListeners() {
            const toggles = this.container.querySelectorAll('[data-toggles-group]');

            toggles.forEach((toggle) => {
              toggle.addEventListener(
                'change',
                function (e) {
                  const val = e.target.value.toString();
                  const selected = this.container.querySelector(`[data-group-toggle="${val}"]`);
                  const groups = this.container.querySelectorAll('[data-group-toggle]');
                  if (selected) {
                    selected.classList.remove('hidden');
                    const first = selected.querySelector('[name="selling_plan"]');
                    first.checked = true;
                    first.dispatchEvent(new Event('change'));
                  }
                  groups.forEach((group) => {
                    if (group !== selected) {
                      group.classList.add('hidden');
                      const plans = group.querySelectorAll('[name="selling_plan"]');
                      plans.forEach((plan) => {
                        plan.checked = false;
                        plan.dispatchEvent(new Event('change'));
                      });
                    }
                  });
                }.bind(this)
              );
            });
          }

          updateSaleText(formState) {
            if (this.productState.planSale) {
              this.updateSaleTextSubscription(formState);
            } else if (this.productState.onSale) {
              this.updateSaleTextStandard(formState);
            } else if (this.priceOffWrap) {
              this.priceOffWrap.classList.add('hidden');
            }
          }

          isVariantFinalSale(variant) {
            const metafieldsData = document.querySelector('[data-variant-final-sale-metafield]')?.textContent;
            if (!metafieldsData) return;

            const variantsMetafields = JSON.parse(metafieldsData);
            let variantIsFinalSale = false;

            variantsMetafields.forEach((variantMetafield) => {
              if (Number(variantMetafield.variant_id) === variant.id) {
                variantIsFinalSale = variantMetafield.metafield_value === 'true';
              }
            });

            return variantIsFinalSale;
          }

          updateSaleTextStandard(formState) {
            if (!this.priceOffWrap) {
              return;
            }

            const variant = formState.variant;
            const finalSaleBadge = this.priceOffWrap?.querySelector('[data-final-sale-badge]');
            const comparePrice = variant?.compare_at_price;
            const salePrice = variant?.price;

            if (window.theme.settings.showSavingBadge) {
              if (window.theme.settings.savingBadgeType && window.theme.settings.savingBadgeType === 'percentage') {
                const discountFloat = (comparePrice - salePrice) / comparePrice;
                const discountInt = Math.floor(discountFloat * 100);
                this.priceOffAmount.innerHTML = `${discountInt}%`;
              } else {
                const discount = comparePrice - salePrice;
                this.priceOffAmount.innerHTML = window.theme.formatMoney(discount, theme.moneyFormat);
              }
            }

            // Display or hide the final sale badge
            const isFinalSale = this.priceOffWrap?.hasAttribute('data-final-sale') || this.isVariantFinalSale(variant);
            if (finalSaleBadge) {
              finalSaleBadge.classList.toggle('hidden', !isFinalSale);
            }

            this.priceOffWrap.classList.remove('hidden');
          }

          updateSaleTextSubscription(formState) {
            const variant = formState.variant;
            const variantFirstPlan = this.productForm.product.selling_plan_groups.find((plan) => plan.id === variant.selling_plan_allocations[0].selling_plan_group_id);
            const adjustment = formState.plan ? formState.plan.detail.price_adjustments[0] : variantFirstPlan.selling_plans[0].price_adjustments[0];
            const discount = adjustment.value || 0;
            const saleText = adjustment.value_type === 'percentage' ? `${discount}%` : window.theme.formatMoney(variant.price - discount, theme.moneyFormat);

            if (!this.priceOffWrap) return;

            if (this.priceOffAmount) this.priceOffAmount.innerHTML = saleText;
            this.priceOffWrap.classList.remove('hidden');
          }

          updateSubscriptionText(formState) {
            if (formState.plan && this.planDecription && formState.plan.detail.description !== null) {
              this.planDecription.innerHTML = formState.plan.detail.description;
              this.planDecription.classList.remove('hidden');
            } else if (this.planDecription) {
              this.planDecription.classList.add('hidden');
            }
          }

          updateProductPrices(formState) {
            const variant = formState.variant;
            const plan = formState.plan;
            const priceWrappers = this.container.querySelectorAll('[data-price-wrapper]');

            priceWrappers.forEach((wrap) => {
              const comparePriceEl = wrap.querySelector('[data-compare-price]');
              const productPriceEl = wrap.querySelector('[data-product-price]');

              let comparePrice = '';
              let price = '';

              if (this.productState.available) {
                comparePrice = variant.compare_at_price;
                price = variant.price;
              }

              if (this.productState.hasPlan) {
                const allocationPrice = plan ? plan.allocation.price : variant.selling_plan_allocations[0].per_delivery_price;
                price = allocationPrice;
              }

              if (this.productState.planSale) {
                const allocationPrice = plan ? plan.allocation.price : variant.selling_plan_allocations[0].per_delivery_price;
                const allocationPriceCompare = plan ? plan.allocation.compare_at_price : variant.selling_plan_allocations[0].compare_at_price;
                comparePrice = allocationPriceCompare;
                price = allocationPrice;
              }

              if ((productPriceEl || comparePriceEl) && wrap.hasAttribute('data-atc-button')) {
                const multiplier = this.productForm.quantity();
                price *= multiplier;
                comparePrice *= multiplier;
              }

              if (comparePriceEl) {
                if (this.productState.onSale || this.productState.planSale) {
                  comparePriceEl.classList.remove('hidden');
                  productPriceEl.classList.add('product__price--sale');
                } else {
                  comparePriceEl.classList.add('hidden');
                  productPriceEl.classList.remove('product__price--sale');
                }

                comparePriceEl.innerHTML = theme.settings.currency_code_enable
                  ? window.theme.formatMoney(comparePrice, theme.moneyWithCurrencyFormat)
                  : window.theme.formatMoney(comparePrice, theme.moneyFormat);
              }

              if (productPriceEl) {
                if (price === 0) {
                  productPriceEl.innerHTML = window.theme.strings.free;
                } else {
                  productPriceEl.innerHTML = theme.settings.currency_code_enable ? window.theme.formatMoney(price, theme.moneyWithCurrencyFormat) : window.theme.formatMoney(price, theme.moneyFormat);
                }
              }
            });

            if (this.hasUnitPricing) {
              this.updateProductUnits(formState);
            }
          }

          updateProductUnits(formState) {
            const variant = formState.variant;
            const plan = formState.plan;
            let unitPrice = null;

            if ((variant && variant.unit_price) || (!plan && !variant.requires_selling_plan)) {
              unitPrice = variant.unit_price;
            }
            if (plan && plan?.allocation && plan?.allocation.unit_price) {
              unitPrice = plan.allocation.unit_price;
            }
            if (!plan && variant.requires_selling_plan && variant.selling_plan_allocations) {
              if (variant.selling_plan_allocations.length > 0) {
                const allocationUnitPrice = variant.selling_plan_allocations[0].unit_price;
                unitPrice = allocationUnitPrice;
              }
            }

            if (unitPrice) {
              const base = this.getBaseUnit(variant);
              const formattedPrice = unitPrice === 0 ? window.theme.strings.free : window.theme.formatMoney(unitPrice, theme.moneyFormat);
              this.container.querySelector('[data-product-unit-price]').innerHTML = formattedPrice;
              this.container.querySelector('[data-product-base]').innerHTML = base;
              this.container.querySelector('[data-product-unit]').classList.remove('hidden');
            } else {
              this.container.querySelector('[data-product-unit]').classList.add('hidden');
            }
          }

          fireHookEvent(formState) {
            const variant = formState.variant;

            // Hook for product variant change event
            this.container.dispatchEvent(
              new CustomEvent('theme:variant:change', {
                detail: {
                  variant: variant,
                  productTitle: this.productForm.product.title,
                },
                bubbles: true,
              })
            );
          }

          /**
           * Tracks aspects of the product state that are relevant to UI updates
           * @param {object} evt - variant change event
           * @return {object} productState - represents state of variant + plans
           *  productState.available - current variant and selling plan options result in valid offer
           *  productState.soldOut - variant is sold out
           *  productState.onSale - variant is on sale
           *  productState.showUnitPrice - variant has unit price
           *  productState.requiresPlan - all the product variants requires a selling plan
           *  productState.hasPlan - there is a valid selling plan
           *  productState.planSale - plan has a discount to show next to price
           *  productState.planPerDelivery - plan price does not equal per_delivery_price - a prepaid subscribtion
           */
          setProductState(dataset) {
            const variant = dataset.variant;
            const plan = dataset.plan;

            const productState = {
              available: true,
              soldOut: false,
              onSale: false,
              showUnitPrice: false,
              requiresPlan: false,
              hasPlan: false,
              planPerDelivery: false,
              planSale: false,
            };

            if (!variant) {
              productState.available = false;
            } else {
              const requiresPlan = variant.requires_selling_plan || false;

              if (!variant.available) {
                productState.soldOut = true;
              }

              if (variant.compare_at_price > variant.price) {
                productState.onSale = true;
              }

              if (variant.unit_price) {
                productState.showUnitPrice = true;
              }

              if (this.product && this.product.requires_selling_plan) {
                productState.requiresPlan = true;
              }

              if (plan && this.subPrices) {
                productState.hasPlan = true;
                if (plan.allocation.per_delivery_price !== plan.allocation.price) {
                  productState.planPerDelivery = true;
                }
                if (variant.price > plan.allocation.price) {
                  productState.planSale = true;
                }
              }

              if (!plan && requiresPlan) {
                productState.hasPlan = true;
                if (variant.selling_plan_allocations[0].per_delivery_price !== variant.selling_plan_allocations[0].price) {
                  productState.planPerDelivery = true;
                }
                if (variant.price > variant.selling_plan_allocations[0].price) {
                  productState.planSale = true;
                }
              }
            }
            return productState;
          }

          updateProductImage(evt) {
            const variant = evt.dataset?.variant || evt.variant;

            if (!variant || !variant?.featured_media) {
              return;
            }

            // Update variant image, if one is set
            const newImg = this.container.querySelector(`[data-product-image][data-image-id="${variant.featured_media.id}"]`);
            const newImageParent = newImg?.closest('[data-product-slide]');

            if (newImageParent) {
              const newImagePos = parseInt([...newImageParent.parentElement.children].indexOf(newImageParent));
              const imgSlider = this.container.querySelector('[data-product-single-media-slider]');
              const flkty = window.theme.Flickity.data(imgSlider);

              // Activate image slide in mobile view
              if (flkty && flkty.isActive) {
                const variantSlide = imgSlider.querySelector(`[data-id="${variant.featured_media.id}"]`);

                if (variantSlide) {
                  const slideIndex = parseInt([...variantSlide.parentNode.children].indexOf(variantSlide));
                  flkty.select(slideIndex);
                }
                return;
              }

              if (this.tallLayout) {
                // We know its a tall layout, if it's sticky
                // scroll to the images
                // Scroll to/reorder image unless it's the first photo on load
                const newImgTop = newImg.getBoundingClientRect().top;

                if (newImagePos === 0 && newImgTop + window.scrollY > window.pageYOffset) return;

                // Scroll to variant image
                document.dispatchEvent(
                  new CustomEvent('theme:tooltip:close', {
                    bubbles: false,
                    detail: {
                      hideTransition: false,
                    },
                  })
                );

                window.theme.scrollTo(newImgTop);
              }
            }
          }

          observeSwatch(formState, swatchesContainer) {
            const swatch = swatchesContainer.querySelector(`[data-swatch-variant*="${formState.variant.id}"]`);
            swatchesContainer.closest('[data-option-position]').classList.remove('selector-wrapper--visible');
            let observer = new IntersectionObserver(
              (entries, observer) => {
                entries.forEach((entry) => {
                  const notVisible = entry.intersectionRatio == 0;

                  if (notVisible) {
                    swatchesContainer.closest('[data-option-position]').classList.add('selector-wrapper--visible');
                  }
                });
              },
              {
                root: this.container,
                threshold: [0.95, 1],
              }
            );
            observer.observe(swatch);
          }

          handleSwatchResize() {
            if (this.swatchesContainers && this.swatchesContainers.length > 0) {
              this.swatchesContainers.forEach((swatchContainer) => {
                this.checkSwatchesHeight(swatchContainer);
              });
            }
          }

          checkSwatchesHeight(swatchesContainer) {
            const label = swatchesContainer.querySelector('[data-swatches-label]');
            const hiddenLabels = Boolean(label.closest('.variant__labels--hide'));
            const labelHeight = hiddenLabels ? 1 : label.offsetHeight; // 1px due to CSS Safari fix
            const swatch = swatchesContainer.querySelector('[data-swatches-button]');
            const containerPaddingTop = parseInt(window.getComputedStyle(swatchesContainer).getPropertyValue('padding-top'));
            const labelMargin = hiddenLabels ? 0 : parseInt(window.getComputedStyle(label).getPropertyValue('margin-bottom'));
            const swatchMargin = parseInt(window.getComputedStyle(swatch).getPropertyValue('margin-bottom'));
            const selectorWrapper = swatchesContainer.closest('[data-option-position]');

            selectorWrapper.classList.remove('selector-wrapper--large', 'selector-wrapper--visible');
            swatchesContainer.style.removeProperty('--swatches-max-height');

            requestAnimationFrame(() => {
              if (swatchesContainer.offsetHeight - containerPaddingTop > labelHeight + labelMargin + swatch.offsetHeight * 2 + swatchMargin * 2) {
                swatchesContainer.style.setProperty('--swatches-max-height', `${swatchesContainer.offsetHeight}px`);
                selectorWrapper.classList.add('selector-wrapper--large');
              }
            });
          }

          observeContainer() {
            let button = this.buyItNow.querySelector('.shopify-payment-button__button--unbranded');
            if (button) {
              // Add Buy It Now button styles
              button.classList.add(window.theme.settings.buynowButtonColor);
              button.classList.add(window.theme.settings.buynowButtonStyle);
              button.classList.add(window.theme.settings.buynowButtonSize);

              // Check if button is loaded and add the hover-button element
              this.insertHoverElement(button);
              return;
            }

            this.mutationObserver = new MutationObserver((mutationList) => {
              for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                  // Find the payment button and add the hover-button element
                  const button = mutation.target.querySelector('.shopify-payment-button__button--unbranded');
                  if (button) {
                    this.insertHoverElement(button);

                    this.mutationObserver?.disconnect(); // Stop observing once the button is found and modified
                    this.mutationObserver = null;
                  }
                }
              }
            });

            // Start observing the 'data-buy-it-now' for the childList changes
            this.mutationObserver.observe(this.buyItNow, {
              childList: true, // Look for added nodes
              subtree: true, // Observe all descendants
            });
          }

          insertHoverElement(button) {
            // Wrap the inner of the payment button in hover-button custom element
            const buttonInner = button.innerHTML;
            button.innerHTML = `<hover-button>${buttonInner}</hover-button>`;
          }

          /**
           * Scroll to the last submitted notification form
           */
          scrollToForm(section) {
            const headerHeight = document.querySelector('[data-site-header]')?.dataset.height;
            const isVisible = visibilityHelper.isElementPartiallyVisible(section) || visibilityHelper.isElementTotallyVisible(section);

            if (!isVisible) {
              setTimeout(() => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top - headerHeight;

                window.scrollTo({
                  top: sectionTop,
                  left: 0,
                  behavior: 'smooth',
                });
              }, 400);
            }
          }

          disconnectedCallback() {
            if (this.productForm) this.productForm.destroy();
            if (this.hasVariantOptionWithImage) window.removeEventListener('theme:resize:width', this.onResizeCallback);
            document.removeEventListener('theme:cart:close', this.checkLiveCartInfoCallback);

            // Remove the single resize listener for swatches if it was added
            if (this.swatchesContainers.length > 0) {
              document.removeEventListener('theme:resize:width', this.boundHandleSwatchResize);
            }

            if (this.mutationObserver) {
              this.mutationObserver.disconnect();
              this.mutationObserver = null;
            }
          }
        }
      );
    }

    const selectors$7 = {
      quantityHolder: '[data-quantity-holder]',
      quantityField: '[data-quantity-field]',
      quantityButton: '[data-quantity-button]',
      quantityMinusButton: '[data-quantity-minus]',
      quantityPlusButton: '[data-quantity-plus]',
      cartItem: '[data-cart-item]',
    };

    const classes$6 = {
      quantityReadOnly: 'read-only',
      isDisabled: 'is-disabled',
    };

    if (!customElements.get('quantity-counter')) {
      customElements.define(
        'quantity-counter',
        class QuantityCounter extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            // DOM Elements
            this.quantity = this;
            this.cartItem = this.quantity.closest(selectors$7.cartItem);

            if (!this.quantity) {
              return;
            }

            this.field = this.quantity.querySelector(selectors$7.quantityField);
            this.buttons = this.quantity.querySelectorAll(selectors$7.quantityButton);
            this.increaseButton = this.quantity.querySelector(selectors$7.quantityPlusButton);

            // Set value or classes
            this.quantityValue = Number(this.field.value || 0);
            this.cartItemID = this.field.getAttribute('data-id');
            this.maxValue = Number(this.field.getAttribute('max')) > 0 ? Number(this.field.getAttribute('max')) : null;
            this.minValue = Number(this.field.getAttribute('min')) > 0 ? Number(this.field.getAttribute('min')) : 0;
            this.disableIncrease = this.disableIncrease.bind(this);

            // Flags
            this.emptyField = false;

            // Methods
            this.updateQuantity = this.updateQuantity.bind(this);
            this.decrease = this.decrease.bind(this);
            this.increase = this.increase.bind(this);

            this.disableIncrease();

            // Events
            if (!this.quantity.classList.contains(classes$6.quantityReadOnly)) {
              this.changeValueOnClick();
              this.changeValueOnInput();
            }
          }

          /**
           * Change field value when click on quantity buttons
           *
           * @return  {Void}
           */

          changeValueOnClick() {
            this.buttons.forEach((element) => {
              element.addEventListener('click', (event) => {
                event.preventDefault();

                this.quantityValue = Number(this.field.value || 0);

                const clickedElement = event.target;
                const isDescrease = clickedElement.matches(selectors$7.quantityMinusButton) || clickedElement.closest(selectors$7.quantityMinusButton);
                const isIncrease = clickedElement.matches(selectors$7.quantityPlusButton) || clickedElement.closest(selectors$7.quantityPlusButton);

                if (isDescrease) {
                  this.decrease();
                }

                if (isIncrease) {
                  this.increase();
                }

                this.updateQuantity();
              });
            });
          }

          /**
           * Change field value when input new value in a field
           *
           * @return  {Void}
           */

          changeValueOnInput() {
            this.field.addEventListener('input', () => {
              this.quantityValue = this.field.value;
              this.updateQuantity();
            });
          }

          /**
           * Update field value
           *
           * @return  {Void}
           */

          updateQuantity() {
            if (this.maxValue < this.quantityValue && this.maxValue !== null) {
              this.quantityValue = this.maxValue;
            }

            if (this.minValue > this.quantityValue) {
              this.quantityValue = this.minValue;
            }

            this.field.value = this.quantityValue;

            this.disableIncrease();

            if (this.cartItem) {
              document.dispatchEvent(new CustomEvent('theme:cart:update'));
              this.updateCart();
            } else {
              this.triggerInputChange();
            }
          }

          /**
           * Decrease value
           *
           * @return  {Void}
           */

          decrease() {
            if (this.quantityValue > this.minValue) {
              this.quantityValue--;

              return;
            }

            this.quantityValue = 0;
          }

          /**
           * Increase value
           *
           * @return  {Void}
           */

          increase() {
            this.quantityValue++;
          }

          /**
           * Disable increase
           *
           * @return  {[type]}  [return description]
           */

          disableIncrease() {
            this.increaseButton.classList.toggle(classes$6.isDisabled, this.quantityValue >= this.maxValue && this.maxValue !== null);
          }

          updateCart() {
            if (this.quantityValue === '') return;

            const event = new CustomEvent('theme:cart:update', {
              bubbles: true,
              detail: {
                id: this.cartItemID,
                quantity: this.quantityValue,
              },
            });

            if (this.cartItem) {
              this.cartItem.dispatchEvent(event);
            }
          }

          triggerInputChange() {
            this.field.dispatchEvent(new Event('change'));
          }
        }
      );
    }

    // iOS smooth scrolling fix
    window.theme.flickitySmoothScrolling = function (slider) {
      const flkty = window.theme.Flickity.data(slider);

      if (!flkty) {
        return;
      }

      flkty.on('dragStart', (event, pointer) => {
        document.ontouchmove = function (e) {
          e.preventDefault();
        };
      });

      flkty.on('dragEnd', (event, pointer) => {
        document.ontouchmove = function (e) {
          return true;
        };
      });
    };

    function getSearchParams(searchForm, filtersForm, deleteParams = [], type = false) {
      const searchFormData = new FormData(searchForm);
      const searchFormParams = new URLSearchParams(searchFormData);

      if (!filtersForm) return searchFormParams.toString();

      const filtersFormData = new FormData(filtersForm);
      const filtersFormParams = new URLSearchParams(filtersFormData);

      // Get keys with empty values from the search-form and filters-form's FormData objects and delete them
      const emptyParams = [];
      for (const pair of searchFormData.entries()) {
        if (pair[1] === '') emptyParams.push(pair[0]);
      }
      for (const pair of filtersFormData.entries()) {
        if (pair[1] === '') emptyParams.push(pair[0]);
      }
      for (let index = 0; index < emptyParams.length; index++) {
        const param = emptyParams[index];
        if (searchFormParams.has(param)) searchFormParams.delete(param);
        if (filtersFormParams.has(param)) filtersFormParams.delete(param);
      }

      // Delete duplicated keys gotten from the filters FormData object
      for (const key of searchFormParams.keys()) {
        if (filtersFormParams.has(key)) filtersFormParams.delete(key);
      }

      // Delete keys from deleteParams array
      if (deleteParams.length > 0) {
        for (let index = 0; index < deleteParams.length; index++) {
          const param = deleteParams[index];
          if (searchFormParams.has(param)) searchFormParams.delete(param);
          if (filtersFormParams.has(param)) filtersFormParams.delete(param);
        }
      }

      // Replace type key if necessary
      if (type) {
        if (filtersFormParams.has('type')) filtersFormParams.delete('type');
        searchFormParams.set('type', type);
      }

      return `${searchFormParams.toString()}&${filtersFormParams.toString()}`;
    }

    if (!customElements.get('tabs-component')) {
      customElements.define(
        'tabs-component',
        class GlobalTabs extends HTMLElement {
          constructor() {
            super();

            this.tabsContents = this.querySelector('[data-tabs-contents]');
            this.animateElementsTimer = null;
            this.isSearchPage = this.closest(`[data-search-performed="true"]`) != null;
          }

          connectedCallback() {
            this.tabRef = this.querySelectorAll('[data-tab-ref]');
            this.tabsLink = this.querySelectorAll('[data-tabs-link]');
            this.tab = this.querySelectorAll('[data-tab]');

            this.assignSearchPageArguments();

            this.init();

            this.inactiveTabsAnimationsCallback = window.theme.debounce(() => this.handleInactiveTabsAnimations(), 200);
            document.addEventListener('theme:scroll', this.inactiveTabsAnimationsCallback);

            this.addEventListener('mouseenter', () => {
              this.handleInactiveTabsAnimations();
            });
          }

          /**
           * Arguments and methods related specifically to Search page tabs
           */
          assignSearchPageArguments() {
            if (!this.isSearchPage) return;

            const searchSection = this.closest('section');

            this.searchForm = searchSection.querySelector('[data-search-form]');
            this.searchFormData = new FormData(this.searchForm);
            this.searchTerm = encodeURIComponent(this.searchFormData.get('q'));
            this.currentType = searchSection.getAttribute('data-current-type');
            this.sectionId = searchSection.dataset.sectionId;
            this.searchForAllTypes = searchSection.getAttribute('data-all-types') === 'true';
            this.fetchURL = '';
            this.searchParams = '';
            this.cachedResults = {};

            this.handleTabsHistory();
          }

          /**
           * Initialise
           */
          init() {
            const tabsNavList = this.querySelectorAll('[data-tabs-link]');

            tabsNavList.forEach((element) => {
              this.handleTabsNavListeners(element);
            });
          }

          /**
           * Use a `theme:tab:open-from-history` custom event to change the active tab on history change
           */
          handleTabsHistory() {
            window.addEventListener('popstate', this.onHistoryChange.bind(this));

            this.openTabFromHistoryEvent = (event) => this.openTabFromHistory(event);

            this.tabsLink.forEach((element) => {
              element.addEventListener('theme:tab:open-from-history', this.openTabFromHistoryEvent);
            });
          }

          /**
           * Handle tabs navigations listeners
           */
          handleTabsNavListeners(element) {
            const tabId = element.getAttribute('data-tabs-link');
            const tab = this.querySelector(`[data-tab="${tabId}"]`);

            if (!tab) return;

            element.addEventListener('click', (event) => {
              if (this.isSearchPage) this.handleURLSearchParams(event, true);
              this.tabChange(element, tab);
            });

            element.addEventListener('keyup', (event) => {
              if (event.code === theme.keyboardKeys.SPACE || event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER) {
                if (this.isSearchPage) this.handleURLSearchParams(event, true);
                this.tabChange(element, tab);
              }
            });
          }

          /**
           * Open active tab on history change
           */
          openTabFromHistory(event) {
            const target = event.target;
            const element = this.querySelector(event.detail.element);
            const tabId = element.getAttribute('data-tabs-link');
            const tab = this.querySelector(`[data-tab="${tabId}"]`);

            if (!tab) return;

            this.handleURLSearchParams(event, false);
            this.tabChange(target, tab);
          }

          /**
           * Update URL and Search parameters
           */
          handleURLSearchParams(event, updateHistory = true) {
            const target = event.target.matches('[data-tabs-link]') ? event.target : event.target.closest('[data-tabs-link]');
            const type = target.getAttribute('data-type');
            const tabId = target.getAttribute('data-tabs-link');
            const tab = this.querySelector(`[data-tab="${tabId}"]`);
            const currentPage = tab.querySelector('[data-current-page]');
            const filtersForm = document.querySelector('[data-collection-filters-form]');
            let currentPageStr = currentPage ? `&page=${currentPage.getAttribute('data-current-page')}` : '';

            this.searchParams = getSearchParams(this.searchForm, filtersForm, [], type);
            if (type === 'product') {
              // Remove duplicate parameter if filters have been applied before 'all-search-types' container is removed
              const sanitized = this.searchParams.replace('&type=product', '');
              this.searchParams = `${sanitized}&type=product`;
            } else {
              // Prevent erroneous search results by removing excess filters form's parameters if search filters have already been applied
              this.searchParams = `q=${this.searchTerm}&type=${type}`;
            }
            // Include current page into the URL
            if (!theme.settings.enableInfinityScroll && currentPageStr !== '') {
              this.searchParams += currentPageStr;
            }

            // Build the URL for fetching tab contents
            this.fetchURL = `${theme.routes.searchUrl}?${this.searchParams}&section_id=${this.sectionId}`;

            // Update URL on each tab change
            // Prevented when using the 'theme:tab:open-from-history' custom event to avoid endless cycle of wrong history updates
            if (updateHistory) {
              history.pushState({searchParams: this.searchParams}, '', `${window.location.pathname}${this.searchParams && '?'.concat(this.searchParams)}`);
            }
          }

          /**
           * Fetch tab content and handle tab change events
           */
          tabChangeFetchContent(element, tab) {
            const type = element.getAttribute('data-type');
            const tabId = element.getAttribute('data-tabs-link');
            const tabContainer = this.querySelector(`[data-tab="${tabId}"]`);
            const typeRendered = this.currentType === type;
            const activeTab = this.querySelector('.current[data-tab]');
            const activeAjaxinateItems = activeTab?.querySelector('ajaxinate-items');
            const tooltipTarget = document.querySelector('[data-tooltip-container]');

            tooltipTarget?.style.setProperty('--tooltip-top', `0px`);

            if (typeof activeAjaxinateItems?.unload === 'function') {
              // unload ajaxinate in last tab
              activeAjaxinateItems.unload();
            }

            if (this.cachedResults[tabId] || typeRendered) {
              const ajaxinateItems = tab.querySelector('ajaxinate-items');

              if (typeof ajaxinateItems?.init === 'function') {
                // init ajaxinate in cached tab
                ajaxinateItems.init();
              }

              requestAnimationFrame(() => {
                this.handleActiveTabClasses(element, tab);
                this.scrollToCurrentTabLink(element);
                this.triggerTabAnimations(tab);
              });

              return;
            }

            fetch(this.fetchURL)
              .then((response) => {
                if (!response.ok) {
                  const error = new Error(response.status);
                  throw error;
                }

                return response.text();
              })
              .then((text) => {
                const parsed = new DOMParser().parseFromString(text, 'text/html');
                const resultsMarkup = parsed.querySelector(`[data-tab="${tabId}"]`).innerHTML;

                // Remove the container with search results with all search types
                if (this.searchForAllTypes) {
                  this.querySelector('[data-all-types-container]')?.remove();
                }

                // Keep the cache for all tabs
                this.cachedResults[tabId] = resultsMarkup;
                // Render tab contents
                tabContainer.innerHTML = resultsMarkup;

                requestAnimationFrame(() => {
                  this.handleActiveTabClasses(element, tab);
                  this.scrollToCurrentTabLink(element);
                  this.triggerTabAnimations(tab);
                });
              })
              .catch((error) => {
                throw error;
              });
          }

          /**
           * Handle history change using `theme:tab:open-from-history` custom events
           */
          onHistoryChange(event) {
            const searchParams = event.state?.searchParams || window.location.search;
            const productResults = searchParams.indexOf('type=product') > -1;
            const articleResults = searchParams.indexOf('type=article') > -1;
            const pageResults = searchParams.indexOf('type=page') > -1;
            const anyOpenedTab = Boolean(this.querySelector('.current[data-tabs-link]'));
            const shouldOpenTab = productResults || articleResults || pageResults;
            const typeProduct = this.querySelector(`[data-tabs-link][data-type="product"]`);
            const typeArticle = this.querySelector(`[data-tabs-link][data-type="article"]`);
            const typePage = this.querySelector(`[data-tabs-link][data-type="page"]`);

            if (!shouldOpenTab) {
              // Go to initial search page results if the 'all-search-types' container is removed
              window.location = searchParams;
              return;
            }

            if (!anyOpenedTab) return;

            if (productResults) {
              typeProduct?.dispatchEvent(
                new CustomEvent('theme:tab:open-from-history', {
                  bubbles: true,
                  detail: {
                    element: '[data-type="product"]',
                  },
                })
              );
            }

            if (articleResults) {
              typeArticle?.dispatchEvent(
                new CustomEvent('theme:tab:open-from-history', {
                  bubbles: true,
                  detail: {
                    element: '[data-type="article"]',
                  },
                })
              );
            }

            if (pageResults) {
              typePage?.dispatchEvent(
                new CustomEvent('theme:tab:open-from-history', {
                  bubbles: true,
                  detail: {
                    element: '[data-type="page"]',
                  },
                })
              );
            }
          }

          /**
           * Tab change event
           */
          tabChange(element, tab) {
            if (element.classList.contains('current')) return;

            if (this.isSearchPage) {
              this.tabChangeFetchContent(element, tab);
              return;
            }

            this.handleActiveTabClasses(element, tab);
            this.scrollToCurrentTabLink(element);
            this.triggerTabAnimations(tab);
            this.handleTabSliders(tab);
          }

          /**
           * Handle active tab classes
           */
          handleActiveTabClasses(element, tab) {
            const lastActiveTab = this.querySelector('.current[data-tab]');

            const lastActiveTabsLink = this.querySelector('.current[data-tabs-link]');

            // Update active tab's classes
            lastActiveTab?.classList.remove('current');
            lastActiveTabsLink?.classList.remove('current');
            element.classList.add('current');
            tab.classList.add('current');

            if (element.classList.contains('hide')) {
              tab.classList.add('hide');
            }

            // Update tab's referenced elements' classes
            this.tabRef?.forEach((refElement) => {
              const isActive = refElement.classList.contains('current');
              const shouldBeActive = refElement.getAttribute('data-tab-ref') === tab.getAttribute('data-tab');

              refElement.classList.toggle('current', !isActive && shouldBeActive);
            });
          }

          /**
           * Scroll to current tab link
           */
          scrollToCurrentTabLink(element) {
            const parent = element.closest('[data-custom-scrollbar-holder]') ? element.closest('[data-custom-scrollbar-holder]') : element.parentElement;
            const parentPadding = parseInt(window.getComputedStyle(parent).getPropertyValue('padding-left'));

            parent.scrollTo({
              top: 0,
              left: element.offsetLeft - parent.offsetWidth / 2 + element.offsetWidth / 2 + parentPadding,
              behavior: 'smooth',
            });

            element.dispatchEvent(
              new CustomEvent('theme:custom-scrollbar:change', {
                bubbles: true,
                detail: {
                  element: element,
                },
              })
            );
          }

          /**
           * Refresh animations if they are enabled
           */
          triggerTabAnimations(tab) {
            if (theme.settings.animationsEnabled == 'false') return;

            document.dispatchEvent(new CustomEvent('theme:scroll')); // Update all scrollable-parallax elements scroll positions

            const productTab = this.tabsContents.querySelector('[data-tab="resultsProducts"]');

            // Product tab is current
            if (productTab && productTab.classList.contains('current')) {
              const anchors = this.tabsContents.querySelectorAll('[data-aos-anchor]');
              // Get all anchors and attach observers
              initAnchorObservers(anchors);
              return;
            }

            this.tabsContents.querySelectorAll('[data-aos]').forEach((element) => {
              element.classList.remove('aos-animate');
            });

            if (this.animateElementsTimer) {
              clearTimeout(this.animateElementsTimer);
            }

            this.animateElementsTimer = setTimeout(() => {
              tab.querySelectorAll('[data-aos]').forEach((element) => {
                element.classList.add('aos-animate');
              });
            }, 150);
          }

          /**
           * When the page is scrolled AOS classes are auto updated regardless of each tab visibility
           * Removing them for inactive tabs solves issues with animations refresh on tab opening
           */
          handleInactiveTabsAnimations() {
            this.tab.forEach((tab) => {
              if (!tab.classList.contains('current')) {
                tab.querySelectorAll('[data-aos]').forEach((element) => {
                  requestAnimationFrame(() => element.classList.remove('aos-animate'));
                });
              }
            });
          }

          /**
           * Trigger `theme:tab:change` custom event to reset the selected tab slider position
           */
          handleTabSliders(tab) {
            const slider = tab.querySelector('grid-slider');
            if (slider) slider.dispatchEvent(new CustomEvent('theme:tab:change', {bubbles: false}));
          }

          /**
           * Event callback for Theme Editor `shopify:section:unload` event
           */
          disconnectedCallback() {
            // Clean up animation events
            document.removeEventListener('theme:scroll', this.inactiveTabsAnimationsCallback);

            // Clean up tab history events
            if (this.openTabFromHistoryEvent) {
              this.tabsLink.forEach((element) => {
                element.removeEventListener('theme:tab:open-from-history', this.openTabFromHistoryEvent);
              });
            }

            // Clean up window history events
            window.removeEventListener('popstate', this.onHistoryChange.bind(this));
          }
        }
      );
    }

    /**
     * This component is responsible for:
     *  - animating highlighted text decorations on page load, section load and on scrolling down
     *  - adding a reversed animation on hover whenever highlighted text contains a link
     *  - including a method for triggering the highlighted text animations on events like slide change, active item swapping, etc.
     */
    const selectors$6 = {
      aos: '[data-aos]',
      link: '[data-has-highlight]',
      highlightHolder: '[data-highlight-holder]',
      path: 'path',
      sup: 'sup',
      flickityEnabled: '.flickity-enabled',
      activeSlide: '[data-slide].is-selected',
      stickyTextItem: '[data-sticky-text]',
      textCountUp: 'text-count-up',
      textRevealCropper: '.text-reveal__cropper',
    };

    const attributes$4 = {
      highlightType: 'data-highlight-type',
      isActive: 'data-is-active',
    };

    const classes$5 = {
      isActive: 'is-active',
      overflowHidden: 'overflow-hidden',
    };

    const settings$2 = {
      'circle-hand-drawn': {
        keyframes: [
          {strokeDashoffset: '1', opacity: '0'},
          {opacity: '1', offset: 0.01},
          {strokeDashoffset: '0', opacity: '1'},
        ],
        timing: {
          duration: 1000,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
        },
      },
      circle: {
        keyframes: [
          {strokeDashoffset: '506', opacity: '0'},
          {opacity: '1', offset: 0.01},
          {strokeDashoffset: '0', opacity: '1'},
        ],
        timing: {
          duration: 800,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.6, 0, 0.4, 1)',
        },
      },
      highlight: {
        keyframes: [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}],
        timing: {
          duration: 600,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'ease',
          pseudoElement: '::before',
        },
        keyframesHover: [{transform: 'scaleY(0.1)'}, {transform: 'scaleY(1)'}],
      },
      'highlight-color': {
        keyframes: [
          {backgroundSize: '200% 100%', backgroundPosition: '100% 0'},
          {backgroundSize: '200% 100%', backgroundPosition: '0 0', offset: 0.2},
          {backgroundSize: '1100% 100%', backgroundPosition: '0 0'},
        ],
        timing: {
          duration: 2000,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0, 0, 0.9, 0.4)',
        },
      },
      'alternate-font': {
        keyframes: [{opacity: '0'}, {opacity: '1'}],
        timing: {
          duration: 400,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'ease-out',
        },
        keyframesHover: [{opacity: '1'}, {opacity: '0.7'}],
      },
      squiggle: {
        keyframes: [{maskPosition: '100% 0'}, {maskPosition: '0 0'}],
        timing: {
          duration: 1200,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.6, 0, 0.4, 1)',
        },
      },
      stroke: {
        keyframes: [{backgroundPosition: '100% 0'}, {backgroundPosition: '0 0'}],
        timing: {
          duration: 1200,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.25, 0.1, 0.9, 0.3)',
        },
      },
      underline: {
        keyframes: [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}],
        timing: {
          duration: 900,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'ease',
          pseudoElement: '::before',
        },
      },
      'underline-hand-drawn': {
        keyframes: [
          {strokeDashoffset: '1', opacity: '0'},
          {opacity: '1', offset: 0.01},
          {strokeDashoffset: '0', opacity: '1'},
        ],
        timing: {
          duration: 1000,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
        },
      },
    };

    if (!customElements.get('text-highlight')) {
      customElements.define(
        'text-highlight',
        class TextHighlight extends HTMLElement {
          static observedAttributes = [attributes$4.isActive];

          constructor() {
            super();

            this.animation = null;
            this.bind = null;
            this.boundAnimation = null;
            this.link = this.closest(selectors$6.link);
            this.type = this.getAttribute(attributes$4.highlightType);
            this.highlightHolder = this.querySelector(selectors$6.highlightHolder);
            this.textCountUp = this.closest(selectors$6.textCountUp);
            this.sup = this.querySelector(selectors$6.sup);
            this.textRevealCropper = this.closest(selectors$6.textRevealCropper);

            this.target = this.highlightHolder;
            if (this.type === 'circle-hand-drawn' || this.type === 'circle' || this.type === 'underline-hand-drawn') {
              this.target = this.querySelector(selectors$6.path);
            }

            if (this.type === 'highlight-color' || this.type === 'stroke' || this.type === 'alternate-font') {
              if (this.sup) this.bind = this.sup;
            }
          }

          /**
           * Initialize animation provided that there is a target element, set of keyframes and timing objects
           *  - Create new `Animation` with the `Element` interface's `animate()` method
           *  - Pause it immediately and wait for attribute changes to trigger `play()` method
           *  - Resume playing of animation if theme animations are disabled
           *  - Include event listeners for handling mouseenter/mouseleave interactions to trigger the reversal of the animation
           *  - Attach `AbortController` to clean up event listeners on `disconnectedCallback()` method
           *  - Modify default keyframes or timing properties for special cases, like in the "Slideshow" section
           *  - Bind animation events/state for the need of animating inner elements, such as `<sup>` elements in "Promotion row" section
           *  - Clear the timeout in case it's previously set for the purpose of handling text count-up animations
           */
          connectedCallback() {
            this.timeout = null;
            this.controller = new AbortController();

            if (!this.type || !this.target) return;
            this.animation = this.target.animate(settings$2[this.type].keyframes, settings$2[this.type].timing);
            this.animation.pause();
            this.bindAnimation('init');
            this.bindAnimation('pause');

            this.modifyDefaults('slider');

            if (!this.animation) return;
            if (this.link) {
              this.listen();
            }

            if (!theme.settings.animationsEnabled) {
              this.animation.play();
              this.bindAnimation('play');
            }
          }

          disconnectedCallback() {
            this.controller.abort();
          }

          /**
           * Execute animation `play()` or `cancel()` methods
           *  - If theme animations are enabled animations are paused on creation
           *  - Resuming the playing of animation relies on the global AOS `IntersectionObserver`
           *  - When a section intersects with the viewport and anchor elements are animated, they should trigger
           *    the internal `shouldAnimate()` or `setTriggerAttribute()` methods with which to trigger attribute change of the custom element
           *  - Resetting the animation state is necessary whenever there is either a slide change or active item swapping,
           *    where the `cancel()` method, along with a reset of animation delay, is applied to each inactive slide/item
           */
          attributeChangedCallback(name, oldValue, newValue) {
            const isActiveChange = name === attributes$4.isActive;
            const initialActiveSetting = oldValue === null && isActiveChange;
            const becomesActive = newValue === 'true';
            const alreadyActive = oldValue === 'true' && newValue === 'true';

            if (isActiveChange && becomesActive && !alreadyActive) {
              this.triggerAnimation();
            }

            // Reset animation state on each inactive slide/item
            if (!initialActiveSetting && !becomesActive) {
              this.reset();
            }
          }

          triggerAnimation() {
            const parentAnimation = this.closest(selectors$6.aos);

            if (parentAnimation) {
              this.textRevealCropper?.classList.add(classes$5.overflowHidden);

              if (this.textCountUp) {
                // Text count-up animation updates the DOM and interferes with resuming animation normally
                // Animation needs to be executed as soon as counting up has ended
                // Clear the timeout to negate triggering the animation multiple times
                clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                  this.textRevealCropper?.classList.remove(classes$5.overflowHidden);
                  this.setAnimationDelay(0);
                  this.animate();
                }, 100);
              } else {
                window.theme.waitForAnimationEnd(parentAnimation).then(() => {
                  const parentDelay = window.getComputedStyle(parentAnimation).getPropertyValue('animation-delay') || 0;
                  const delayMs = parentDelay.replace('s', '') * 1000;
                  const setDelay = Math.max(delayMs - 250, 0);

                  this.textRevealCropper?.classList.remove(classes$5.overflowHidden);
                  this.setAnimationDelay(setDelay);
                  this.animate();
                });
              }
            } else {
              this.animate();
            }
          }

          listen() {
            this.link.addEventListener('mouseenter', (event) => this.onMouseenter(event), {signal: this.controller.signal});
            this.link.addEventListener('mouseleave', (event) => this.onMouseleave(event), {signal: this.controller.signal});
          }

          animate() {
            if (!this.animation) return;
            this.animation.play();
            this.bindAnimation('play');
            this.animation.onfinish = () => this.onFinish();
          }

          shouldAnimate() {
            requestAnimationFrame(() => {
              let shouldAnimate = true;

              const inSlider = Boolean(this.closest(selectors$6.flickityEnabled));
              if (inSlider) shouldAnimate = Boolean(this.closest(selectors$6.activeSlide));

              const stickyTextItem = this.closest(selectors$6.stickyTextItem);
              if (stickyTextItem) shouldAnimate = Boolean(stickyTextItem.classList.contains(classes$5.isActive));

              this.setTriggerAttribute(shouldAnimate);
            });
          }

          setTriggerAttribute(active = true) {
            this.setAttribute(attributes$4.isActive, active);
          }

          reset() {
            if (!this.animation) return;
            this.animation.cancel();
            this.bindAnimation('cancel');
            this.setAnimationDelay(settings$2[this.type].timing.delay);
          }

          onMouseenter(event) {
            event.stopImmediatePropagation();

            this.setAnimationDelay(0);
            this.modifyDefaults('mouseenter');
            if (this.type !== 'alternate-font') {
              this.animation.reverse();
            }
            this.bindAnimation('mouseenter');
          }

          onMouseleave(event) {
            event.stopImmediatePropagation();

            this.modifyDefaults('mouseleave');
            if (this.type !== 'alternate-font') {
              this.animation.reverse();
            }
            this.bindAnimation('mouseleave');
          }

          onFinish() {
            // Update animation delay on inactive slides/items
            if (this.hasAttribute(attributes$4.isActive)) {
              const delay = this.getAttribute(attributes$4.isActive) === 'true' ? 0 : settings$2[this.type].timing.delay;
              this.setAnimationDelay(delay);
              return;
            }

            // Remove delay as soon as animation on load/scroll ends to negate delayed animations on mouseleave
            this.setAnimationDelay(0);
          }

          setAnimationDelay(number = 0) {
            if (this.animation.effect.getTiming().delay !== number) {
              this.animation.effect.updateTiming({delay: number});
              this.bindAnimation('delay');
            }
          }

          modifyDefaults(usage = 'mouseenter', animation) {
            if (!animation) animation = this.animation;

            // Modify the set of keyframes or timing properties of an existing animation on "mouseenter" event
            if (usage === 'mouseenter') {
              // Replace keyframes if the type contains a different set
              if (settings$2[this.type].keyframesHover) {
                animation.effect.setKeyframes(settings$2[this.type].keyframesHover);
              }

              if (this.type === 'highlight') {
                animation.effect.updateTiming({duration: 350, fill: 'both'});
              }
              if (this.type === 'highlight-color') {
                animation.effect.updateTiming({duration: 800});
              }
              if (this.type === 'underline') {
                animation.effect.updateTiming({duration: 400});
              }
              return;
            }

            // Modify the set of keyframes or timing properties of an existing animation on "mouseleave" event
            if (usage === 'mouseleave') {
              // Revert back to the default keyframes if previously changed on "mouseenter"
              if (settings$2[this.type].keyframesHover) {
                animation.effect.setKeyframes(settings$2[this.type].keyframes);
              }

              if (this.type === 'highlight' || this.type === 'highlight-color' || this.type === 'underline') {
                animation.effect.updateTiming({duration: settings$2[this.type].timing.duration});
              }
              return;
            }

            // Update delays when animation is executed in a Flickity slider
            if (usage === 'slider') {
              if (!theme.settings.animationsEnabled) {
                settings$2[this.type].timing.delay = 300;
                animation.effect.updateTiming({delay: settings$2[this.type].timing.delay});
              }

              if (this.closest(selectors$6.flickityEnabled)) {
                const slideshowDelay = settings$2[this.type].timing.delay + 200;
                if (this.type === 'highlight') {
                  animation.effect.updateTiming({delay: slideshowDelay});
                }
              }
            }
          }

          bindAnimation(event = false) {
            if (!this.bind || !event) return;
            if (event === 'init') this.boundAnimation = this.bind.animate(settings$2[this.type].keyframes, settings$2[this.type].timing);
            if (event === 'pause') this.boundAnimation.pause();
            if (event === 'play') this.boundAnimation.play();
            if (event === 'cancel') this.boundAnimation.cancel();
            if (event === 'mouseenter') {
              this.modifyDefaults('mouseenter', this.boundAnimation);
              this.boundAnimation.reverse();
            }
            if (event === 'mouseleave') {
              this.modifyDefaults('mouseleave', this.boundAnimation);
              this.boundAnimation.reverse();
            }
            if (event === 'delay') {
              const delay = this.animation.effect.getTiming().delay;
              if (this.boundAnimation.effect.getTiming().delay !== delay) {
                this.boundAnimation.effect.updateTiming({delay: delay});
              }
            }
          }
        }
      );
    }

    const selectors$5 = {
      tooltip: '[data-tooltip]',
      tooltipContainer: '[data-tooltip-container]',
      tooltipArrow: '[data-tooltip-arrow]',
      aos: '[data-aos]',
    };

    const classes$4 = {
      root: 'tooltip-default',
      isAnimating: 'is-animating',
      visible: 'is-visible',
      hiding: 'is-hiding',
    };

    const attributes$3 = {
      aos: 'data-aos',
      tooltip: 'data-tooltip',
      tooltipContainer: 'data-tooltip-container',
      tooltipStopMouseEnter: 'data-tooltip-stop-mouseenter',
    };

    if (!customElements.get('tooltip-component')) {
      customElements.define(
        'tooltip-component',
        class Tooltip extends HTMLElement {
          constructor() {
            super();

            this.tooltip = this;
            if (!this.hasAttribute(attributes$3.tooltip)) {
              this.tooltip = this.querySelector(selectors$5.tooltip);
            }

            this.rootClass = classes$4.root;
            this.isAnimatingClass = classes$4.isAnimating;
            this.label = this.tooltip.getAttribute(attributes$3.tooltip);
            this.transitionSpeed = 200;
            this.hideTransitionTimeout = 0;
            this.animatedContainer = this.tooltip.closest(selectors$5.aos);
            this.addPinEvent = () => this.addPin();
            this.addPinMouseEvent = () => this.addPin(true);
            this.removePinEvent = (event) => window.theme.throttle(this.removePin(event), 50);
            this.removePinMouseEvent = (event) => this.removePin(event, true, true);
          }

          connectedCallback() {
            if (!document.querySelector(selectors$5.tooltipContainer)) {
              const tooltipTemplate = `<div class="${this.rootClass}__arrow"></div><div class="${this.rootClass}__inner"><div class="${this.rootClass}__text label-typography"></div></div>`;
              const tooltipElement = document.createElement('div');
              tooltipElement.className = `${this.rootClass} ${this.isAnimatingClass}`;
              tooltipElement.setAttribute(attributes$3.tooltipContainer, '');
              tooltipElement.innerHTML = tooltipTemplate;
              document.body.appendChild(tooltipElement);
            }

            this.tooltip.addEventListener('mouseenter', this.addPinMouseEvent);
            this.tooltip.addEventListener('mouseleave', this.removePinMouseEvent);
            this.tooltip.addEventListener('theme:tooltip:init', this.addPinEvent);
            document.addEventListener('theme:tooltip:close', this.removePinEvent);

            const tooltipTarget = document.querySelector(selectors$5.tooltipContainer);

            if (theme.settings.animationsEnabled && this.animatedContainer) {
              this.handleAnimationEnd = () => {
                tooltipTarget.classList.remove(classes$4.isAnimating);
              };
              this.handleTransitionEnd = (event) => {
                // This will fire the event when the last transition end
                if (event.propertyName === 'transform') {
                  tooltipTarget.classList.remove(classes$4.isAnimating);
                }
              };

              if (this.animatedContainer.getAttribute(attributes$3.aos) === 'hero') {
                // Used for PDP and Featured product section
                this.animatedContainer.addEventListener('animationend', this.handleAnimationEnd);
              } else {
                this.animatedContainer.addEventListener('transitionend', this.handleTransitionEnd);
              }
            }
          }

          addPin(stopMouseEnter = false) {
            const tooltipTarget = document.querySelector(selectors$5.tooltipContainer);

            if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(attributes$3.tooltipStopMouseEnter)) || !stopMouseEnter)) {
              const tooltipTargetArrow = tooltipTarget.querySelector(`.${this.rootClass}__arrow`);
              const tooltipTargetInner = tooltipTarget.querySelector(`.${this.rootClass}__inner`);
              const tooltipTargetText = tooltipTarget.querySelector(`.${this.rootClass}__text`);

              if (this.label.includes('ß')) {
                this.label = this.label.replace(/ß/g, '<span style="text-transform: lowercase;">ß</span>');
              }
              tooltipTargetText.innerHTML = this.label;

              const tooltipTargetWidth = tooltipTargetInner.offsetWidth;
              const tooltipRect = this.tooltip.getBoundingClientRect();
              const tooltipTop = tooltipRect.top;
              const tooltipWidth = tooltipRect.width;
              const tooltipHeight = tooltipRect.height;
              const tooltipTargetPositionTop = tooltipTop + tooltipHeight + window.scrollY;
              let tooltipTargetPositionLeft = tooltipRect.left - tooltipTargetWidth / 2 + tooltipWidth / 2;
              const tooltipLeftWithWidth = tooltipTargetPositionLeft + tooltipTargetWidth;
              const sideOffset = 24;
              const tooltipTargetWindowDifference = tooltipLeftWithWidth - window.theme.getWindowWidth() + sideOffset;

              if (tooltipTargetWindowDifference > 0) {
                tooltipTargetPositionLeft -= tooltipTargetWindowDifference;
              }

              if (tooltipTargetPositionLeft < 0) {
                tooltipTargetPositionLeft = 0;
              }

              tooltipTargetArrow.style.left = `${tooltipRect.left + tooltipWidth / 2}px`;
              tooltipTarget.style.setProperty('--tooltip-top', `${tooltipTargetPositionTop}px`);

              tooltipTargetInner.style.transform = `translateX(${tooltipTargetPositionLeft}px)`;

              tooltipTarget.classList.remove(classes$4.hiding);
              const onTooltipHiding = (event) => {
                if (event.target !== tooltipTargetInner) return;
                if (event.propertyName === 'transform' || event.propertyName === 'opacity') {
                  requestAnimationFrame(() => (tooltipTarget.style.transform = 'translate(0, -100%)'));
                }
                tooltipTarget.removeEventListener('transitionend', onTooltipHiding);
              };
              tooltipTarget.addEventListener('transitionend', onTooltipHiding);

              tooltipTarget.classList.add(classes$4.visible);

              document.addEventListener('theme:scroll', this.removePinEvent);
            }
          }

          removePin(event, stopMouseEnter = false, hideTransition = false) {
            const tooltipTarget = document.querySelector(selectors$5.tooltipContainer);
            const tooltipVisible = tooltipTarget.classList.contains(classes$4.visible);

            if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(attributes$3.tooltipStopMouseEnter)) || !stopMouseEnter)) {
              if (tooltipVisible && (hideTransition || event.detail.hideTransition)) {
                tooltipTarget.classList.add(classes$4.hiding);

                if (this.hideTransitionTimeout) {
                  clearTimeout(this.hideTransitionTimeout);
                }

                this.hideTransitionTimeout = setTimeout(() => {
                  tooltipTarget.classList.remove(classes$4.hiding);
                }, this.transitionSpeed);
              }

              tooltipTarget.classList.remove(classes$4.visible);

              document.removeEventListener('theme:scroll', this.removePinEvent);
            }
          }

          disconnectedCallback() {
            this.tooltip.removeEventListener('mouseenter', this.addPinMouseEvent);
            this.tooltip.removeEventListener('mouseleave', this.removePinMouseEvent);
            this.tooltip.removeEventListener('theme:tooltip:init', this.addPinEvent);
            document.removeEventListener('theme:tooltip:close', this.removePinEvent);
            document.removeEventListener('theme:scroll', this.removePinEvent);

            // Clean up animation event listeners
            if (this.animatedContainer) {
              this.animatedContainer.removeEventListener('animationend', this.handleAnimationEnd);
              this.animatedContainer.removeEventListener('transitionend', this.handleTransitionEnd);
            }
          }
        }
      );
    }

    class LoadVideoVimeo {
      constructor(container) {
        this.container = container;
        this.player = this.container.querySelector('[data-video-id]');

        if (this.player) {
          this.videoID = this.player.getAttribute('data-video-id');
          this.videoType = this.player.getAttribute('data-video-type');
          this.enableBackground = this.player.getAttribute('data-enable-background') === 'true';
          this.disableSound = this.player.getAttribute('data-enable-sound') === 'false';
          this.enableAutoplay = this.player.getAttribute('data-enable-autoplay') !== 'false';
          this.enableLoop = this.player.getAttribute('data-enable-loop') !== 'false';

          if (this.videoType == 'vimeo') {
            this.init();
          }
        }
      }

      init() {
        this.loadVimeoPlayer();
      }

      loadVimeoPlayer() {
        const oembedUrl = 'https://vimeo.com/api/oembed.json';
        const vimeoUrl = 'https://vimeo.com/' + this.videoID;
        let paramsString = '';
        const state = this.player;

        const params = {
          url: vimeoUrl,
          background: this.enableBackground,
          muted: this.disableSound,
          autoplay: this.enableAutoplay,
          loop: this.enableLoop,
        };

        for (let key in params) {
          paramsString += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }

        fetch(`${oembedUrl}?${paramsString}`)
          .then((response) => response.json())
          .then(function (data) {
            state.innerHTML = data.html;

            setTimeout(function () {
              state.parentElement.classList.add('loaded');
            }, 1000);
          })
          .catch(function () {
            console.log('error');
          });
      }
    }

    const players = [];

    class LoadVideoYT {
      constructor(container) {
        this.container = container;
        this.player = this.container.querySelector('[data-video-id]');

        if (this.player) {
          this.videoOptionsVars = {};
          this.videoID = this.player.getAttribute('data-video-id');
          this.videoType = this.player.getAttribute('data-video-type');
          if (this.videoType == 'youtube') {
            this.checkPlayerVisibilityFlag = this.player.getAttribute('data-check-player-visibility') === 'true';
            this.playerID = this.player.querySelector('[data-youtube-wrapper]') ? this.player.querySelector('[data-youtube-wrapper]').id : this.player.id;
            if (this.player.hasAttribute('data-hide-options')) {
              this.videoOptionsVars = {
                cc_load_policy: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                autohide: 0,
                controls: 0,
                branding: 0,
                showinfo: 0,
                rel: 0,
                fs: 0,
                wmode: 'opaque',
              };
            }

            this.init();

            this.container.addEventListener(
              'touchstart',
              function (e) {
                if (e.target.matches('.video-wrapper') || e.target.closest('.video-wrapper')) {
                  const playerID = e.target.querySelector('[data-video-id]').id;
                  players[playerID].playVideo();
                }
              },
              {passive: true}
            );
          }
        }
      }

      init() {
        if (window.isYoutubeAPILoaded) {
          this.loadYoutubePlayer();
        } else {
          // Load Youtube API if not loaded yet
          loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.loadYoutubePlayer());
        }
      }

      loadYoutubePlayer() {
        const defaultYoutubeOptions = {
          height: '720',
          width: '1280',
          playerVars: this.videoOptionsVars,
          events: {
            onReady: (event) => {
              const eventIframe = event.target.getIframe();
              const id = eventIframe.id;
              const enableSound = document.querySelector(`#${id}`).getAttribute('data-enable-sound') === 'true';

              if (enableSound) {
                event.target.unMute();
              } else {
                event.target.mute();
              }
              event.target.playVideo();

              if (this.checkPlayerVisibilityFlag) {
                this.checkPlayerVisibility(id);

                window.addEventListener(
                  'scroll',
                  window.theme.throttle(() => {
                    this.checkPlayerVisibility(id);
                  }, 150)
                );
              }
            },
            onStateChange: (event) => {
              // Loop video if state is ended
              if (event.data == 0) {
                event.target.playVideo();
              }
              if (event.data == 1) {
                // video is playing
                event.target.getIframe().parentElement.classList.add('loaded');
              }
            },
          },
        };

        const currentYoutubeOptions = {...defaultYoutubeOptions};
        currentYoutubeOptions.videoId = this.videoID;
        if (this.videoID.length) {
          YT.ready(() => {
            players[this.playerID] = new YT.Player(this.playerID, currentYoutubeOptions);
          });
        }
        window.isYoutubeAPILoaded = true;
      }

      checkPlayerVisibility(id) {
        let playerID;
        if (typeof id === 'string') {
          playerID = id;
        } else if (id.data != undefined) {
          playerID = id.data.id;
        } else {
          return;
        }

        const playerElement = document.getElementById(playerID + '-container');
        if (!playerElement) {
          return;
        }
        const player = players[playerID];
        const box = playerElement.getBoundingClientRect();
        let isVisible = visibilityHelper.isElementPartiallyVisible(playerElement) || visibilityHelper.isElementTotallyVisible(playerElement);

        // Fix the issue when element height is bigger than the viewport height
        if (box.top < 0 && playerElement.clientHeight + box.top >= 0) {
          isVisible = true;
        }

        if (isVisible && player && typeof player.playVideo === 'function') {
          player.playVideo();
        } else if (!isVisible && player && typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      }

      unload() {
        const playerID = 'youtube-' + this.container.getAttribute('data-section-id');
        if (!players[playerID]) {
          return;
        }
        players[playerID].destroy();
      }
    }

    class LoadNotification {
      constructor(popup, pswpElement) {
        this.popup = popup;
        this.pswpElement = pswpElement;
        this.notificationForm = null;
        this.notificationStopSubmit = true;
        this.sessionStorage = window.sessionStorage;
        const notificationWrapper = this.pswpElement.querySelector('[data-notification]');
        this.outerCloseEvent = (e) => {
          if (!notificationWrapper.contains(e.target)) {
            this.popup.close();
          }
        };

        this.init();
      }

      init() {
        this.popup.listen('preventDragEvent', (e, isDown, preventObj) => {
          preventObj.prevent = false;
        });

        const notificationFormSuccess = window.location.search.indexOf('?contact_posted=true') !== -1;
        this.notificationForm = this.pswpElement.querySelector('[data-notification-form]');
        const closeBtn = this.pswpElement.querySelector('[data-popup-close]');
        document.body.classList.add('notification-popup-visible');

        this.pswpElement.addEventListener('mousedown', () => {
          this.popup.framework.unbind(window, 'pointermove pointerup pointercancel', this.popup);
        });

        if (notificationFormSuccess) {
          this.pswpElement.classList.add('pswp--success');
        }

        this.notificationForm.addEventListener('submit', (e) => this.notificationSubmitEvent(e));

        // Custom closing events
        this.pswpElement.addEventListener('click', this.outerCloseEvent);

        closeBtn.addEventListener('click', () => {
          this.popup.close();
        });

        this.popup.listen('destroy', () => {
          this.notificationRemoveStorage();
          this.pswpElement.removeEventListener('click', this.outerCloseEvent);
          document.body.classList.remove('notification-popup-visible');
        });
      }

      notificationSubmitEvent(e) {
        if (this.notificationStopSubmit) {
          e.preventDefault();

          this.notificationRemoveStorage();
          this.notificationWriteStorage();
          this.notificationStopSubmit = false;
          this.notificationForm.submit();
        }
      }

      notificationWriteStorage() {
        if (this.sessionStorage !== undefined) {
          this.sessionStorage.setItem('notification_form_id', this.notificationForm.id);
        }
      }

      notificationRemoveStorage() {
        this.sessionStorage.removeItem('notification_form_id');
      }
    }

    const selectors$4 = {
      productXr: '[data-shopify-xr]',
      mediaGroup: '[data-product-single-media-group]',
      model3d: 'data-shopify-model3d-id',
    };

    class ProductModel extends window.theme.DeferredMedia {
      constructor() {
        super();
      }

      loadContent() {
        super.loadContent();

        this.modelId = this.element.dataset.modelId;
        this.xrButton = this.mediaContainer.closest(selectors$4.mediaGroup)?.parentElement.querySelector(selectors$4.productXr);

        Shopify.loadFeatures([
          {
            name: 'model-viewer-ui',
            version: '1.0',
            onLoad: this.setupModelViewerUI.bind(this),
          },
        ]);
      }

      setupModelViewerUI(errors) {
        if (errors) {
          console.warn(errors);
          return;
        }

        this.modelViewerUI = new Shopify.ModelViewerUI(this.element);
        this.setupModelViewerListeners();
      }

      setupModelViewerListeners() {
        this.mediaContainer.addEventListener('theme:media:visible', () => {
          this.xrButton.setAttribute(selectors$4.model3d, this.modelId);

          if (window.theme.touch) {
            return;
          }

          this.modelViewerUI.play();
          this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
        });

        this.mediaContainer.addEventListener('theme:media:hidden', () => {
          this.modelViewerUI.pause();
        });

        this.mediaContainer.addEventListener('xrLaunch', () => {
          this.modelViewerUI.pause();
        });

        this.element.addEventListener('load', () => {
          this.xrButton.setAttribute(selectors$4.model3d, this.modelId);
          this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
        });

        this.element.addEventListener('shopify_model_viewer_ui_toggle_play', () => {
          this.pauseOtherMedia();
          setTimeout(() => {
            // Timeout to trigger play event after pause events
            this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
          }, 50);
        });
        this.element.addEventListener('shopify_model_viewer_ui_toggle_pause', () => {
          this.mediaContainer.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
        });

        this.pauseOtherMedia();
      }
    }

    window.ProductModel = {
      loadShopifyXR() {
        Shopify.loadFeatures([
          {
            name: 'shopify-xr',
            version: '1.0',
            onLoad: this.setupShopifyXR.bind(this),
          },
        ]);
      },

      setupShopifyXR(errors) {
        if (errors) {
          console.warn(errors);
          return;
        }

        if (!window.ShopifyXR) {
          document.addEventListener('shopify_xr_initialized', () => this.setupShopifyXR());
          return;
        }

        document.querySelectorAll('[id^="ModelJson-"]').forEach((modelJSON) => {
          window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
          modelJSON.remove();
        });
        window.ShopifyXR.setupXRElements();
      },
    };

    window.addEventListener('DOMContentLoaded', () => {
      if (window.ProductModel) window.ProductModel.loadShopifyXR();
    });

    const selectors$3 = {
      addToCart: '[data-add-to-cart]',
      deferredMedia: '[data-deferred-media]',
      deferredMediaButton: '[data-deferred-media-button]',
      popupClose: '[data-popup-close]',
      quickViewInner: '[data-quick-view-inner]',
      quickViewItemHolder: '[data-quick-view-item-holder]',
      product: '[data-product]',
      productForm: '[data-product-form]',
      productMediaSlider: '[data-product-single-media-slider]',
      productMediaWrapper: '[data-product-single-media-wrapper]',
      productModel: '[data-model]',
      productJSON: '[data-product-json]',
      quickViewFootInner: '[data-quick-view-foot-inner]',
      shopTheLookThumb: '[data-shop-the-look-thumb]',
      quickViewFocus: '[data-quick-view-focus]',
    };

    const classes$3 = {
      hasMediaActive: 'has-media-active',
      isActive: 'is-active',
      isLoading: 'is-loading',
      mediaHidden: 'media--hidden',
      noOutline: 'no-outline',
      notificationPopupVisible: 'notification-popup-visible',
      popupQuickViewAnimateIn: 'popup-quick-view--animate-in',
      popupQuickViewAnimateOut: 'popup-quick-view--animate-out',
      popupQuickViewAnimated: 'popup-quick-view--animated',
      popupQuickView: 'popup-quick-view',
      jsQuickViewVisible: 'js-quick-view-visible',
      jsQuickViewFromCart: 'js-quick-view-from-cart',
      drawerOpen: 'js-drawer-open',
    };

    const attributes$2 = {
      id: 'id',
      mediaId: 'data-media-id',
      sectionId: 'data-section-id',
      handle: 'data-handle',
      loaded: 'loaded',
      quickViewOnboarding: 'data-quick-view-onboarding',
      hotspot: 'data-hotspot',
      hotspotRef: 'data-hotspot-ref',
    };

    const ids = {
      addToCartFormId: 'AddToCartForm--',
      addToCartId: 'AddToCart--',
    };

    class LoadQuickview {
      constructor(popup, pswpElement) {
        this.popup = popup;
        this.pswpElement = pswpElement;
        this.quickViewFoot = this.pswpElement.querySelector(selectors$3.quickViewFootInner);
        this.quickViewInner = this.pswpElement.querySelector(selectors$3.quickViewInner);
        this.product = this.pswpElement.querySelectorAll(selectors$3.product);
        this.flkty = [];
        this.deferredMedias = this.pswpElement.querySelectorAll(selectors$3.deferredMedia);
        this.buttonsShopTheLookThumb = this.pswpElement.querySelectorAll(selectors$3.shopTheLookThumb);
        this.quickViewItemHolders = this.pswpElement.querySelectorAll(selectors$3.quickViewItemHolder);
        this.popupCloseButtons = this.quickViewInner.querySelectorAll(selectors$3.popupClose);
        this.a11y = window.theme.a11y;

        // Store updated thumb images by hotspot reference
        this.thumbImages = {};

        // Cache for sibling swatch quickview item HTML keyed by product handle
        this.siblingCache = {};

        this.prevent3dModelSubmitEvent = (event) => this.prevent3dModelSubmit(event);
        this.closeOnAnimationEndEvent = (event) => this.closeOnAnimationEnd(event);
        this.closeOnEscapeEvent = (event) => this.closeOnEscape(event);

        this.outerCloseEvent = (event) => {
          if (!this.quickViewInner.contains(event.target) && !event.target.closest('[data-sibling-handle]')) {
            // Check if quickview has drawer
            const drawer = this.quickViewInner.nextElementSibling;
            if (drawer && drawer.contains(event.target)) return;

            this.closePopup(event);
          } else if (event.target.closest('[data-sibling-handle]')) {
            this.handleSiblingSwatchClick(event);
          }
        };

        this.product.forEach((item, index) => {
          const isQuickViewOnboarding = item.hasAttribute(attributes$2.quickViewOnboarding);

          if (!isQuickViewOnboarding) {
            this.initItems(item, index);
          }
        });

        this.init();
      }

      initEventListeners() {
        // Custom closing events
        this.popupCloseButtons.forEach((popupClose) => {
          popupClose.addEventListener('keyup', (event) => {
            if (event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER || event.code === theme.keyboardKeys.SPACE) {
              this.closePopup(event);
            }
          });

          popupClose.addEventListener('click', (event) => {
            this.closePopup(event);
          });
        });

        // 'Shop the look' thumbnails nav
        this.initShopTheLookListeners();
      }

      handleDraggable(slider, draggableStatus) {
        if (!slider) return;

        slider.options.draggable = Boolean(draggableStatus);
        slider.updateDraggable();
      }

      initItems(item, index) {
        this.addFormSuffix(item);
        this.initProductSlider(item, index);
        this.initShopifyXrLaunch(item);

        // Wrap tables
        window.theme.wrapElements(item);

        if (Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }

        item.classList.remove(classes$3.isLoading);
      }

      init() {
        // Prevent 3d models button redirecting to cart page when enabling/disabling the model a couple of times
        document.addEventListener('submit', this.prevent3dModelSubmitEvent);

        // Custom closing events
        this.pswpElement.addEventListener('click', this.outerCloseEvent);

        document.dispatchEvent(new CustomEvent('theme:popup:open', {bubbles: true}));

        this.popup.listen('preventDragEvent', (e, isDown, preventObj) => {
          preventObj.prevent = false;
        });

        this.pswpElement.addEventListener('mousedown', () => {
          this.popup.framework.unbind(window, 'pointermove pointerup pointercancel', this.popup);
        });

        // Opening event
        this.popup.listen('initialZoomInEnd', () => {
          document.body.classList.add(classes$3.jsQuickViewVisible);
          const multipleItems = this.quickViewItemHolders.length > 0;
          const quickViewFocus = this.quickViewInner.querySelector(selectors$3.quickViewFocus);
          const activeItem = this.quickViewInner.querySelector(`${selectors$3.quickViewItemHolder}.${classes$3.isActive}`);
          const quickView = multipleItems ? activeItem.querySelector(selectors$3.quickViewFocus) : quickViewFocus;

          this.a11y.trapFocus({
            container: quickView,
          });
        });

        this.pswpElement.addEventListener('animationend', this.closeOnAnimationEndEvent);

        this.popup.listen('destroy', () => {
          if (this.flkty.length > 0) {
            requestAnimationFrame(() => {
              this.flkty.forEach((slider) => slider.pausePlayer());
            });
          }
          document.body.classList.remove(classes$3.jsQuickViewVisible);
          document.removeEventListener('keyup', this.closeOnEscapeEvent);
          this.pswpElement.removeEventListener('click', this.outerCloseEvent);
          this.pswpElement.removeEventListener('animationend', this.closeOnAnimationEndEvent);
          document.removeEventListener('submit', this.prevent3dModelSubmitEvent);

          this.deferredMedias.forEach((deferredMedia) => {
            // Remove the 'loaded' attribute so the videos will can load properly when we reopening the quickview
            deferredMedia.removeAttribute(attributes$2.loaded);

            // Pause videos on closing the popup
            const media = deferredMedia.closest(selectors$3.productMediaWrapper);
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$3.mediaHidden);
          });
        });

        document.addEventListener('keyup', this.closeOnEscapeEvent);
        document.addEventListener('theme:cart:added', () => {
          if (this.pswpElement.classList.contains(classes$3.popupQuickView)) {
            this.pswpElement.classList.add(classes$3.popupQuickViewAnimateOut);
          }
        });

        this.animateInQuickview();
        this.initEventListeners();
      }

      handleSiblingSwatchClick(event) {
        const swatch = event.target.closest('[data-sibling-handle]');
        if (!swatch) return;

        event.preventDefault();

        const handle = swatch.dataset.siblingHandle;
        if (!handle) return;

        // Find the currently active quick view item instead of using closest
        const activeQuickViewItemHolder = this.pswpElement.querySelector('[data-quick-view-item-holder].is-active');
        const quickViewItem = activeQuickViewItemHolder ? activeQuickViewItemHolder.querySelector('[data-quick-view-item]') : swatch.closest('[data-quick-view-item]');

        // Serve from cache if available
        if (this.siblingCache[handle]) {
          const newQuickViewItem = document.createElement('div');
          newQuickViewItem.setAttribute('data-quick-view-item', '');
          newQuickViewItem.innerHTML = this.siblingCache[handle];

          if (quickViewItem) {
            const existingNav = quickViewItem.querySelector('[data-quick-view-nav]');
            if (existingNav) {
              const newQuickViewBody = newQuickViewItem.querySelector('[data-quick-view-body]');
              const newQuickViewBodyInner = newQuickViewItem.querySelector('[data-quick-view-body-inner]');
              if (newQuickViewBody && newQuickViewBodyInner) {
                const navClone = existingNav.cloneNode(true);
                newQuickViewBody.insertBefore(navClone, newQuickViewBodyInner);
              }
            }

            quickViewItem.innerHTML = newQuickViewItem.innerHTML;
            this.updateNavigationThumb(newQuickViewItem, activeQuickViewItemHolder);
            this.refreshPopup();
          }
          return;
        }

        fetch(`${theme.routes.root}products/${handle}?section_id=api-quickview`)
          .then((response) => response.text())
          .then((data) => {
            // Create a temporary element to parse the fetched HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;

            // Extract only the content inside the data-quick-view-item
            const newQuickViewItem = tempDiv.querySelector('[data-quick-view-item]');
            if (newQuickViewItem && quickViewItem) {
              // Cache the processed quick view item HTML for this handle
              this.siblingCache[handle] = newQuickViewItem.innerHTML;

              // Get the existing navigation from the old quickview item
              const existingNav = quickViewItem.querySelector('[data-quick-view-nav]');

              if (existingNav) {
                // Find the body element in the new content to prepend the navigation
                const newQuickViewBody = newQuickViewItem.querySelector('[data-quick-view-body]');
                const newQuickViewBodyInner = newQuickViewItem.querySelector('[data-quick-view-body-inner]');

                if (newQuickViewBody && newQuickViewBodyInner) {
                  // Clone the existing navigation and prepend it before the body inner
                  const navClone = existingNav.cloneNode(true);
                  newQuickViewBody.insertBefore(navClone, newQuickViewBodyInner);
                }
              }

              quickViewItem.innerHTML = newQuickViewItem.innerHTML;

              // Update the navigation thumb image
              this.updateNavigationThumb(newQuickViewItem, activeQuickViewItemHolder);
            }

            this.refreshPopup();
          })
          .catch((error) => console.log('error: ', error));
      }

      updateNavigationThumb(newQuickViewItem, activeQuickViewItemHolder) {
        if (!activeQuickViewItemHolder) return;

        // Get the hotspot attribute from the active item holder to identify which thumb to update
        const hotspotRef = activeQuickViewItemHolder.getAttribute('data-hotspot');
        if (!hotspotRef) return;
        // Get the featured media image (first visible image in the slider)
        const featuredImageWrapper = newQuickViewItem.querySelector('[data-product-single-media-wrapper]:not(.media--hidden)');

        if (!featuredImageWrapper) return;

        const featuredImageType = featuredImageWrapper.getAttribute('data-type');
        const featuredImage = featuredImageWrapper.querySelector('img');

        const isVideo = featuredImageType === 'video' || featuredImageType === 'external_video';
        const videoIcon = featuredImageWrapper.querySelector('.icon-media-video');
        const featuredPlaceholder = featuredImageWrapper.querySelector('.placeholder-svg--overlayed, .placeholder-svg');

        // Update ALL navigation thumbs with this hotspot-ref across all product navigations
        const allNavThumbs = this.pswpElement.querySelectorAll(`[data-shop-the-look-thumb][data-hotspot-ref="${hotspotRef}"]`);

        if (featuredImage) {
          // Store the updated thumb image data
          this.thumbImages[hotspotRef] = {
            src: featuredImage.src,
            srcset: featuredImage.srcset || '',
            alt: featuredImage.alt || '',
            isVideo,
            videoIconHTML: isVideo && videoIcon ? videoIcon.outerHTML : '',
            hasPlaceholder: false,
          };

          allNavThumbs.forEach((navThumb) => {
            const thumbContainer = navThumb.querySelector('.product-single__thumbnail') || navThumb.querySelector('.popup-quick-view__thumbnail');
            let thumbImage = navThumb.querySelector('.product-single__thumbnail-img');

            // If the thumb currently shows a placeholder (no img), rebuild the image element
            if (!thumbImage && thumbContainer) {
              thumbContainer.innerHTML = '';
              const imgEl = document.createElement('img');
              imgEl.className = 'product-single__thumbnail-img';
              thumbContainer.appendChild(imgEl);
              thumbImage = imgEl;
            }

            // Update image attributes (new or existing)
            if (thumbImage) {
              thumbImage.src = featuredImage.src;
              if (featuredImage.srcset) {
                thumbImage.srcset = featuredImage.srcset;
              }
              if (featuredImage.alt) {
                thumbImage.alt = featuredImage.alt;
              }
            }

            // Handle video icon
            if (thumbContainer) {
              const existingIcon = thumbContainer.querySelector('.icon-media-video');
              if (existingIcon) existingIcon.remove();
              if (isVideo && videoIcon) {
                thumbContainer.insertAdjacentHTML('beforeend', videoIcon.outerHTML);
              }
            }
          });
        } else if (featuredPlaceholder) {
          // Store placeholder state
          this.thumbImages[hotspotRef] = {
            hasPlaceholder: true,
            placeholderHTML: featuredPlaceholder.outerHTML,
            isVideo: false,
            videoIconHTML: '',
          };

          allNavThumbs.forEach((navThumb) => {
            const thumbContainer = navThumb.querySelector('.product-single__thumbnail') || navThumb.querySelector('.popup-quick-view__thumbnail');
            if (!thumbContainer) return;
            // Remove any existing video icon
            const existingIcon = thumbContainer.querySelector('.icon-media-video');
            if (existingIcon) existingIcon.remove();
            // Replace content with placeholder only
            thumbContainer.innerHTML = featuredPlaceholder.outerHTML;
          });
        }
      }

      refreshPopup() {
        this.quickViewFoot = this.pswpElement.querySelector(selectors$3.quickViewFootInner);
        this.quickViewInner = this.pswpElement.querySelector(selectors$3.quickViewInner);
        this.flkty = [];
        this.deferredMedias = this.pswpElement.querySelectorAll(selectors$3.deferredMedia);
        this.buttonsShopTheLookThumb = this.pswpElement.querySelectorAll(selectors$3.shopTheLookThumb);
        this.quickViewItemHolders = this.pswpElement.querySelectorAll(selectors$3.quickViewItemHolder);
        this.popupCloseButtons = this.quickViewInner.querySelectorAll(selectors$3.popupClose);

        // Find the currently active product instead of just the first one
        const activeQuickViewItemHolder = this.pswpElement.querySelector('[data-quick-view-item-holder].is-active');
        const activeProduct = activeQuickViewItemHolder ? activeQuickViewItemHolder.querySelector(selectors$3.product) : this.pswpElement.querySelector(selectors$3.product);

        this.initItems(activeProduct, 0);
        this.initEventListeners();
      }

      initShopTheLookListeners() {
        this.buttonsShopTheLookThumb?.forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();

            const thumb = event.target.matches(selectors$3.shopTheLookThumb) ? event.target : event.target.closest(selectors$3.shopTheLookThumb);
            const holder = this.pswpElement.querySelector(`[${attributes$2.hotspot}="${thumb.getAttribute(attributes$2.hotspotRef)}"]`);
            const quickView = holder.querySelector(selectors$3.quickViewFocus);

            if (thumb.classList.contains(classes$3.isActive) || !holder) return;

            // Handle sliders
            if (this.flkty.length > 0) {
              requestAnimationFrame(() => {
                this.flkty.forEach((slider) => {
                  slider.resize();

                  const allMediaItems = this.quickViewInner.querySelectorAll(selectors$3.productMediaWrapper);

                  // Pause all media
                  if (allMediaItems.length) {
                    allMediaItems.forEach((media) => {
                      media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
                      media.classList.add(classes$3.mediaHidden);
                    });
                  }
                });
              });
            }

            // Active Quick View item class toggle
            holder.classList.add(classes$3.isActive);

            this.quickViewItemHolders.forEach((element) => {
              if (element !== holder) {
                element.classList.remove(classes$3.isActive);
              }
            });

            // Restore ALL stored thumb images/icons/placeholders in the current navigation
            // Since each product has its own complete navigation, we need to update all thumbs
            Object.keys(this.thumbImages).forEach((hotspotRef) => {
              const stored = this.thumbImages[hotspotRef];
              // Find the thumb in the current navigation that corresponds to this hotspot
              const currentNavThumb = holder.querySelector(`[data-shop-the-look-thumb][data-hotspot-ref="${hotspotRef}"]`);

              if (!currentNavThumb) return;

              const thumbContainer = currentNavThumb.querySelector('.product-single__thumbnail') || currentNavThumb.querySelector('.popup-quick-view__thumbnail');
              if (!thumbContainer) return;

              // Always remove existing video icon
              const existingIcon = thumbContainer.querySelector('.icon-media-video');
              if (existingIcon) existingIcon.remove();

              if (stored.hasPlaceholder) {
                // If we previously stored placeholder, but now switching to another product
                // do not lock the container; allow normal image update path below.
                // Clear placeholder content to make room for image/icon
                thumbContainer.innerHTML = '';
              }

              let thumbImage = thumbContainer.querySelector('.product-single__thumbnail-img');
              if (!thumbImage) {
                const imgEl = document.createElement('img');
                imgEl.className = 'product-single__thumbnail-img';
                thumbContainer.appendChild(imgEl);
                thumbImage = imgEl;
              }
              if (thumbImage) {
                thumbImage.src = stored.src;
                if (stored.srcset) {
                  thumbImage.srcset = stored.srcset;
                }
                if (stored.alt) {
                  thumbImage.alt = stored.alt;
                }
              }

              if (stored.isVideo && stored.videoIconHTML) {
                thumbContainer.insertAdjacentHTML('beforeend', stored.videoIconHTML);
              }
            });

            this.a11y.trapFocus({
              container: quickView,
            });
          });
        });
      }

      // Prevents the 3d model buttons submitting the form
      prevent3dModelSubmit(event) {
        if (event.submitter.closest(selectors$3.deferredMedia) && event.submitter.closest(selectors$3.productForm)) {
          event.preventDefault();
        }
      }

      closeQuickviewOnMobile() {
        if (window.innerWidth < window.theme.sizes.large && document.body.classList.contains(classes$3.jsQuickViewVisible)) {
          this.popup.close();
        }
      }

      animateInQuickview() {
        this.pswpElement.classList.add(classes$3.popupQuickViewAnimateIn);

        this.quickViewFoot.addEventListener('animationend', (event) => {
          this.handleAnimatedState(event);
        });

        // Mobile
        this.pswpElement.addEventListener('animationend', (event) => {
          this.handleAnimatedState(event, true);
        });
      }

      handleAnimatedState(event, isMobileAnimation = false) {
        if (event.animationName == 'quickViewAnimateInUp') {
          if (isMobileAnimation && window.innerWidth >= window.theme.sizes.small) {
            // Checks mobile animation but it's not mobile screen size
            return;
          }

          this.pswpElement.classList.add(classes$3.popupQuickViewAnimated);
          this.pswpElement.classList.remove(classes$3.popupQuickViewAnimateIn);
          document.body.classList.remove(classes$3.jsQuickViewFromCart); // Clear the class that we are adding in quick-view-popup.js when the animation ends

          removeLoadingClassFromLoadedImages(this.pswpElement); // Remove loading class from images
        }
      }

      closePopup(event) {
        event?.preventDefault();
        const isNavDrawerOpen = document.body.classList.contains(classes$3.drawerOpen);

        if (isNavDrawerOpen) {
          const drawer = document.querySelector('drawer-element.is-open');
          if (typeof drawer.close === 'function') drawer.close();
        }

        this.pswpElement.classList.add(classes$3.popupQuickViewAnimateOut); // Adding this class triggers the 'animationend' event which calls closeOnAnimationEndEvent()
      }

      closeOnAnimationEnd(event) {
        if (event.animationName == 'quickViewAnimateOutRight' || event.animationName == 'quickViewAnimateOutDown') {
          this.popup.template.classList.remove(classes$3.popupQuickViewAnimateOut, classes$3.popupQuickViewAnimated);
          this.popup.close();
          document.dispatchEvent(new CustomEvent('theme:quickview:closed'));
        }
      }

      closeOnEscape(event) {
        const isQuickViewVisible = document.body.classList.contains(classes$3.jsQuickViewVisible);
        const isNotificationVisible = document.body.classList.contains(classes$3.notificationPopupVisible);

        if (event.code === theme.keyboardKeys.ESCAPE && isQuickViewVisible && !isNotificationVisible) {
          this.closePopup(event);
        }
      }

      initProductSlider(item, index) {
        const slider = item.querySelector(selectors$3.productMediaSlider);
        const mediaItems = item.querySelectorAll(selectors$3.productMediaWrapper);

        if (mediaItems.length > 1) {
          const itemSlider = new window.theme.Flickity(slider, {
            wrapAround: true,
            cellAlign: 'left',
            pageDots: false,
            prevNextButtons: true,
            adaptiveHeight: false,
            pauseAutoPlayOnHover: false,
            selectedAttraction: 0.2,
            friction: 1,
            autoPlay: false,
            on: {
              ready: () => {
                // This resize should happen when the show animation of the PhotoSwipe starts and after PhotoSwipe adds the custom 'popup--quickview' class with the mainClass option.
                // This class is changing the slider width with CSS and looks like this is happening after the slider loads which is breaking it. That's why we need to call the resize() method here.
                requestAnimationFrame(() => {
                  itemSlider.resize();
                });
              },
              settle: () => {
                const currentSlide = itemSlider.selectedElement;
                const mediaId = currentSlide.getAttribute(attributes$2.mediaId);

                this.switchMedia(item, mediaId);
              },
            },
          });

          this.flkty.push(itemSlider);

          // Toggle flickity draggable functionality based on media play/pause state
          if (mediaItems.length) {
            mediaItems.forEach((element) => {
              element.addEventListener('theme:media:play', () => {
                this.handleDraggable(this.flkty[index], false);
                element.closest(selectors$3.productMediaSlider).classList.add(classes$3.hasMediaActive);
              });

              element.addEventListener('theme:media:pause', () => {
                this.handleDraggable(this.flkty[index], true);
                element.closest(selectors$3.productMediaSlider).classList.remove(classes$3.hasMediaActive);
              });
            });
          }

          // iOS smooth scrolling fix
          window.theme.flickitySmoothScrolling(slider);
        }
      }

      switchMedia(item, mediaId) {
        const allMediaItems = this.quickViewInner.querySelectorAll(selectors$3.productMediaWrapper);
        const selectedMedia = item.querySelector(`${selectors$3.productMediaWrapper}[${attributes$2.mediaId}="${mediaId}"]`);
        const isFocusEnabled = !document.body.classList.contains(classes$3.noOutline);

        // Pause other media
        if (allMediaItems.length) {
          allMediaItems.forEach((media) => {
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$3.mediaHidden);
          });
        }

        if (isFocusEnabled) {
          selectedMedia.focus();
        }

        selectedMedia.closest(selectors$3.productMediaSlider).classList.remove(classes$3.hasMediaActive);
        selectedMedia.classList.remove(classes$3.mediaHidden);
        selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});

        // If media is not loaded, trigger poster button click to load it
        const deferredMedia = selectedMedia.querySelector(selectors$3.deferredMedia);
        if (deferredMedia && deferredMedia.getAttribute(attributes$2.loaded) !== 'true') {
          selectedMedia.querySelector(selectors$3.deferredMediaButton).dispatchEvent(new Event('click'));
        }
      }

      initShopifyXrLaunch(item) {
        document.addEventListener('shopify_xr_launch', () => {
          const currentMedia = item.querySelector(`${selectors$3.productModel}:not(.${classes$3.mediaHidden})`);
          currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
        });
      }

      addFormSuffix(item) {
        const sectionId = item.getAttribute(attributes$2.sectionId);
        const productObject = JSON.parse(item.querySelector(selectors$3.productJSON).innerHTML);

        const formSuffix = `${sectionId}-${productObject.handle}`;
        const productForm = item.querySelector(selectors$3.productForm);
        const addToCart = item.querySelector(selectors$3.addToCart);

        productForm.setAttribute(attributes$2.id, ids.addToCartFormId + formSuffix);
        addToCart.setAttribute(attributes$2.id, ids.addToCartId + formSuffix);
      }
    }

    if (!customElements.get('product-model')) {
      customElements.define('product-model', ProductModel);
    }

    const settings$1 = {
      unlockScrollDelay: 400,
    };

    const selectors$2 = {
      popupContainer: '.pswp',
      popupCloseBtn: '.pswp__custom-close',
      popupIframe: 'iframe, video',
      popupCustomIframe: '.pswp__custom-iframe',
      popupThumbs: '.pswp__thumbs',
      popupButtons: '.pswp__button, .pswp__caption-close',
    };

    const classes$2 = {
      current: 'is-current',
      customLoader: 'pswp--custom-loader',
      customOpen: 'pswp--custom-opening',
      loader: 'pswp__loader',
      opened: 'pswp--open',
      popupCloseButton: 'pswp__button--close',
      notificationPopup: 'pswp--notification',
      quickviewPopup: 'popup-quick-view',
      isCartDrawerOpen: 'js-drawer-open-cart',
      quickViewAnimateOut: 'popup-quick-view--animate-out',
    };

    const attributes$1 = {
      dataOptionClasses: 'data-pswp-option-classes',
      dataVideoType: 'data-video-type',
    };

    const loaderHTML = `<div class="${classes$2.loader}"><div class="loader loader--image"><div class="loader__image"></div></div></div>`;

    class LoadPhotoswipe {
      constructor(items, options = '', templateIndex = 0, triggerButton = null) {
        this.items = items;
        this.triggerBtn = triggerButton;
        this.pswpElements = document.querySelectorAll(selectors$2.popupContainer);
        this.pswpElement = this.pswpElements[templateIndex];
        this.popup = null;
        this.popupThumbs = null;
        this.loadVideoYT = null;
        this.popupThumbsContainer = this.pswpElement.querySelector(selectors$2.popupThumbs);
        this.closeBtn = this.pswpElement.querySelector(selectors$2.popupCloseBtn);
        const defaultOptions = {
          history: false,
          focus: false,
          mainClass: '',
        };
        this.options = options !== '' ? options : defaultOptions;
        this.onCloseCallback = () => this.onClose();
        this.dispatchPopupInitEventCallback = () => this.dispatchPopupInitEvent();
        this.setCurrentThumbCallback = () => this.setCurrentThumb();
        this.loadingStateCallback = (event) => this.loadingState(event);
        this.a11y = window.theme.a11y;

        this.init();
      }

      init() {
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));

        this.pswpElement.classList.add(classes$2.customOpen);

        this.initLoader();

        loadScript({url: window.theme.assets.photoswipe})
          .then(() => this.loadPopup())
          .catch((e) => console.error(e));
      }

      initLoader() {
        if (this.pswpElement.classList.contains(classes$2.customLoader) && this.options !== '' && this.options.mainClass) {
          this.pswpElement.setAttribute(attributes$1.dataOptionClasses, this.options.mainClass);
          let loaderElem = document.createElement('div');
          loaderElem.innerHTML = loaderHTML;
          loaderElem = loaderElem.firstChild;
          this.pswpElement.appendChild(loaderElem);
        } else {
          this.pswpElement.setAttribute(attributes$1.dataOptionClasses, '');
        }
      }

      loadPopup() {
        const PhotoSwipe = window.themePhotoswipe.PhotoSwipe.default;
        const PhotoSwipeUI = window.themePhotoswipe.PhotoSwipeUI.default;

        this.pswpElement.classList.remove(classes$2.customOpen);

        this.popup = new PhotoSwipe(this.pswpElement, PhotoSwipeUI, this.items, this.options);

        this.popup.listen('afterInit', this.dispatchPopupInitEventCallback);
        this.popup.listen('imageLoadComplete', this.setCurrentThumbCallback);
        this.popup.listen('imageLoadComplete', this.loadingStateCallback);
        this.popup.listen('beforeChange', this.setCurrentThumbCallback);
        this.popup.listen('close', this.onCloseCallback);

        this.popup.init();

        this.initPopupCallback();
      }

      loadingState(event) {
        if (event === this.options.index && this.pswpElement.classList.contains(classes$2.customLoader)) {
          this.pswpElement.classList.remove(classes$2.customLoader);
        }
      }

      initPopupCallback() {
        if (this.isVideo) {
          this.hideUnusedButtons();
        }

        this.initVideo();
        this.thumbsActions();

        this.a11y.trapFocus({
          container: this.pswpElement,
        });

        if (this.pswpElement.classList.contains(classes$2.quickviewPopup)) {
          new LoadQuickview(this.popup, this.pswpElement);
        }

        if (this.pswpElement.classList.contains(classes$2.notificationPopup)) {
          new LoadNotification(this.popup, this.pswpElement);
        }

        this.closePopup = () => {
          if (this.pswpElement.classList.contains(classes$2.quickviewPopup)) {
            this.pswpElement.classList.add(classes$2.quickViewAnimateOut); // Close the Quickview popup accordingly
          } else {
            this.popup.close();
          }
        };

        if (this.closeBtn) {
          this.closeBtn.addEventListener('click', this.closePopup);
        }

        // Close Quick view popup when product added to cart
        document.addEventListener('theme:cart:added', this.closePopup);
      }

      dispatchPopupInitEvent() {
        if (this.triggerBtn) {
          this.triggerBtn.dispatchEvent(new CustomEvent('theme:popup:init', {bubbles: true}));
        }
      }

      initVideo() {
        const videoContainer = this.pswpElement.querySelector(selectors$2.popupCustomIframe);
        if (videoContainer) {
          const videoType = videoContainer.getAttribute(attributes$1.dataVideoType);
          this.isVideo = true;

          if (videoType == 'youtube') {
            this.loadVideoYT = new LoadVideoYT(videoContainer.parentElement);
          } else if (videoType == 'vimeo') {
            new LoadVideoVimeo(videoContainer.parentElement);
          }
        }
      }

      thumbsActions() {
        if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
          this.popupThumbsContainer.addEventListener('wheel', (e) => this.stopDisabledScroll(e));
          this.popupThumbsContainer.addEventListener('mousewheel', (e) => this.stopDisabledScroll(e));
          this.popupThumbsContainer.addEventListener('DOMMouseScroll', (e) => this.stopDisabledScroll(e));

          this.popupThumbs = this.pswpElement.querySelectorAll(`${selectors$2.popupThumbs} > *`);
          this.popupThumbs.forEach((element, i) => {
            element.addEventListener('click', (e) => {
              e.preventDefault();
              element.parentElement.querySelector(`.${classes$2.current}`).classList.remove(classes$2.current);
              element.classList.add(classes$2.current);
              this.popup.goTo(i);
            });
          });
        }
      }

      hideUnusedButtons() {
        const buttons = this.pswpElement.querySelectorAll(selectors$2.popupButtons);
        buttons.forEach((element) => {
          if (!element.classList.contains(classes$2.popupCloseButton)) {
            element.style.display = 'none';
          }
        });
      }

      stopDisabledScroll(e) {
        e.stopPropagation();
      }

      onClose() {
        const popupIframe = this.pswpElement.querySelector(selectors$2.popupIframe);
        if (popupIframe) {
          popupIframe.parentNode.removeChild(popupIframe);
        }

        if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
          while (this.popupThumbsContainer.firstChild) {
            this.popupThumbsContainer.removeChild(this.popupThumbsContainer.firstChild);
          }
        }

        this.pswpElement.setAttribute(attributes$1.dataOptionClasses, '');
        const loaderElem = this.pswpElement.querySelector(`.${classes$2.loader}`);
        if (loaderElem) {
          this.pswpElement.removeChild(loaderElem);
        }

        if (!document.body.classList.contains(classes$2.isCartDrawerOpen)) {
          this.a11y.removeTrapFocus();
        }

        if (this.loadVideoYT) {
          this.loadVideoYT.unload();
        }

        document.removeEventListener('theme:cart:added', this.closePopup);

        // Unlock scroll if only cart drawer is closed and there are no more popups opened
        setTimeout(() => {
          const recentlyOpenedPopups = this.recentlyOpenedPopupsCount();
          const isCartDrawerOpen = document.body.classList.contains(classes$2.isCartDrawerOpen);

          if (recentlyOpenedPopups === 0 && !isCartDrawerOpen) {
            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
          }
        }, settings$1.unlockScrollDelay);
      }

      recentlyOpenedPopupsCount() {
        let count = 0;

        this.pswpElements.forEach((popup) => {
          const isOpened = popup.classList.contains(classes$2.opened);

          if (isOpened) {
            count += 1;
          }
        });

        return count;
      }

      setCurrentThumb() {
        const hasThumbnails = this.popupThumbsContainer && this.popupThumbsContainer.firstChild;

        if (hasThumbnails) return;

        const lastCurrentThumb = this.pswpElement.querySelector(`${selectors$2.popupThumbs} > .${classes$2.current}`);
        if (lastCurrentThumb) {
          lastCurrentThumb.classList.remove(classes$2.current);
        }

        if (!this.popupThumbs) {
          return;
        }
        const currentThumb = this.popupThumbs[this.popup.getCurrentIndex()];
        currentThumb.classList.add(classes$2.current);
        this.scrollThumbs(currentThumb);
      }

      scrollThumbs(currentThumb) {
        const thumbsContainerLeft = this.popupThumbsContainer.scrollLeft;
        const thumbsContainerWidth = this.popupThumbsContainer.offsetWidth;
        const thumbsContainerPos = thumbsContainerLeft + thumbsContainerWidth;
        const currentThumbLeft = currentThumb.offsetLeft;
        const currentThumbWidth = currentThumb.offsetWidth;
        const currentThumbPos = currentThumbLeft + currentThumbWidth;

        if (thumbsContainerPos <= currentThumbPos || thumbsContainerPos > currentThumbLeft) {
          const currentThumbMarginLeft = parseInt(window.getComputedStyle(currentThumb).marginLeft);
          this.popupThumbsContainer.scrollTo({
            top: 0,
            left: currentThumbLeft - currentThumbMarginLeft,
            behavior: 'smooth',
          });
        }
      }
    }

    window.theme = window.theme || {};
    window.theme.LoadPhotoswipe = LoadPhotoswipe;

    const settings = {
      templateIndex: 0,
    };

    const options = {
      history: false,
      focus: false,
      mainClass: 'popup-quick-view pswp--not-close-btn',
      showHideOpacity: false, // we need that off to control the animation ourselves
      closeOnVerticalDrag: false,
      closeOnScroll: false,
      modal: false,
      escKey: false,
    };

    if (!customElements.get('quick-view-button')) {
      customElements.define(
        'quick-view-button',
        class QuickViewButton extends HTMLElement {
          constructor() {
            super();
            this.a11y = window.theme.a11y;
          }

          connectedCallback() {
            // Use requestAnimationFrame to ensure DOM is ready and properly connected
            requestAnimationFrame(() => {
              this.initializeButton();
            });
          }

          initializeButton() {
            this.buttonQuickView = this.closest('[data-button-quick-view]');
            this.container = this.closest('[data-section-type]');

            // Ensure the button exists and isn't already initialized
            if (!this.buttonQuickView || this.buttonQuickView.hasAttribute('data-initialized')) {
              return;
            }

            this.buttonQuickView.addEventListener('click', (event) => this.initPhotoswipe(event));
            this.buttonQuickView.addEventListener('theme:popup:init', () => {
              this.buttonQuickView.classList.remove('is-loading');

              if (this.buttonQuickView.hasAttribute('data-shop-the-look-quick-view')) {
                this.popupInit();
              }
            });
            this.buttonQuickView.setAttribute('data-initialized', '');
          }

          popupInit() {
            const hotspotId = this.buttonQuickView.getAttribute('data-hotspot');

            // Handle active Quick View item
            const holder = this.loadPhotoswipe.pswpElement.querySelector(`[data-hotspot="${hotspotId}"]`);
            const quickViewItemHolders = this.loadPhotoswipe.pswpElement.querySelectorAll('[data-quick-view-item-holder]');

            holder.classList.add('is-active');

            quickViewItemHolders.forEach((element) => {
              if (element !== holder) {
                element.classList.remove('is-active');
              }
            });

            // Handle pointer events
            this.toggleQuickViewButtonsLoadingClasses(true);
            this.toggleQuickViewThumbsLoadingClasses(true);

            const onAnimationInEnd = (event) => {
              // Animation on open
              if (event.animationName === 'quickViewAnimateInUp') {
                requestAnimationFrame(() => {
                  this.toggleQuickViewThumbsLoadingClasses(false);
                });
              }

              // Animation on close
              if (event.animationName === 'quickViewAnimateOutDown') {
                this.loadPhotoswipe.pswpElement.removeEventListener('animationend', onAnimationInEnd);
              }
            };

            this.loadPhotoswipe.pswpElement.addEventListener('animationend', onAnimationInEnd);

            this.loadPhotoswipe?.popup?.listen('destroy', () => {
              this.toggleQuickViewButtonsLoadingClasses(false);
              this.toggleQuickViewThumbsLoadingClasses(false);
            });
          }

          toggleQuickViewButtonsLoadingClasses(isLoading = true) {
            if (isLoading) {
              this.buttonQuickView.classList.add('is-loading');
              return;
            }

            this.buttonQuickView.classList.remove('is-loading');
          }

          toggleQuickViewThumbsLoadingClasses(isLoading = true) {
            this.buttonsShopTheLookThumb = this.loadPhotoswipe?.pswpElement.querySelectorAll('[data-shop-the-look-thumb]');

            if (isLoading) {
              this.buttonsShopTheLookThumb?.forEach((element) => {
                element.classList.add('is-loading');
              });
              return;
            }

            this.buttonsShopTheLookThumb?.forEach((element) => {
              element.classList.remove('is-loading');
            });
          }

          initPhotoswipe(event) {
            event.preventDefault();

            const button = event.target.matches('[data-button-quick-view]') ? event.target : event.target.closest('[data-button-quick-view]');
            const isMobile = window.innerWidth < theme.sizes.small;
            let quickViewVariant = '';
            let isShopTheLookPopupTrigger = false;

            if (button.hasAttribute('data-shop-the-look-quick-view')) {
              if (!isMobile) return;
              isShopTheLookPopupTrigger = true;
            }

            options.mainClass = 'popup-quick-view pswp--not-close-btn';
            button.classList.add('is-loading');

            // Add class js-quick-view-from-cart to change the default Quick view animation
            if (button.closest('[data-cart-drawer]')) {
              document.body.classList.add('js-quick-view-from-cart');
            }

            // Set the trigger element before calling trapFocus
            this.a11y.state.trigger = button;
            // Set main trigger element for inner popups (Size chart)
            this.a11y.state.mainTrigger = this.a11y.state.trigger;

            if (button.hasAttribute('data-variant-id')) {
              quickViewVariant = `&variant=${button.getAttribute('data-variant-id')}`;
            }

            const productUrl = `${theme.routes.root}products/${button.getAttribute('data-handle')}?section_id=api-quickview${quickViewVariant}`;

            if (isShopTheLookPopupTrigger) {
              options.mainClass = 'popup-quick-view popup-quick-view--shop-the-look pswp--not-close-btn';

              this.buttonQuickView.classList.add('is-loading');

              const XMLS = new XMLSerializer();
              const quickViewItemsTemplate = this.container.querySelector('[data-quick-view-items-template]').content.firstElementChild.cloneNode(true);

              const itemsData = XMLS.serializeToString(quickViewItemsTemplate);

              this.loadPhotoswipeWithTemplate(itemsData, button);
            } else {
              this.loadPhotoswipeFromFetch(productUrl, button);
            }
          }

          loadPhotoswipeWithTemplate(data, button) {
            const items = [
              {
                html: data,
              },
            ];

            this.loadPhotoswipe = new window.theme.LoadPhotoswipe(items, options, settings.templateIndex, button);
          }

          loadPhotoswipeFromFetch(url, button) {
            fetch(url)
              .then((response) => {
                return response.text();
              })
              .then((data) => {
                const items = [
                  {
                    html: data,
                  },
                ];

                this.loadPhotoswipe = new window.theme.LoadPhotoswipe(items, options, settings.templateIndex, button);
              })
              .catch((error) => console.log('error: ', error));
          }

          disconnectedCallback() {
            this.loadPhotoswipe?.popup?.close();
          }
        }
      );
    }

    const classes$1 = {
      noOutline: 'no-outline',
    };

    const selectors$1 = {
      inPageLink: '[data-skip-content]',
      linkesWithOnlyHash: 'a[href="#"]',
    };

    class Accessibility {
      constructor() {
        this.init();
      }

      init() {
        // this.a11y = a11y;

        // DOM Elements
        this.body = document.body;
        this.inPageLink = document.querySelector(selectors$1.inPageLink);
        this.linkesWithOnlyHash = document.querySelectorAll(selectors$1.linkesWithOnlyHash);

        // Flags
        this.isFocused = false;

        // A11Y init methods
        this.focusHash();
        this.bindInPageLinks();

        // Events
        this.clickEvents();
        this.focusEvents();
        this.focusEventsOff();
      }

      /**
       * Clicked events accessibility
       *
       * @return  {Void}
       */

      clickEvents() {
        if (this.inPageLink) {
          this.inPageLink.addEventListener('click', (event) => {
            event.preventDefault();
          });
        }

        if (this.linkesWithOnlyHash) {
          this.linkesWithOnlyHash.forEach((item) => {
            item.addEventListener('click', (event) => {
              event.preventDefault();
            });
          });
        }
      }

      /**
       * Focus events
       *
       * @return  {Void}
       */

      focusEvents() {
        document.addEventListener('keyup', (event) => {
          if (event.code !== theme.keyboardKeys.TAB) {
            return;
          }

          this.body.classList.remove(classes$1.noOutline);
          this.isFocused = true;
        });
      }

      /**
       * Focus events off
       *
       * @return  {Void}
       */

      focusEventsOff() {
        document.addEventListener('mousedown', () => {
          this.body.classList.add(classes$1.noOutline);
          this.isFocused = false;
        });
      }

      /**
       * Moves focus to an HTML element
       * eg for In-page links, after scroll, focus shifts to content area so that
       * next `tab` is where user expects. Used in bindInPageLinks()
       * eg move focus to a modal that is opened. Used in trapFocus()
       *
       * @param {Element} container - Container DOM element to trap focus inside of
       * @param {Object} options - Settings unique to your theme
       * @param {string} options.className - Class name to apply to element on focus.
       */

      forceFocus(element, options) {
        options = options || {};

        var savedTabIndex = element.tabIndex;

        element.tabIndex = -1;
        element.dataset.tabIndex = savedTabIndex;
        element.focus();
        if (typeof options.className !== 'undefined') {
          element.classList.add(options.className);
        }
        element.addEventListener('blur', callback);

        function callback(event) {
          event.target.removeEventListener(event.type, callback);

          element.tabIndex = savedTabIndex;
          delete element.dataset.tabIndex;
          if (typeof options.className !== 'undefined') {
            element.classList.remove(options.className);
          }
        }
      }

      /**
       * If there's a hash in the url, focus the appropriate element
       * This compensates for older browsers that do not move keyboard focus to anchor links.
       * Recommendation: To be called once the page in loaded.
       *
       * @param {Object} options - Settings unique to your theme
       * @param {string} options.className - Class name to apply to element on focus.
       * @param {string} options.ignore - Selector for elements to not include.
       */

      focusHash(options) {
        options = options || {};
        let hash = window.location.hash;

        if (typeof theme.settings.newHash !== 'undefined') {
          hash = theme.settings.newHash;
          window.location.hash = `#${hash}`;
        }
        const element = document.getElementById(hash.slice(1));

        // if we are to ignore this element, early return
        if (element && options.ignore && element.matches(options.ignore)) {
          return false;
        }

        if (hash && element) {
          this.forceFocus(element, options);
        }
      }

      /**
       * When an in-page (url w/hash) link is clicked, focus the appropriate element
       * This compensates for older browsers that do not move keyboard focus to anchor links.
       * Recommendation: To be called once the page in loaded.
       *
       * @param {Object} options - Settings unique to your theme
       * @param {string} options.className - Class name to apply to element on focus.
       * @param {string} options.ignore - CSS selector for elements to not include.
       */

      bindInPageLinks(options) {
        options = options || {};
        const links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));

        function queryCheck(selector) {
          return document.getElementById(selector) !== null;
        }

        return links.filter((link) => {
          if (link.hash === '#' || link.hash === '') {
            return false;
          }

          if (options.ignore && link.matches(options.ignore)) {
            return false;
          }

          if (!queryCheck(link.hash.substr(1))) {
            return false;
          }

          var element = document.querySelector(link.hash);

          if (!element) {
            return false;
          }

          link.addEventListener('click', () => {
            this.forceFocus(element, options);
          });

          return true;
        });
      }
    }

    const getScrollbarWidth = () => {
      // Creating invisible container
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll'; // forcing scrollbar to appear
      outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
      document.body.appendChild(outer);

      // Creating inner element and placing it in the container
      const inner = document.createElement('div');
      outer.appendChild(inner);

      // Calculating difference between container's full width and the child width
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

      // Removing temporary elements from the DOM
      outer.parentNode.removeChild(outer);

      return scrollbarWidth;
    };

    function fetchProduct(handle) {
      const requestRoute = `${theme.routes.root}products/${handle}.js`;

      return window
        .fetch(requestRoute)
        .then((response) => {
          return response.json();
        })
        .catch((e) => {
          console.error(e);
        });
    }

    const selectors = {
      swatch: '[data-swatch]',
      productBlock: '[data-product-block]',
      productImageHover: '[data-product-image-hover]',
      quickView: '[data-button-quick-view]',
      gridImage: '[data-grid-image]',
      link: '[data-grid-link]',
      swatchesMore: '[data-swatches-more]',
      sectionType: '[data-section-type]',
      slider: '[data-slider]',
    };

    const classes = {
      mediaVisible: 'product__media--featured-visible',
      mediaHoverVisible: 'product__media__hover-img--visible',
      noImage: 'swatch__link--no-image',
      noOutline: 'no-outline',
      isVisible: 'is-visible',
    };

    const attributes = {
      handle: 'data-swatch-handle',
      label: 'data-swatch-label',
      image: 'data-swatch-image',
      imageId: 'data-swatch-image-id',
      variant: 'data-swatch-variant',
      variantId: 'data-variant-id',
      variantSecondaryId: 'data-variant-secondary-id',
      loaded: 'data-loaded',
      href: 'href',
    };

    class GridSwatch extends HTMLElement {
      constructor() {
        super();

        this.handle = this.getAttribute(attributes.handle);
        this.label = this.getAttribute(attributes.label).trim().toLowerCase();
        this.outer = this.closest(selectors.productBlock);
        this.imageId = null;
        this.variant = null;
        this.hoverImages = [];

        fetchProduct(this.handle).then((product) => {
          this.product = product;
          this.colorOption = product.options.find((element) => {
            return element.name.toLowerCase() === this.label || null;
          });

          if (this.colorOption) {
            this.swatches = this.colorOption.values;
            this.init();
          }
        });
      }

      init() {
        this.swatchElements = this.querySelectorAll(selectors.swatch);

        this.swatchElements.forEach((el) => {
          this.variant = el.getAttribute(attributes.variant);
          this.imageId = el.getAttribute(attributes.imageId);
          const image = el.getAttribute(attributes.image);

          if (this.variant && this.outer) {
            const swatchLink = el.nextElementSibling;
            this.handleClicks(swatchLink);

            if (!image && swatchLink) {
              swatchLink.classList.add(classes.noImage);
            }
          }
        });

        this.handleShowMore();
      }

      handleShowMore() {
        this.initialHeight = this.offsetHeight;
        this.expandedHeight = this.initialHeight;
        const section = this.closest(selectors.sectionType);
        const moreLink = this.querySelector(selectors.swatchesMore);

        if (!moreLink) return;

        moreLink?.addEventListener('click', () => {
          this.classList.add(classes.isVisible);
        });

        section?.addEventListener('touchstart', (e) => {
          if (!this.contains(e.target)) {
            this.classList.remove(classes.isVisible);
            this.dispatchEvent(new Event('mouseleave', {bubbles: true}));
          }
        });

        this.addEventListener('mouseenter', () => {
          const onAnimationStart = (event) => {
            this.expandedHeight = this.offsetHeight;
            const slider = event.target.closest(selectors.slider);
            const heightDiffers = this.expandedHeight > this.initialHeight;

            if (heightDiffers && slider) {
              requestAnimationFrame(() => slider.dispatchEvent(new CustomEvent('theme:slider:resize', {bubbles: false})));
            }

            this.removeEventListener('animationstart', onAnimationStart);
          };

          this.addEventListener('animationstart', onAnimationStart);
        });

        this.addEventListener('mouseleave', () => {
          const onAnimationStart = (event) => {
            const slider = event.target.closest(selectors.slider);
            const heightDiffers = this.expandedHeight > this.initialHeight;

            if (heightDiffers && slider) {
              requestAnimationFrame(() => slider.dispatchEvent(new CustomEvent('theme:slider:resize', {bubbles: false})));
            }

            this.removeEventListener('animationstart', onAnimationStart);
          };

          this.addEventListener('animationstart', onAnimationStart);
        });
      }

      handleClicks(swatchLink) {
        // Change PGI featured image on swatch click
        swatchLink.addEventListener('click', (event) => {
          const isFocusEnabled = !document.body.classList.contains(classes.noOutline);
          const variantId = swatchLink.getAttribute(attributes.variant);

          if (!isFocusEnabled) {
            event.preventDefault();
            this.updateImagesAndLinksOnEvent(variantId);
          }
        });

        swatchLink.addEventListener('keyup', (event) => {
          const isFocusEnabled = !document.body.classList.contains(classes.noOutline);
          const variantId = swatchLink.getAttribute(attributes.variant);

          if (event.code !== theme.keyboardKeys.ENTER && event.code !== theme.keyboardKeys.NUMPADENTER) {
            return;
          }

          if (!isFocusEnabled) {
            event.preventDefault();
            swatchLink.dispatchEvent(new Event('mouseenter', {bubbles: true}));
            this.updateImagesAndLinksOnEvent(variantId);
          }
        });
      }

      updateImagesAndLinksOnEvent(variantId) {
        this.updateLinks(variantId);
        this.replaceImages(variantId);
      }

      updateLinks(variantId) {
        this.linkElements = this.outer.querySelectorAll(selectors.link);
        this.quickView = this.outer.querySelector(selectors.quickView);

        // Update links
        if (this.linkElements.length) {
          this.linkElements.forEach((element) => {
            const destination = getUrlWithVariant(element.getAttribute('href'), variantId);
            element.setAttribute('href', destination);
          });
        }

        // Change quickview variant with swatch one
        if (this.quickView && theme.settings.quickBuy === 'quick_buy') {
          this.quickView.setAttribute(attributes.variantId, variantId);
        }
      }

      replaceImages(id) {
        const imageSecondary = this.outer.querySelector(`[${attributes.variantSecondaryId}="${id}"]`);
        const gridImage = this.outer.querySelector(`[${attributes.variantId}="${id}"]`);
        const gridImages = this.outer.querySelectorAll(selectors.gridImage);
        const currentGridImage = [...gridImages].find((image) => image.classList.contains(classes.mediaVisible));

        // Add new loaded image and sync with the secondary image for smooth animation
        if (gridImage && this.imageId) {
          if (!imageSecondary || !currentGridImage) return;

          const onAnimationEnd = () => {c
            requestAnimationFrame(() => {
              currentGridImage.classList.remove(classes.mediaVisible);
              gridImage.classList.add(classes.mediaVisible);

              requestAnimationFrame(() => {
                imageSecondary.classList.remove(classes.mediaVisible);
              });
            });

            imageSecondary.removeEventListener('animationend', onAnimationEnd);
          };

          requestAnimationFrame(() => {
            imageSecondary.classList.add(classes.mediaVisible);
          });

          imageSecondary.addEventListener('animationend', onAnimationEnd);
        }

        // Change all hover images classes
        if (theme.settings.productGridHover === 'image') {
          this.hoverImages = this.outer.querySelectorAll(selectors.productImageHover);
        }

        if (this.hoverImages.length > 1) {
          this.hoverImages.forEach((hoverImage) => {
            hoverImage.classList.remove(classes.mediaHoverVisible);

            if (hoverImage.getAttribute(attributes.variantId) === id) {
              hoverImage.classList.add(classes.mediaHoverVisible);
            } else {
              this.hoverImages[0].classList.add(classes.mediaHoverVisible);
            }
          });
        }
      }
    }

    document.documentElement.style.setProperty('--scrollbar-width', `${getScrollbarWidth()}px`);

    document.addEventListener('DOMContentLoaded', function () {
      new Accessibility();

      if (!customElements.get('product-grid-item-swatch') && window.theme.settings.colorSwatchesType != 'disabled') {
        customElements.define('product-grid-item-swatch', GridSwatch);
      }

      // Safari smoothscroll polyfill
      const hasNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;

      if (!hasNativeSmoothScroll) {
        loadScript({url: theme.assets.smoothscroll});
      }
    });

})(themeVendor.ScrollLock);
