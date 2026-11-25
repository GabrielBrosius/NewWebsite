/* ==========================================================================
   GABRIEL BROSIUS PORTFOLIO - CORE SCRIPTS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- NAVBAR SCROLL EFFECT ---
  const nav = document.querySelector('nav.fixed-nav');
  const checkScroll = () => {
    if (window.scrollY > window.innerHeight * 0.7) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll(); // Run once at load

  // --- MOBILE NAV TOGGLE ---
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuToggle.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- REVEAL ON SCROLL ANIMATIONS (Intersection Observer) ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Animates once
        }
      });
    }, {
      root: null,
      threshold: 0,
      rootMargin: '-100px 0px -50px 0px' // Offset to trigger before fully visible
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // --- HERO PHOTO ROTATION ---
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroCredit = document.querySelector('.hero-image-credit');
  const heroCreditLink = heroCredit ? heroCredit.querySelector('a') : null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroSlides.length > 1 && heroCreditLink && !reduceMotion) {
    let current = 0;
    let heroTimer = null;

    const showSlide = (next) => {
      heroSlides[current].classList.remove('active');
      heroSlides[next].classList.add('active');
      current = next;

      // Swap the "From ___" credit with a quick fade
      heroCredit.classList.add('is-changing');
      setTimeout(() => {
        const slide = heroSlides[current];
        heroCreditLink.setAttribute('href', slide.dataset.href);
        heroCreditLink.innerHTML = '';
        heroCreditLink.append('From ');
        const em = document.createElement('em');
        em.textContent = slide.dataset.title;
        heroCreditLink.append(em);
        heroCredit.classList.remove('is-changing');
      }, 400);
    };

    const startRotation = () => {
      if (heroTimer === null) {
        heroTimer = setInterval(() => showSlide((current + 1) % heroSlides.length), 3500);
      }
    };
    const stopRotation = () => {
      clearInterval(heroTimer);
      heroTimer = null;
    };

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stopRotation() : startRotation();
    });
    startRotation();
  }

  // --- GALLERY LIGHTBOX ---
  const galleryImages = Array.from(document.querySelectorAll('.project-gallery-grid img'));

  if (galleryImages.length > 0) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<button class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
      '<button class="lightbox-btn lightbox-prev" aria-label="Previous photo">&#8249;</button>' +
      '<img class="lightbox-img" alt="" />' +
      '<button class="lightbox-btn lightbox-next" aria-label="Next photo">&#8250;</button>' +
      '<div class="lightbox-count"></div>';
    document.body.appendChild(box);

    const boxImg = box.querySelector('.lightbox-img');
    const boxCount = box.querySelector('.lightbox-count');
    const closeBtn = box.querySelector('.lightbox-close');
    let index = 0;
    let lastFocus = null;

    if (galleryImages.length < 2) box.classList.add('single');

    const render = () => {
      const img = galleryImages[index];
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;
      boxCount.textContent = (index + 1) + ' / ' + galleryImages.length;
    };

    const openBox = (i) => {
      index = i;
      lastFocus = document.activeElement;
      render();
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const closeBox = () => {
      box.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    const step = (dir) => {
      index = (index + dir + galleryImages.length) % galleryImages.length;
      render();
    };

    galleryImages.forEach((img, i) => {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.addEventListener('click', () => openBox(i));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openBox(i);
        }
      });
    });

    closeBtn.addEventListener('click', closeBox);
    box.querySelector('.lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
    box.querySelector('.lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
    box.addEventListener('click', (e) => {
      // Clicking the dark background or the photo itself closes the viewer
      if (e.target === box || e.target === boxImg) closeBox();
    });

    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') closeBox();
      if (e.key === 'ArrowLeft' && galleryImages.length > 1) step(-1);
      if (e.key === 'ArrowRight' && galleryImages.length > 1) step(1);
    });

    // Swipe on touch screens
    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null || galleryImages.length < 2) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  // --- SCROLL SPY (ACTIVE NAV LINKS) ---
  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.nav-links .nav-link');
  const mobileSpyLinks = document.querySelectorAll('.mobile-nav .mobile-nav-link');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const activeSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          
          // Update Desktop Links
          desktopLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });

          // Update Mobile Links
          mobileSpyLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      root: null,
      rootMargin: '-40% 0px -55% 0px', // Focus middle region
      threshold: 0
    });

    sections.forEach(section => activeSectionObserver.observe(section));
  }

  // --- CONTACT FORM AJAX HANDLING ---
  const contactForm = document.getElementById('portfolio-contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      formStatus.className = 'form-status';
      formStatus.style.display = 'none';

      const formData = new FormData();
      formData.append('name', document.getElementById('form-name').value);
      formData.append('email', document.getElementById('form-email').value);
      formData.append('message', document.getElementById('form-message').value);
      formData.append('_subject', 'New message from portfolio');
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');

      try {
        const response = await fetch('https://formsubmit.co/5471086d1276d2e38e9760e6193e5507', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });

        if (response.ok) {
          formStatus.textContent = 'Message sent — talk soon.';
          formStatus.className = 'form-status success';
          formStatus.style.display = 'block';
          contactForm.reset();
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        formStatus.textContent = 'Something went wrong — try again or email directly.';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  // --- PROJECT STICKY TITLE ---
  const stickyTitle = document.querySelector('.sticky-project-title');
  if (stickyTitle) {
    const checkStickyScroll = () => {
      if (window.scrollY > window.innerHeight * 0.35) {
        stickyTitle.classList.add('visible');
      } else {
        stickyTitle.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', checkStickyScroll, { passive: true });
    checkStickyScroll(); // Run once at load
  }
});
