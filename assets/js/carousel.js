/* ============================================================
   CAROUSEL.JS — Spinning testimonial circle carousel
   Client logos/photos orbit the Cornerstone C logo
   Pauses and expands quote on hover
   ============================================================ */

const CAROUSEL_CONFIG = {
  radius: 180,
  rotationDuration: 30, // seconds per full orbit
  clients: [
    {
      name: 'Dr. Jessica Owen',
      company: 'Unleashed Training',
      quote: '',   // TODO: Add testimonial quote
      logo: 'assets/images/testimonials/unleashed.png',
      initials: 'JO'
    }
    // Add more clients here as testimonials come in
  ]
};

function renderCarousel(container) {
  // Determine layout size
  const size = Math.min(container.offsetWidth || 500, 500);
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(CAROUSEL_CONFIG.radius, size / 2 - 55);

  container.style.position = 'relative';
  container.style.width = size + 'px';
  container.style.height = size + 'px';
  container.style.margin = '0 auto';

  // Inject keyframes once
  if (!document.getElementById('carousel-styles')) {
    const style = document.createElement('style');
    style.id = 'carousel-styles';
    style.textContent = `
      @keyframes carousel-orbit {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes carousel-counter {
        from { transform: rotate(0deg); }
        to   { transform: rotate(-360deg); }
      }
      .carousel-quote-card {
        position: absolute;
        background: #161616;
        border: 1px solid rgba(201,168,76,0.3);
        border-radius: 4px;
        padding: 14px 16px;
        width: 200px;
        z-index: 20;
        font-family: 'DM Sans', sans-serif;
        pointer-events: none;
        animation: cora-fade-in 0.2s ease;
      }
      .carousel-quote-card .cq-quote {
        font-size: 12.5px;
        color: #e8e8e8;
        line-height: 1.55;
        margin-bottom: 8px;
        font-style: italic;
      }
      .carousel-quote-card .cq-name {
        font-size: 12px;
        color: #c9a84c;
        font-weight: 500;
      }
      .carousel-quote-card .cq-company {
        font-size: 11px;
        color: #888888;
      }
    `;
    document.head.appendChild(style);
  }

  // Faint orbit ring
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    width: ${r * 2}px; height: ${r * 2}px;
    border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.15);
    transform: translate(-50%, -50%);
    pointer-events: none;
  `;
  container.appendChild(ring);

  // Center logo (Cornerstone C)
  const centerSVG = `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f0d080"/>
          <stop offset="40%" style="stop-color:#c9a84c"/>
          <stop offset="100%" style="stop-color:#8a6820"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="4" fill="none" stroke="url(#cGold)" stroke-width="1.5"/>
      <text x="32" y="48" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="700" fill="url(#cGold)">C</text>
    </svg>
  `;
  const center = document.createElement('div');
  center.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 64px; height: 64px;
    z-index: 10;
  `;
  center.innerHTML = centerSVG;
  container.appendChild(center);

  const clients = CAROUSEL_CONFIG.clients;

  if (clients.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.style.cssText = `
      position: absolute; bottom: -48px; left: 50%; transform: translateX(-50%);
      font-family: 'DM Sans', sans-serif; font-size: 13px; color: #888888;
      white-space: nowrap;
    `;
    placeholder.textContent = 'Client results coming soon.';
    container.appendChild(placeholder);
    return;
  }

  // Orbit wrapper — rotates the whole ring
  const orbit = document.createElement('div');
  orbit.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    width: 0; height: 0;
    animation: carousel-orbit ${CAROUSEL_CONFIG.rotationDuration}s linear infinite;
    transform-origin: 0 0;
  `;
  container.appendChild(orbit);

  // Active quote card (one shared instance)
  const quoteCard = document.createElement('div');
  quoteCard.className = 'carousel-quote-card';
  quoteCard.style.display = 'none';
  container.appendChild(quoteCard);

  clients.forEach((client, i) => {
    const angle = (i / clients.length) * 2 * Math.PI - Math.PI / 2;
    const nx = Math.cos(angle) * r;
    const ny = Math.sin(angle) * r;

    // Node wrapper (counter-rotates so content stays upright)
    const node = document.createElement('div');
    node.style.cssText = `
      position: absolute;
      left: ${nx}px;
      top: ${ny}px;
      width: 56px; height: 56px;
      transform: translate(-50%, -50%);
      animation: carousel-counter ${CAROUSEL_CONFIG.rotationDuration}s linear infinite;
      cursor: pointer;
      z-index: 5;
    `;

    // Inner circle
    const inner = document.createElement('div');
    inner.style.cssText = `
      width: 56px; height: 56px;
      border-radius: 50%;
      background: #161616;
      border: 1.5px solid rgba(201,168,76,0.4);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    `;

    // Try logo, fallback to initials
    const img = document.createElement('img');
    img.src = client.logo;
    img.alt = client.name;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
    img.onerror = () => {
      img.style.display = 'none';
      const initials = document.createElement('span');
      initials.textContent = client.initials || client.name.split(' ').map(w => w[0]).join('').slice(0, 2);
      initials.style.cssText = `
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 18px; font-weight: 700;
        background: linear-gradient(135deg, #f0d080, #8a6820);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      `;
      inner.appendChild(initials);
    };
    inner.appendChild(img);
    node.appendChild(inner);
    orbit.appendChild(node);

    // Hover: pause + show quote card
    node.addEventListener('mouseenter', () => {
      orbit.style.animationPlayState = 'paused';
      inner.style.borderColor = 'rgba(201,168,76,0.9)';
      inner.style.boxShadow = '0 0 20px rgba(201,168,76,0.25)';

      // Position quote card relative to container
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const relX = nodeRect.left - containerRect.left + 28;
      const relY = nodeRect.top - containerRect.top + 28;

      // Determine left vs right based on which side of center
      const isRightHalf = relX > cx;
      quoteCard.style.left = isRightHalf ? (relX - 220) + 'px' : (relX + 30) + 'px';
      quoteCard.style.top = (relY - 60) + 'px';

      quoteCard.innerHTML = `
        <div class="cq-quote">${client.quote || 'Testimonial coming soon.'}</div>
        <div class="cq-name">${client.name}</div>
        <div class="cq-company">${client.company}</div>
      `;
      quoteCard.style.display = 'block';
    });

    node.addEventListener('mouseleave', () => {
      orbit.style.animationPlayState = 'running';
      inner.style.borderColor = 'rgba(201,168,76,0.4)';
      inner.style.boxShadow = 'none';
      quoteCard.style.display = 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('testimonials');
  if (container) {
    renderCarousel(container);
  }
});
