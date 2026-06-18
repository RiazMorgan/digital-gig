/**
 * Digital Gig — main.js
 * All interactions are passive, GPU-composited, and Core Web Vitals safe.
 * No layout-triggering reads inside animation frames.
 * No libraries. Vanilla JS only.
 */

'use strict';

/* ============================================================
   1. MOBILE NAV TOGGLE
   - Toggles .active on <nav> and the hamburger button
   - Closes on outside click and on Escape key
   - Updates aria-expanded for screen readers
   ============================================================ */
(function initMobileNav() {
  const toggle = document.getElementById('mobileToggle');
  const nav    = document.getElementById('navMenu');
  if (!toggle || !nav) return;

  function openNav() {
    nav.classList.add('active');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onEscape);
    document.addEventListener('click', onOutsideClick);
  }

  function closeNav() {
    nav.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onEscape);
    document.removeEventListener('click', onOutsideClick);
  }

  function onEscape(e) {
    if (e.key === 'Escape') closeNav();
  }

  function onOutsideClick(e) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    toggle.classList.contains('active') ? closeNav() : openNav();
  });

  // Close nav when any nav link is tapped (mobile UX)
  nav.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });
})();


/* ============================================================
   2. ACTIVE NAV LINK — highlight current section on scroll
   Uses IntersectionObserver (no scroll listener = no jank)
   ============================================================ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  // Map section id → nav link
  const linkMap = {};
  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      linkMap[href.slice(1)] = link;
    }
  });

  function setActive(id) {
    navLinks.forEach(function (l) { l.classList.remove('active'); });
    if (linkMap[id]) linkMap[id].classList.add('active');
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    {
      rootMargin: '-40% 0px -55% 0px', // fires when section is in the middle third of the viewport
      threshold: 0
    }
  );

  sections.forEach(function (s) { observer.observe(s); });
})();


/* ============================================================
   3. SCROLL-DRIVEN FADE-UP (IntersectionObserver)
   Adds .visible to elements with class .fade-up when they
   enter the viewport. CSS handles the actual transition.
   No transform reads inside rAF — CLS-safe.
   ============================================================ */
(function initFadeUp() {
  const targets = document.querySelectorAll('.fade-up');
  if (!targets.length) return;

  // Bail out if the user prefers reduced motion
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    targets.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target); // fire once only
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();


/* ============================================================
   4. STICKY HEADER — add .scrolled class after 60px
   Only touches class list (GPU composited box-shadow in CSS)
   Uses passive scroll listener to not block touch events
   ============================================================ */
(function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let ticking = false;

  function update() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();


/* ============================================================
   5. BACK-TO-TOP BUTTON
   Shows after 400px scroll. Smooth scrolls to top on click.
   ============================================================ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  let ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        if (window.scrollY > 400) {
          btn.classList.add('show');
        } else {
          btn.classList.remove('show');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ============================================================
   6. SMOOTH SCROLL FOR ALL ANCHOR LINKS
   Offsets for the sticky header height so sections aren't
   hidden underneath it.
   ============================================================ */
(function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').slice(1);
    if (!targetId) return; // href="#" — scroll to top without offset

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const header     = document.querySelector('.header');
    const headerH    = header ? header.getBoundingClientRect().height : 0;
    const targetTop  = target.getBoundingClientRect().top + window.scrollY - headerH - 12;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  });
})();


/* ============================================================
   7. CONTACT FORM — Web3Forms submission
   - Validates required fields client-side first
   - Submits to Web3Forms API
   - Shows success / error message
   - Resets form on success
   - Handles loading state on button
   ============================================================ */
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = document.getElementById('btnText');
  const btnIcon    = document.getElementById('btnIcon');
  const statusMsg  = document.getElementById('statusMessage');

  function showStatus(type, text) {
    statusMsg.textContent  = text;
    statusMsg.className    = 'message ' + type;
    statusMsg.style.display = 'block';

    // Scroll message into view on mobile
    statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-hide success after 6 seconds
    if (type === 'success') {
      setTimeout(function () {
        statusMsg.style.display = 'none';
      }, 6000);
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      btnText.textContent = 'Sending…';
      btnIcon.innerHTML   = '<span class="spinner"></span>';
    } else {
      btnText.textContent = 'Send Message';
      btnIcon.textContent = '✈️';
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Basic client-side validation (HTML5 handles most, this catches edge cases)
    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !message) {
      showStatus('error', 'Please fill in all fields before submitting.');
      return;
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    statusMsg.style.display = 'none';

    try {
      const data = new FormData(form);
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showStatus('success', '✓ Message sent! We\'ll be in touch within one business day.');
        form.reset();
      } else {
        showStatus('error', result.message || 'Something went wrong. Please try again or email us directly.');
      }
    } catch (err) {
      showStatus('error', 'Network error. Please check your connection and try again.');
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  });
})();


/* ============================================================
   8. PORTFOLIO CARD STAGGER
   Adds staggered delay to .fade-up cards inside .portfolio-grid
   so they animate in sequence rather than all at once.
   Delay is set via CSS custom property to avoid inline styles
   clashing with the transition defined in CSS.
   ============================================================ */
(function initPortfolioStagger() {
  const cards = document.querySelectorAll('.portfolio-grid .portfolio-card');
  cards.forEach(function (card, i) {
    card.style.transitionDelay = (i * 0.1) + 's';
  });
})();


/* ============================================================
   9. NAV SCROLL SHADOW
   Adds a subtle elevated shadow to the header as the user
   scrolls past the hero — purely visual polish.
   CSS .header.scrolled rule handles the actual styling.
   (Re-uses the .scrolled class from section 4 above.)
   ============================================================ */
// Already handled by the .scrolled class in initStickyHeader above.
// The CSS rule .header.scrolled can add extra shadow/border if desired.


/* ============================================================
   10. HERO IMAGE — lazy load polyfill fallback
   Modern browsers natively support loading="lazy".
   This is a no-op fallback for any browser that doesn't.
   ============================================================ */
(function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; // native support — done

  const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImgs.length) return;

  const observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        img.removeAttribute('loading');
        obs.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  lazyImgs.forEach(function (img) { observer.observe(img); });
})();


/* ============================================================
   11. CURRENT YEAR IN COPYRIGHT
   Keeps the footer year current without manual updates.
   ============================================================ */
(function initCopyrightYear() {
  const el = document.querySelector('.copyright');
  if (!el) return;
  el.textContent = el.textContent.replace(/\d{4}/, new Date().getFullYear());
})();
