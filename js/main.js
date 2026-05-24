// Navbar shadow + active link tracking on scroll, throttled via rAF so we
// don't run DOM work on every scroll event.
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinkBySection = new Map(
  [...sections].map((section) => [
    section,
    document.querySelector(`.nav-link[href="#${section.id}"]`),
  ])
);

let scrollPending = false;

function onScroll() {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 50);

    const probe = y + 120;
    sections.forEach((section) => {
      const link = navLinkBySection.get(section);
      if (!link) return;
      const top = section.offsetTop;
      const inSection = probe >= top && probe < top + section.offsetHeight;
      link.classList.toggle('active', inSection);
    });

    scrollPending = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });

// Mobile nav: open/close + focus trap via inert on the rest of the page.
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navClose = document.getElementById('navClose');
const inertTargets = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);

function setNavOpen(open) {
  navToggle.classList.toggle('active', open);
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  inertTargets.forEach((el) => el.toggleAttribute('inert', open));
}

navToggle.addEventListener('click', () => setNavOpen(!navMenu.classList.contains('open')));
navClose.addEventListener('click', () => setNavOpen(false));

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) {
    setNavOpen(false);
    navToggle.focus();
  }
});

window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
  if (e.matches) setNavOpen(false);
});

// Reveal-on-scroll for content blocks.
const revealTargets = document.querySelectorAll(
  '.about-text, .about-image, .service-card, .gallery-item, .review-card, .info-card, .contact-form-wrap'
);

revealTargets.forEach((el) => el.classList.add('fade-in'));

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealTargets.forEach((el) => revealObserver.observe(el));

// Contact form: AJAX submit to FormSubmit, swap in a success card on 2xx.
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(contactForm);
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;

  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  fetch(contactForm.action, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  })
    .then((response) => {
      if (response.ok) {
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
      } else {
        throw new Error('Submission failed');
      }
    })
    .catch(() => {
      submitBtn.textContent = 'Error — Try Again';
      submitBtn.disabled = false;
      setTimeout(() => {
        submitBtn.textContent = originalLabel;
      }, 3000);
    });
});

// Horizontal scroll carousels: shared behavior for reviews + gallery.
function bindCarousel(trackSelector, leftBtnSelector, rightBtnSelector) {
  const track = document.querySelector(trackSelector);
  const left = document.querySelector(leftBtnSelector);
  const right = document.querySelector(rightBtnSelector);
  if (!track || !left || !right) return;

  const firstCard = track.firstElementChild;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
  const step = firstCard ? firstCard.getBoundingClientRect().width + gap : 320;

  left.addEventListener('click', () => track.scrollBy({ left: -step, behavior: 'smooth' }));
  right.addEventListener('click', () => track.scrollBy({ left: step, behavior: 'smooth' }));
}

bindCarousel('.reviews-track', '.carousel-btn-left', '.carousel-btn-right');
bindCarousel('.gallery-track', '.gallery-btn-left', '.gallery-btn-right');
