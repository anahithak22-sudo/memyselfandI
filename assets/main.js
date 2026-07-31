/* =========================================================
   Anahit Hakobyan — interactive resume
   Vanilla JS: command palette, role panels, skill filters,
   scroll reveal, scroll spy, reading progress.
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Role panels ───────────────────────────────────────
     Height is animated in JS: CSS cannot reliably transition
     to an intrinsic height, so we go through an explicit
     pixel value and settle back on `auto`. */
  function setRoleState(btn, open) {
    var role = btn.closest('.role');
    var body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!role || !body) return;

    btn.setAttribute('aria-expanded', String(open));
    role.classList.toggle('is-open', open);

    if (reduceMotion) {
      body.style.height = open ? 'auto' : '0px';
      return;
    }

    var target = body.scrollHeight;

    if (open) {
      body.style.height = target + 'px';
      body.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'height') return;
        body.removeEventListener('transitionend', done);
        if (role.classList.contains('is-open')) body.style.height = 'auto';
      });
    } else {
      body.style.height = target + 'px';
      void body.offsetHeight; /* force reflow so the next value animates */
      body.style.height = '0px';
    }
  }

  function initRoles() {
    Array.prototype.forEach.call(document.querySelectorAll('.role__toggle'), function (btn) {
      var open = btn.getAttribute('aria-expanded') === 'true';
      var body = document.getElementById(btn.getAttribute('aria-controls'));

      if (body) body.style.height = open ? 'auto' : '0px';
      if (open) btn.closest('.role').classList.add('is-open');

      btn.addEventListener('click', function () {
        setRoleState(btn, btn.getAttribute('aria-expanded') !== 'true');
      });
    });

    /* If a panel is left on a pixel height (interrupted transition), let it
       re-measure when the layout width changes. */
    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        Array.prototype.forEach.call(document.querySelectorAll('.role.is-open .role__body'), function (body) {
          body.style.height = 'auto';
        });
      }, 150);
    });
  }

  function openRole(id) {
    var body = document.getElementById(id);
    var role = body && body.closest('.role');
    var btn = role && role.querySelector('.role__toggle');
    if (btn && btn.getAttribute('aria-expanded') !== 'true') setRoleState(btn, true);
  }

  /* ── Skill filters ─────────────────────────────────── */
  function initFilters() {
    var buttons = document.querySelectorAll('.filter');
    var sets = document.querySelectorAll('.skillset');
    var count = document.getElementById('skillCount');
    if (!buttons.length || !sets.length) return;

    function apply(value) {
      var shown = 0;

      Array.prototype.forEach.call(sets, function (set) {
        var match = value === 'all' || set.dataset.group === value;
        set.hidden = !match;
        if (match) shown += set.querySelectorAll('.pill').length;
      });

      Array.prototype.forEach.call(buttons, function (btn) {
        var active = btn.dataset.filter === value;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      if (count) count.textContent = shown + (shown === 1 ? ' skill' : ' skills') + ' shown';
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () { apply(btn.dataset.filter); });
    });

    apply('all');
  }

  /* ── Scroll reveal ─────────────────────────────────── */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    /* Safety net: never leave content invisible if the observer never fires
       (headless renderers, background tabs, prerenderers). */
    window.setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        if (el.classList.contains('is-visible')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
      });
    }, 1200);
  }

  /* ── Scroll spy + topbar state + progress ──────────── */
  function initScroll() {
    var links = document.querySelectorAll('.nav__link');
    var topbar = document.getElementById('topbar');
    var progress = document.getElementById('scrollProgress');

    var map = {};
    var sections = [];
    Array.prototype.forEach.call(links, function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      map[id] = link;
      sections.push(section);
    });

    if (sections.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var link = map[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            Array.prototype.forEach.call(links, function (l) { l.classList.remove('is-active'); });
            link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });

      sections.forEach(function (s) { spy.observe(s); });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        if (topbar) topbar.classList.toggle('is-stuck', y > 8);

        if (progress) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
        }
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Command palette ───────────────────────────────── */
  function initPalette() {
    var root = document.getElementById('palette');
    var dialog = root && root.querySelector('.palette__dialog');
    var input = document.getElementById('paletteInput');
    var list = document.getElementById('paletteList');
    var empty = document.getElementById('paletteEmpty');
    var trigger = document.getElementById('paletteTrigger');
    if (!root || !dialog || !input || !list) return;

    var isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');
    if (!isMac) {
      Array.prototype.forEach.call(document.querySelectorAll('#paletteHint, #heroHint'), function (k) {
        k.textContent = 'Ctrl K';
      });
    }

    /* Index built from what is already in the DOM — content is never duplicated here. */
    var entries = [];

    Array.prototype.forEach.call(document.querySelectorAll('main section[id]'), function (section) {
      var heading = section.querySelector('.section__title');
      if (!heading) return;
      entries.push({ label: heading.textContent.trim(), group: 'Sections', target: '#' + section.id });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.role'), function (role) {
      var company = role.querySelector('.role__company');
      var title = role.querySelector('.role__title');
      var body = role.querySelector('.role__body');
      if (!company || !body) return;
      entries.push({
        label: company.textContent.trim(),
        meta: title ? title.textContent.trim() : '',
        group: 'Experience',
        target: '#experience',
        role: body.id
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.pill'), function (pill) {
      entries.push({ label: pill.textContent.trim(), group: 'Skills', target: '#skills' });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.cert__name'), function (cert) {
      entries.push({ label: cert.textContent.trim(), group: 'Certification & Participation', target: '#certification' });
    });

    entries.push({ label: 'Email Anahit', meta: 'anahit.hakobyan097@gmail.com', group: 'Contact', target: 'mailto:anahit.hakobyan097@gmail.com', external: true });
    entries.push({ label: 'LinkedIn profile', group: 'Contact', target: 'http://www.linkedin.com/in/anahit-hakobyan097', external: true });

    var results = [];
    var cursor = 0;
    var lastFocus = null;

    function score(entry, query) {
      var hay = (entry.label + ' ' + (entry.meta || '') + ' ' + entry.group).toLowerCase();
      if (!query) return 1;
      var idx = hay.indexOf(query);
      if (idx > -1) return 100 - Math.min(idx, 90);

      /* subsequence fallback so "vtb arm" still matches */
      var qi = 0;
      for (var i = 0; i < hay.length && qi < query.length; i++) {
        if (hay[i] === query[qi]) qi++;
      }
      return qi === query.length ? 1 : 0;
    }

    function render() {
      var query = input.value.trim().toLowerCase();

      var scored = entries.map(function (e, i) { return { entry: e, s: score(e, query), i: i }; })
        .filter(function (r) { return r.s > 0; });

      scored.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
      results = scored.slice(0, 40).map(function (r) { return r.entry; });

      list.textContent = '';
      cursor = 0;

      if (!results.length) {
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;

      var currentGroup = null;

      results.forEach(function (entry, i) {
        if (entry.group !== currentGroup) {
          currentGroup = entry.group;
          var head = document.createElement('li');
          head.className = 'palette__group';
          head.textContent = currentGroup;
          list.appendChild(head);
        }

        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'palette__item';

        var label = document.createElement('span');
        label.className = 'label';
        label.textContent = entry.label;
        btn.appendChild(label);

        if (entry.meta) {
          var meta = document.createElement('span');
          meta.className = 'meta';
          meta.textContent = entry.meta;
          btn.appendChild(meta);
        }

        var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrow.setAttribute('class', 'arrow');
        arrow.setAttribute('viewBox', '0 0 16 16');
        arrow.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M6.2 3.8 10.4 8l-4.2 4.2-1.1-1.1L8.2 8 5.1 4.9l1.1-1.1Z');
        arrow.appendChild(path);
        btn.appendChild(arrow);

        btn.addEventListener('click', function () { go(i); });
        btn.addEventListener('mousemove', function () { select(i); });

        li.appendChild(btn);
        list.appendChild(li);
      });

      select(0);
    }

    function items() { return list.querySelectorAll('.palette__item'); }

    function select(i) {
      var all = items();
      if (!all.length) return;
      cursor = Math.max(0, Math.min(i, all.length - 1));
      Array.prototype.forEach.call(all, function (el, n) {
        el.classList.toggle('is-selected', n === cursor);
      });
      var active = all[cursor];
      if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
    }

    function go(i) {
      var entry = results[i];
      if (!entry) return;

      if (entry.external) {
        close();
        if (entry.target.indexOf('http') === 0) {
          window.open(entry.target, '_blank', 'noopener');
        } else {
          window.location.href = entry.target;
        }
        return;
      }

      if (entry.role) openRole(entry.role);
      close();

      var target = document.querySelector(entry.target);
      if (!target) return;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function open() {
      if (!root.hidden) return;
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add('is-locked');
      input.value = '';
      render();
      input.focus();
    }

    function close() {
      if (root.hidden) return;
      root.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if (trigger) trigger.addEventListener('click', open);

    Array.prototype.forEach.call(root.querySelectorAll('[data-close]'), function (el) {
      el.addEventListener('click', close);
    });

    input.addEventListener('input', render);

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (root.hidden) open(); else close();
        return;
      }
      if (root.hidden) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); select(cursor + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); select(cursor - 1); }
      else if (e.key === 'Home') { e.preventDefault(); select(0); }
      else if (e.key === 'End') { e.preventDefault(); select(items().length - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); go(cursor); }
    });

    /* Focus trap */
    dialog.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = dialog.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ── Boot ──────────────────────────────────────────── */
  function init() {
    initRoles();
    initFilters();
    initReveal();
    initScroll();
    initPalette();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
