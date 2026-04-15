/* ============================================================
   MAIN.JS — Shared scripts, runs on every page
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. NAV SHRINK ON SCROLL ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // --- 2. MOBILE NAV TOGGLE ---
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('nav-links-mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('hidden');
      mobileNav.classList.toggle('flex');
    });
    // Close mobile nav on link or button click
    mobileNav.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
        mobileNav.classList.remove('flex');
      });
    });
  }

  // --- 3. SCROLL REVEAL ---
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => observer.observe(el));
  }

});
