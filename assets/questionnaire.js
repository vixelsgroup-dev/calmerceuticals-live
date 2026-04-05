(function () {
  'use strict';

  document.querySelectorAll('[data-questionnaire]').forEach(function (root) {

    var allScreens = Array.from(root.querySelectorAll('[data-questionnaire-screen]'));

    if (!allScreens.length) return;

    function attr(el, name) {
      return (el.getAttribute(name) || '').trim();
    }

    /* ── State ─────────────────────────────────────────────────── */
    var answers   = {};   // { "Question text": "Selected answer value" }
    var path      = [];   // Filtered subset of allScreens for current flow
    var pathIndex = 0;

    /* ── Secondary branch (AND): e.g. gut axis + gender for Ultra Performance ── */
    function matchesSecondaryBranch(screen) {
      var p2 = attr(screen, 'data-branch-parent2');
      if (!p2) return true;
      var ans = answers[p2];
      var any2 = attr(screen, 'data-branch-any2');
      var trig2 = attr(screen, 'data-branch-trigger2');
      if (any2) {
        var parts2 = any2.split('|');
        for (var j = 0; j < parts2.length; j++) {
          if (ans === parts2[j].trim()) return true;
        }
        return false;
      }
      if (trig2) return ans === trig2;
      return true;
    }

    /* ── Build path ─────────────────────────────────────────────── */
    // Only includes screens whose branch conditions are satisfied by current answers.
    // Screens with no branch conditions are always included.
    function buildPath() {
      return allScreens.filter(function (screen) {
        var parent    = attr(screen, 'data-branch-parent');
        var trigger   = attr(screen, 'data-branch-trigger');
        var branchAny = attr(screen, 'data-branch-any');

        var primaryOk = true;
        if (branchAny && parent) {
          var ans = answers[parent];
          var parts = branchAny.split('|');
          primaryOk = false;
          for (var bi = 0; bi < parts.length; bi++) {
            if (ans === parts[bi].trim()) {
              primaryOk = true;
              break;
            }
          }
        } else if (!parent && !trigger) {
          primaryOk = true;
        } else if (parent && trigger) {
          primaryOk = answers[parent] === trigger;
        }

        if (!primaryOk) return false;
        return matchesSecondaryBranch(screen);
      });
    }

    /* ── Get question text for a screen ─────────────────────────── */
    // Collapse whitespace so keys match data-branch-parent (e.g. <br> in the title
    // must not produce a different string than the branch attribute).
    function getQuestion(screen) {
      var el = screen.querySelector('.questionnaire__question');
      if (!el) return 'screen-' + (attr(screen, 'data-screen-index') || '0');
      return el.textContent.replace(/\s+/g, ' ').trim();
    }

    /* Same pattern as collagen `data-option-url`: match gender answer to per-option URL attribute. */
    function resolveProductUrlFromGenderAttr(attrName) {
      var resolved = '';
      allScreens.forEach(function (screen) {
        if (!screen.querySelector('[data-questionnaire-option][' + attrName + ']')) return;
        var question = getQuestion(screen);
        var answer = answers[question];
        if (!answer) return;
        screen.querySelectorAll('[data-questionnaire-option]').forEach(function (btn) {
          var v = (btn.getAttribute('data-value') || '').trim();
          var u = (btn.getAttribute(attrName) || '').trim();
          if (v === answer && u) resolved = u;
        });
      });
      return resolved;
    }

    /* ── Mark an option as selected ─────────────────────────────── */
    function markOptionSelected(screen, value) {
      screen.querySelectorAll('[data-questionnaire-option]').forEach(function (btn) {
        var sel = (btn.getAttribute('data-value') || '').trim() === value;
        btn.classList.toggle('is-selected', sel);
        btn.setAttribute('aria-pressed', String(sel));
      });
    }

    /* ── Restore previously selected option when revisiting ──────── */
    function restoreSelection(screen) {
      var q = getQuestion(screen);
      var saved = answers[q];
      if (saved) markOptionSelected(screen, saved);
    }

    /* ── Scroll to questionnaire top ─────────────────────────────── */
    function scrollTop() {
      var top = root.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    /* ── Product CTA URL resolution ──────────────────────────────── */
    // Finds the first screen that has options with data-option-url (e.g. gender screen).
    // Looks up the user's answer for that screen and returns the matching URL.
    function resolveProductUrl(resultScreen) {
      var ctaPre = resultScreen.querySelector('[data-questionnaire-product-cta]');
      var hrefFallback = (ctaPre && ctaPre.getAttribute('href')) || '';
      var url =
        resultScreen.getAttribute('data-default-url') ||
        (resultScreen.dataset && resultScreen.dataset.defaultUrl) ||
        hrefFallback ||
        '';

      // Ultra Performance (gut axis): gender option `data-gender-product-url-ultra`, then section fallbacks on root.
      if (
        resultScreen.classList.contains('questionnaire__screen--product-result-ultra-women') ||
        resultScreen.classList.contains('questionnaire__screen--product-result-ultra-men')
      ) {
        var ultraU = resolveProductUrlFromGenderAttr('data-gender-product-url-ultra');
        if (!ultraU) {
          var uMen = (root.getAttribute('data-ultra-performance-url-men') || '').trim();
          var uWomen = (root.getAttribute('data-ultra-performance-url-women') || '').trim();
          if (resultScreen.classList.contains('questionnaire__screen--product-result-ultra-men')) {
            ultraU = uMen;
          } else {
            ultraU = uWomen;
          }
        }
        if (ultraU) url = ultraU;
        return url || hrefFallback || '#';
      }

      // Perimenopause (and other flows) set a dedicated CTA URL; skip gender-based collagen routing.
      if (resultScreen.getAttribute('data-skip-gender-product-url') === 'true') {
        return url || hrefFallback || '#';
      }

      // Collagen (skin): gender `data-option-url` per selected answer (getAttribute — same as ultra).
      allScreens.forEach(function (screen) {
        if (!screen.querySelector('[data-questionnaire-option][data-option-url]')) return;

        var question = getQuestion(screen);
        var answer = answers[question];
        if (!answer) return;

        screen.querySelectorAll('[data-questionnaire-option]').forEach(function (btn) {
          var v = (btn.getAttribute('data-value') || '').trim();
          var u = (btn.getAttribute('data-option-url') || '').trim();
          if (v === answer && u) url = u;
        });
      });

      return url || hrefFallback || '#';
    }

    /* ── Show a screen by path index ─────────────────────────────── */
    function showScreen(targetIdx) {
      path = buildPath();

      var idx = Math.max(0, Math.min(targetIdx, path.length - 1));

      allScreens.forEach(function (s) { s.classList.remove('is-active'); });
      path[idx].classList.add('is-active');
      pathIndex = idx;

      restoreSelection(path[idx]);

      // Set product CTA href when arriving at the result screen
      if (attr(path[idx], 'data-screen-type') === 'product_result') {
        var cta = path[idx].querySelector('[data-questionnaire-product-cta]');
        if (cta) cta.setAttribute('href', resolveProductUrl(path[idx]));
      }

      scrollTop();
    }

    /* ── Navigate forward ────────────────────────────────────────── */
    function advance() {
      showScreen(pathIndex + 1);
    }

    /* ── Navigate backward ───────────────────────────────────────── */
    function goBack() {
      if (pathIndex > 0) showScreen(pathIndex - 1);
    }

    /* ── Restart ─────────────────────────────────────────────────── */
    function restart() {
      answers   = {};
      pathIndex = 0;
      showScreen(0);
    }

    /* ── Option click ────────────────────────────────────────────── */
    allScreens.forEach(function (screen) {
      screen.querySelectorAll('[data-questionnaire-option]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!screen.classList.contains('is-active')) return;

          var value    = (btn.getAttribute('data-value') || '').trim();
          var question = getQuestion(screen);

          // Clear any previously stored answers that depended on old value for this question
          // (prevents stale branch data when user goes back and changes answer)
          if (answers[question] !== value) {
            var oldAnswer = answers[question];
            if (oldAnswer) {
              // Remove answers from screens that were gated by this question
              allScreens.forEach(function (s) {
                if (attr(s, 'data-branch-parent') === question || attr(s, 'data-branch-parent2') === question) {
                  var q = getQuestion(s);
                  delete answers[q];
                }
              });
            }
          }

          answers[question] = value;
          markOptionSelected(screen, value);

          // Auto-advance only for non-show_nav screens
          if (!screen.hasAttribute('data-show-nav')) {
            setTimeout(advance, 280);
          }
        });
      });
    });

    /* ── Back buttons (inline) ───────────────────────────────────── */
    root.querySelectorAll('[data-questionnaire-back]').forEach(function (btn) {
      btn.addEventListener('click', goBack);
    });

    /* ── Continue buttons ────────────────────────────────────────── */
    root.querySelectorAll('[data-questionnaire-continue]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var screen  = btn.closest('[data-questionnaire-screen]');
        var selected = screen
          ? screen.querySelector('[data-questionnaire-option].is-selected')
          : null;

        if (!selected) {
          // Briefly shake options to prompt a selection
          var opts = screen ? screen.querySelectorAll('[data-questionnaire-option]') : [];
          opts.forEach(function (o) {
            o.classList.add('is-nudge');
            setTimeout(function () { o.classList.remove('is-nudge'); }, 600);
          });
          return;
        }

        advance();
      });
    });

    function isValidEmail(value) {
      var v = (value || '').trim();
      if (!v) return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function clearEmailFieldError(emailInput, errEl) {
      if (emailInput) {
        emailInput.classList.remove('is-invalid');
        emailInput.removeAttribute('aria-invalid');
      }
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.remove('is-visible');
      }
    }

    function showEmailFieldError(emailInput, errEl, message) {
      if (emailInput) {
        emailInput.classList.add('is-invalid');
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
      }
      if (errEl) {
        errEl.textContent = message;
        errEl.classList.add('is-visible');
      }
    }

    root.querySelectorAll('[data-questionnaire-email]').forEach(function (input) {
      input.addEventListener('input', function () {
        var screen = input.closest('[data-questionnaire-screen]');
        var errEl  = screen ? screen.querySelector('[data-questionnaire-email-error]') : null;
        clearEmailFieldError(input, errEl);
      });
    });

    function questionnaireCustomerSignupSuccess(finalUrl) {
      var u = finalUrl || '';
      return (
        u.indexOf('customer_posted=true') !== -1 ||
        u.indexOf('customer_posted%3Dtrue') !== -1
      );
    }

    function questionnaireLooksLikeDuplicateOrUsedEmail(html) {
      var t = (html || '').toLowerCase();
      return (
        t.indexOf('already been taken') !== -1 ||
        t.indexOf('has already been taken') !== -1 ||
        t.indexOf('email has already') !== -1 ||
        t.indexOf('already subscribed') !== -1 ||
        t.indexOf('already registered') !== -1
      );
    }

    /* ── Email capture: submit (requires valid email) ────────────── */
    root.querySelectorAll('[data-questionnaire-email-submit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var screen     = btn.closest('[data-questionnaire-screen]');
        var emailInput = screen ? screen.querySelector('[data-questionnaire-email]') : null;
        var errEl      = screen ? screen.querySelector('[data-questionnaire-email-error]') : null;
        if (!emailInput) return;

        var raw = emailInput.value.trim();
        if (!raw) {
          showEmailFieldError(emailInput, errEl, 'Please enter your email address.');
          return;
        }
        if (!isValidEmail(raw)) {
          showEmailFieldError(emailInput, errEl, 'Please enter a valid email address.');
          return;
        }

        var customerForm = screen
          ? screen.querySelector('[data-questionnaire-customer-form]')
          : null;
        var hiddenEmail  = customerForm
          ? customerForm.querySelector('[data-questionnaire-customer-email-field]')
          : null;

        if (!customerForm || !hiddenEmail) {
          clearEmailFieldError(emailInput, errEl);
          answers['__email'] = raw;
          advance();
          return;
        }

        hiddenEmail.value = raw;

        var iframe = screen ? screen.querySelector('.questionnaire__customer-iframe') : null;
        if (!iframe || !iframe.name) {
          clearEmailFieldError(emailInput, errEl);
          answers['__email'] = raw;
          advance();
          return;
        }

        btn.classList.add('is-loading');
        btn.disabled = true;

        var dupMsg =
          'This email is already registered. Please enter a different email address.';
        var genericMsg = 'Something went wrong. Please try again in a moment.';

        function finishSignupUi() {
          btn.classList.remove('is-loading');
          btn.disabled = false;
          customerForm.removeAttribute('target');
        }

        var expectingSignupResult = true;
        var signupSafetyTimer = window.setTimeout(function () {
          if (!expectingSignupResult) return;
          expectingSignupResult = false;
          finishSignupUi();
          showEmailFieldError(emailInput, errEl, genericMsg);
        }, 60000);

        function onIframeLoad() {
          if (!expectingSignupResult) return;
          expectingSignupResult = false;
          window.clearTimeout(signupSafetyTimer);

          var href = '';
          var html = '';
          try {
            href = iframe.contentWindow.location.href || '';
          } catch (e1) {
            finishSignupUi();
            showEmailFieldError(emailInput, errEl, genericMsg);
            return;
          }
          try {
            if (iframe.contentDocument && iframe.contentDocument.body) {
              html = iframe.contentDocument.body.innerHTML || '';
            }
          } catch (e2) {}

          if (questionnaireCustomerSignupSuccess(href)) {
            finishSignupUi();
            clearEmailFieldError(emailInput, errEl);
            answers['__email'] = raw;
            advance();
            return;
          }
          if (questionnaireLooksLikeDuplicateOrUsedEmail(html)) {
            finishSignupUi();
            showEmailFieldError(emailInput, errEl, dupMsg);
            return;
          }
          finishSignupUi();
          showEmailFieldError(emailInput, errEl, dupMsg);
        }

        iframe.addEventListener('load', onIframeLoad, { once: true });
        customerForm.setAttribute('target', iframe.name);
        customerForm.submit();
      });
    });

    /* ── Email capture: skip → same next step as submit (product result) ── */
    root.querySelectorAll('[data-questionnaire-email-skip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var screen     = btn.closest('[data-questionnaire-screen]');
        var emailInput = screen ? screen.querySelector('[data-questionnaire-email]') : null;
        var errEl      = screen ? screen.querySelector('[data-questionnaire-email-error]') : null;
        clearEmailFieldError(emailInput, errEl);
        advance();
      });
    });

    /* ── Init ────────────────────────────────────────────────────── */
    path = buildPath();
    showScreen(0);
  });

}());
