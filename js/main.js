// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navMenu.classList.toggle('open');
});

const navClose = document.getElementById('navClose');
navClose.addEventListener('click', () => {
  navToggle.classList.remove('active');
  navMenu.classList.remove('open');
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navMenu.classList.remove('open');
  });
});

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');

function setActiveNav() {
  const scrollY = window.scrollY + 120;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

    if (navLink) {
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLink.classList.add('active');
      } else {
        navLink.classList.remove('active');
      }
    }
  });
}

window.addEventListener('scroll', setActiveNav);

// ===== SCROLL FADE-IN ANIMATION =====
function initFadeIn() {
  const elements = document.querySelectorAll(
    '.about-text, .about-image, .service-card, .gallery-item, .review-card, .info-card, .contact-form-wrap'
  );

  elements.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));
}

initFadeIn();

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);

  // Simple validation
  if (!formData.get('name') || !formData.get('email') || !formData.get('phone') || !formData.get('message')) {
    return;
  }

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  fetch(contactForm.action, {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
  })
  .then(response => {
    if (response.ok) {
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
    } else {
      submitBtn.textContent = 'Error — Try Again';
      submitBtn.disabled = false;
    }
  })
  .catch(() => {
    submitBtn.textContent = 'Error — Try Again';
    submitBtn.disabled = false;
  });
});

// ===== REVIEWS CAROUSEL =====
const reviewsTrack = document.querySelector('.reviews-track');
const btnLeft = document.querySelector('.carousel-btn-left');
const btnRight = document.querySelector('.carousel-btn-right');

if (reviewsTrack && btnLeft && btnRight) {
  const scrollAmount = 404; // card width + gap

  btnLeft.addEventListener('click', () => {
    reviewsTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    reviewsTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

// ===== GALLERY CAROUSEL =====
const galleryTrack = document.querySelector('.gallery-track');
const galleryBtnLeft = document.querySelector('.gallery-btn-left');
const galleryBtnRight = document.querySelector('.gallery-btn-right');

if (galleryTrack && galleryBtnLeft && galleryBtnRight) {
  const galleryScrollAmount = 340; // card width + gap

  galleryBtnLeft.addEventListener('click', () => {
    galleryTrack.scrollBy({ left: -galleryScrollAmount, behavior: 'smooth' });
  });

  galleryBtnRight.addEventListener('click', () => {
    galleryTrack.scrollBy({ left: galleryScrollAmount, behavior: 'smooth' });
  });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});
