export function fireConfetti(originEl?: HTMLElement | null) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];
  const count = 28;

  const cx = originEl
    ? originEl.getBoundingClientRect().left + originEl.getBoundingClientRect().width / 2
    : window.innerWidth / 2;
  const cy = originEl
    ? originEl.getBoundingClientRect().top + originEl.getBoundingClientRect().height / 2
    : window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 60 + Math.random() * 80;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 60;
    const rot = Math.random() * 720 - 360;
    const dur = 700 + Math.random() * 400;
    const delay = Math.random() * 100;
    const size = 6 + Math.random() * 6;

    p.style.cssText = `
      left: ${cx}px;
      top: ${cy}px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[i % colors.length]};
      --tx: ${tx}px;
      --ty: ${ty}px;
      --rot: ${rot}deg;
      --duration: ${dur}ms;
      animation-delay: ${delay}ms;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;

    container.appendChild(p);
  }

  setTimeout(() => container.remove(), 1400);
}
