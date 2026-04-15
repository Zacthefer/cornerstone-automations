# Cornerstone Automations — Website

**Live URL:** cornerstoneautomations.com (pending domain setup)  
**Hosting:** GitHub Pages  
**Repo name:** cornerstone-automations

---

## Pages

| File | Route | Status |
|------|-------|--------|
| index.html | / | Active |
| agents.html | /agents | Active |

---

## Stack

- Pure HTML / CSS / JS — no framework, no build step
- GitHub Pages for hosting (free, auto-deploy on push)
- Google Apps Script webhook for CORA form submissions (same sheet as start.html)

---

## File Structure

```
cornerstone-automations/
├── index.html                    Home page (single-page scroll)
├── agents.html                   AI Agents showcase page
├── assets/
│   ├── css/
│   │   ├── main.css              Global styles + design tokens (all pages)
│   │   ├── home.css              Home page specific styles
│   │   └── agents.css            Agents page specific styles
│   ├── js/
│   │   ├── main.js               Shared scripts: nav, scroll reveal (all pages)
│   │   ├── cora.js               CORA chat widget (all pages)
│   │   └── carousel.js           Spinning testimonial carousel (home only)
│   ├── images/
│   │   ├── logo.svg              Cornerstone Automations logo
│   │   └── testimonials/         Client logos and photos go here
│   └── fonts/                    Self-hosted fonts (if needed)
└── .github/
    └── workflows/
        └── deploy.yml            Auto-deploy to GitHub Pages on push to main
```

---

## Design Tokens (main.css)

| Token | Value | Use |
|-------|-------|-----|
| --color-bg | #0a0a0a | Page background |
| --color-bg-2 | #111111 | Alternate sections |
| --color-bg-card | #161616 | Card backgrounds |
| --color-gold-light | #f0d080 | Gold highlights |
| --color-gold-mid | #c9a84c | Primary gold |
| --color-gold-dark | #8a6820 | Gold shadows |
| --font-display | Cormorant Garamond | Headlines |
| --font-body | DM Sans | Body text |

---

## CORA Widget

- Floating button, bottom-right, visible on all pages
- Click opens a chat panel
- Chat walks visitor through lead qualification questions
- Same questions as isaacautomation.com/start
- Submits to same Google Sheet (Apps Script webhook URL in cora.js config)

---

## Adding a Testimonial

1. Add client logo/photo to `assets/images/testimonials/`
2. Add a new entry to `CAROUSEL_CONFIG.clients` in `carousel.js`
3. Push to main — GitHub Actions auto-deploys

---

## GitHub Pages Setup (one-time)

1. Create repo: `cornerstone-automations`
2. Push this scaffold to `main` branch
3. Go to repo Settings → Pages → Source: `main` branch, root folder
4. Point `cornerstoneautomations.com` DNS to GitHub Pages (CNAME record)
