/**
 * AGES Malaysia - Main JavaScript File
 * Vanilla JS logic for interactive UI elements & accessibility.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Header Scroll & Mobile Menu Navigation
  initHeader();
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
