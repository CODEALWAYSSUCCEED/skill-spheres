@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;

  --ease-out: cubic-bezier(.2,.8,.2,1);
  --ease-spring: cubic-bezier(.34,1.56,.64,1);
}

@layer utilities {
  .space-section {
    margin-bottom: var(--space-8);
  }

  .space-card {
    gap: var(--space-5);
  }

  .padding-card {
    padding: var(--space-6);
  }

  .padding-section {
    padding: var(--space-8);
  }
}

/* ─── PAGE TRANSITION ──────────────────────────────────────── */
.page-enter {
  animation: page-enter 280ms var(--ease-out) both;
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── SCROLL REVEAL ─────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 600ms var(--ease-out),
    transform 600ms var(--ease-out);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger helpers */
.reveal-delay-1 { transition-delay: 60ms; }
.reveal-delay-2 { transition-delay: 120ms; }
.reveal-delay-3 { transition-delay: 180ms; }
.reveal-delay-4 { transition-delay: 240ms; }
.reveal-delay-5 { transition-delay: 300ms; }
.reveal-delay-6 { transition-delay: 360ms; }

/* ─── CARD HOVER LIFT ───────────────────────────────────────── */
.card-hover {
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    border-color 200ms var(--ease-out);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -8px rgba(0,0,0,.35), 0 0 0 1px rgba(245,158,11,.25);
}

/* ─── BUTTON PRESS ──────────────────────────────────────────── */
.btn-press {
  transition:
    transform 150ms var(--ease-out),
    opacity 150ms var(--ease-out),
    background-color 150ms var(--ease-out),
    box-shadow 150ms var(--ease-out);
}

.btn-press:active {
  transform: scale(.98);
}

/* ─── PROGRESS BAR ANIMATION ────────────────────────────────── */
.progress-bar-animated {
  transition: width 900ms var(--ease-out);
}

/* ─── MOBILE MENU SLIDE ─────────────────────────────────────── */
.mobile-menu-enter {
  animation: mobile-menu-enter 220ms var(--ease-out) both;
}

@keyframes mobile-menu-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── CONFETTI / SPARKLE BURST ──────────────────────────────── */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.confetti-particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall var(--duration, 900ms) var(--ease-out) forwards;
  opacity: 0;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx, 40px), var(--ty, -80px)) rotate(var(--rot, 360deg)) scale(.4);
  }
}

/* ─── NUMBER COUNT-UP (used via JS) ─────────────────────────── */
.count-up {
  transition: none;
}

/* ─── NAVBAR ACTIVE LINK ─────────────────────────────────────── */
.nav-link-transition {
  transition:
    color 150ms var(--ease-out),
    background-color 150ms var(--ease-out);
}

/* ─── TOAST FADE IN ──────────────────────────────────────────── */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 200ms var(--ease-out) both;
}

/* ─── FORM INPUT STYLES ─────────────────────────────────────── */
.form-input {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #fff;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 150ms ease, background 150ms ease;
}
.form-input::placeholder {
  color: rgba(147, 197, 253, 0.4);
}
.form-input:focus {
  outline: none;
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(255, 255, 255, 0.1);
}
.form-input option {
  background: #1e3a8a;
  color: #fff;
}

/* ─── SKILL ROW HOVER ───────────────────────────────────────── */
.skill-row-hover {
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
}
.skill-row-hover:hover {
  transform: translateX(3px);
}

/* ─── FLOAT CARD ANIMATION ──────────────────────────────────── */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.float-card {
  animation: float 4s ease-in-out infinite;
}
.float-card:nth-child(2) { animation-delay: 0.5s; }
.float-card:nth-child(3) { animation-delay: 1s; }
.float-card:nth-child(4) { animation-delay: 1.5s; }

/* ─── SHIMMER LOADING ─────────────────────────────────────── */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

.shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* ─── SUBTLE PULSE GLOW ──────────────────────────────────── */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
  50%       { box-shadow: 0 0 20px 4px rgba(245,158,11,0.12); }
}

.pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

/* ─── SPIN SLOW ──────────────────────────────────────────── */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

/* ─── GRADIENT SHIFT ─────────────────────────────────────── */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}
.gradient-animated {
  background-size: 200% 200%;
  animation: gradient-shift 6s ease infinite;
}

/* ─── REDUCED MOTION ─────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .reveal,
  .page-enter,
  .mobile-menu-enter,
  .confetti-particle,
  .progress-bar-animated,
  .animate-fade-in,
  .float-card,
  .shimmer,
  .pulse-glow,
  .animate-spin-slow,
  .gradient-animated,
  .skill-row-hover {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .card-hover:hover,
  .btn-press:active {
    transform: none !important;
    box-shadow: none !important;
  }
}

/* ─── READABLE TEXT OVERRIDES ───────────────────────────────── */
/* Ensure body text and descriptive copy is always legible */
p, li, span, label {
  /* Prevent accidental near-invisible text from low opacity classes */
}

/* Description/body text should never go below 60% opacity on dark bg */
.text-description {
  color: rgba(186, 215, 253, 0.85);
}
.text-muted {
  color: rgba(147, 197, 253, 0.65);
}
.text-subtle {
  color: rgba(147, 197, 253, 0.5);
}

/* ─── BASE ───────────────────────────────────────────────────── */
body {
  background: linear-gradient(155deg, #0f2460 0%, #1a348a 30%, #1e40af 60%, #2457c5 100%);
  background-attachment: fixed;
  min-height: 100vh;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
}

/* ─── TYPOGRAPHY SCALE ───────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  font-feature-settings: "kern" 1, "liga" 1;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

/* ─── GLOBAL FONT REFINEMENTS ───────────────────────────────── */
/* Tighten headings that use font-extrabold/font-black + text-white */
.font-extrabold, .font-black {
  letter-spacing: -0.025em;
}

/* ─── EDITORIAL HEADING UTILITY ──────────────────────────────── */
.heading-display {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.heading-section {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.text-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ─── REFINED CARD HOVER ─────────────────────────────────────── */
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px -8px rgba(0,0,0,.4), 0 0 0 1px rgba(245,158,11,.18);
}

body.modal-open {
  overflow: hidden;
}

* {
  min-height: 0;
  min-width: 0;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── MOBILE TOUCH TARGETS ───────────────────────────────────── */
@media (max-width: 640px) {
  /* Ensure minimum touch target size on mobile */
  button, a, [role="button"] {
    min-height: 40px;
  }

  /* Reduce card hover lift on touch devices to avoid stuck states */
  .card-hover:hover {
    transform: none;
  }

  /* Prevent horizontal overflow on all pages */
  body {
    overflow-x: hidden;
  }
}

/* ─── SAFE AREA INSETS (notch support) ───────────────────────── */
@supports (padding: env(safe-area-inset-bottom)) {
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
