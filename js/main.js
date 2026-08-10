/**
 * AGES Malaysia - Main JavaScript File
 * Vanilla JS logic for interactive UI elements & accessibility.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Header Scroll & Mobile Menu Navigation
  initHeader();
  // Initialize Contact Form Validation & FAQ Accordion
  initContactForm();
  initFaqAccordion();
});

/**
 * Handles sticky navbar styling on scroll and mobile drawer navigation.
 */
function initHeader() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  // Add shadow / background shift on scroll
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile Navigation Menu Toggle
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-active');

      // Prevent scrolling when mobile menu is open
      if (!isExpanded) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Close menu when clicking navigation links
    const navLinks = navMenu.querySelectorAll('.nav-link, .btn');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('is-active')) {
          closeMobileMenu(navMenu, toggleBtn);
        }
      });
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-active')) {
        closeMobileMenu(navMenu, toggleBtn);
      }
    });

    // Close menu when clicking outside header/menu area
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('is-active') && 
          !navMenu.contains(e.target) && 
          !toggleBtn.contains(e.target)) {
        closeMobileMenu(navMenu, toggleBtn);
      }
    });
  }
}

/**
 * Helper to close mobile menu drawer and restore scrolling state.
 */
function closeMobileMenu(navMenu, toggleBtn) {
  navMenu.classList.remove('is-active');
  toggleBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/**
 * Handles client-side contact form validation and transparent feedback message.
 */
function initContactForm() {
  const form = document.querySelector('#enquiry-form-element');
  const noticeBox = document.querySelector('#form-notice-box');

  if (form && noticeBox) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const enquiryType = form.querySelector('[name="enquiry_type"]');
      const message = form.querySelector('[name="message"]');

      let isValid = true;

      // Basic HTML5 Validity & Custom Checks
      [name, email, enquiryType, message].forEach(field => {
        if (!field || !field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#D32F2F';
        } else {
          field.style.borderColor = 'var(--color-border)';
        }
      });

      if (!isValid) {
        return;
      }

      // Display transparent notice explaining static environment status
      noticeBox.classList.add('visible');
      noticeBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      form.reset();
    });
  }
}

/**
 * Handles accessible FAQ accordion toggling.
 */
function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-button');

  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const faqItem = button.closest('.faq-item');
      const isOpen = button.getAttribute('aria-expanded') === 'true';

      // Toggle current item
      button.setAttribute('aria-expanded', !isOpen);
      if (faqItem) {
        faqItem.classList.toggle('is-open');
      }
    });
  });
}
