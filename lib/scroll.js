// Smoothly scrolls to a section (instantly when the user prefers reduced motion).
export function scrollToSection(id, delay = 0) {
  if (typeof window === 'undefined') return;
  const run = () => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`);
  };
  if (delay) setTimeout(run, delay);
  else run();
}
