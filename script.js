/* edokan.in — site script v2 */
(function () {
  'use strict';

  // ----- Year in footer -----
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----- Sticky header on scroll -----
  var header = document.querySelector('.site-header');
  function onHeaderScroll() {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  // ----- Mobile menu toggle -----
  var toggle = document.querySelector('.mobile-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      });
    });
  }

  // ----- Active nav link based on scroll position -----
  var navLinks = document.querySelectorAll('.primary-nav .nav-link');
  var sections = Array.prototype.map.call(navLinks, function (link) {
    var id = link.getAttribute('href');
    if (id && id.charAt(0) === '#' && id.length > 1) {
      var el = document.querySelector(id);
      return el ? { id: id, el: el, link: link } : null;
    }
    return null;
  }).filter(Boolean);

  function setActiveNav() {
    var pos = window.scrollY + 120;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.offsetTop <= pos) current = sections[i];
    }
    navLinks.forEach(function (l) { l.classList.remove('active'); });
    if (current && current.link) current.link.classList.add('active');
  }
  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  // ----- Reveal on scroll -----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // ----- FAQ accordion (one open at a time) -----
  var faqs = document.querySelectorAll('.faq-item');
  faqs.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqs.forEach(function (other) {
          if (other !== item) other.removeAttribute('open');
        });
      }
    });
  });

  // ----- Mobile-only floating WhatsApp behaviour -----
  // On mobile (<=640px):
  //   - On load: show fully for 3s, then auto-hide
  //   - On scroll: show fully
  //   - On idle (scroll stopped ~2s): collapse to peek (5% visible)
  // On desktop: always visible, no JS state needed
  var waBtn = document.getElementById('floatingWa');
  var mqMobile = window.matchMedia('(max-width: 640px)');
  var peekTimer = null;
  var hideTimer = null;

  function isMobile() { return mqMobile.matches; }

  function clearTimers() {
    if (peekTimer) { clearTimeout(peekTimer); peekTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  function showWa(autoCollapseAfter) {
    if (!waBtn) return;
    if (!isMobile()) {
      waBtn.classList.remove('hidden', 'peek');
      waBtn.classList.add('visible');
      return;
    }
    clearTimers();
    waBtn.classList.remove('hidden');
    waBtn.classList.remove('peek');
    waBtn.classList.add('visible');
    if (typeof autoCollapseAfter === 'number') {
      peekTimer = setTimeout(collapseToPeek, autoCollapseAfter);
    }
  }

  function collapseToPeek() {
    if (!waBtn || !isMobile()) return;
    waBtn.classList.remove('visible', 'hidden');
    waBtn.classList.add('peek');
  }

  function hideWa() {
    if (!waBtn || !isMobile()) return;
    waBtn.classList.remove('visible', 'peek');
    waBtn.classList.add('hidden');
  }

  if (waBtn) {
    // Initial state
    if (isMobile()) {
      // mobile: show for 3 sec, then auto-hide completely
      waBtn.classList.add('visible');
      hideTimer = setTimeout(function () {
        hideWa();
      }, 3000);
    } else {
      waBtn.classList.add('visible');
    }

    // Reveal on tap (mobile)
    waBtn.addEventListener('click', function () {
      // Expand fully before opening so user sees the action
      if (isMobile()) showWa();
    });
    waBtn.addEventListener('mouseenter', function () {
      if (isMobile()) showWa();
    });
  }

  // ----- Scroll-driven UI: scroll-to-top + mobile WA visibility -----
  var scrollTopBtn = document.getElementById('scrollTop');
  var scrollIdleTimer = null;
  var lastScrollY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;

    // scroll-to-top show after 400px
    if (scrollTopBtn) {
      if (y > 400) scrollTopBtn.classList.add('visible');
      else scrollTopBtn.classList.remove('visible');
    }

    // mobile floating WA: show while scrolling
    if (waBtn && isMobile()) {
      // any meaningful scroll movement → show fully
      if (Math.abs(y - lastScrollY) > 2) {
        showWa();
        // After scroll stops for 1.5s, collapse to peek
        if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
        scrollIdleTimer = setTimeout(function () {
          collapseToPeek();
        }, 1500);
      }
    }
    lastScrollY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Scroll-to-top click
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      if (reduce) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // React to viewport changes (rotating phone etc.)
  function onResize() {
    if (!waBtn) return;
    if (!isMobile()) {
      waBtn.classList.remove('hidden', 'peek');
      waBtn.classList.add('visible');
      clearTimers();
    }
  }
  window.addEventListener('resize', onResize, { passive: true });

})();
