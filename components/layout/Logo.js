/** HAVO mark: a globe crossed by two air currents. */
export function LogoMark({ size = 28, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 13.2c3.6-2.6 7.2 2.6 10.8 0s6.6-2.4 10.2 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5.5 19.2c3.6-2.6 7.2 2.6 10.8 0s6.6-2.4 10.2 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={28} />
      <span style={{ fontWeight: 800, letterSpacing: '0.14em', fontSize: '1.02rem' }}>HAVO</span>
    </span>
  );
}
