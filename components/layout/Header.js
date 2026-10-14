'use client';

import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useIsPresent, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { useIsClient } from '@/hooks/useIsClient';
import { useHavoState } from '@/features/progress/store';
import { scrollToSection } from '@/lib/scroll';
import { Logo } from './Logo';
import { NAV_ITEMS, SECTION_TO_NAV } from './navigation';
import styles from './Header.module.css';

const TRACKED = Object.keys(SECTION_TO_NAV);
const EASE = [0.22, 1, 0.36, 1];

function PlanLink({ className, onClick }) {
  const { plan } = useHavoState();
  const open = plan.filter((p) => !p.completedAt).length;
  return (
    <a href="#progress" className={className} onClick={onClick}>
      <span className={styles.planText}>Мой план</span>
      <span className={styles.count}>
        <span className="sr-only">, открытых задач: </span>
        {open}
      </span>
    </a>
  );
}

function MobileMenu({ onClose, active }) {
  const panelRef = useRef(null);
  // Release the scroll lock as soon as the exit animation starts.
  const isPresent = useIsPresent();
  useDialogBehavior(panelRef, isPresent, onClose);

  // Close first (which releases the page scroll lock), then scroll.
  const go = (id) => (e) => {
    e.preventDefault();
    onClose();
    scrollToSection(id, 60);
  };

  return (
    <motion.div
      ref={panelRef}
      id="mobile-menu"
      className={styles.mobile}
      role="dialog"
      aria-modal="true"
      aria-label="Меню"
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={styles.mobileTop}>
        <Logo />
        <button type="button" className={styles.burger} onClick={onClose} aria-label="Закрыть меню">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Основная навигация" className={styles.mobileNav}>
        <ol role="list">
          {NAV_ITEMS.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: EASE }}
            >
              <a
                href={`#${item.id}`}
                onClick={go(item.id)}
                aria-current={active === item.id ? 'location' : undefined}
                className={styles.mobileLink}
              >
                <span className={styles.mobileIndex}>{String(i + 1).padStart(2, '0')}</span>
                {item.label}
                <ArrowUpRight size={22} aria-hidden="true" className={styles.mobileArrow} />
              </a>
            </motion.li>
          ))}
        </ol>
      </nav>
      <div className={styles.mobileBottom}>
        <PlanLink className={styles.mobilePlan} onClick={go('progress')} />
        <p>Для подростков 13–18 лет · Узбекистан</p>
      </div>
    </motion.div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isClient = useIsClient();
  const activeSection = useActiveSection(TRACKED);
  const active = SECTION_TO_NAV[activeSection] ?? 'home';

  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled || undefined}>
        <div className={styles.inner}>
          <a href="#home" className={styles.logo} aria-label="HAVO — на главную">
            <Logo />
          </a>

          <nav aria-label="Основная навигация" className={styles.nav}>
            <ul role="list">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={styles.link}
                      data-active={isActive || undefined}
                      aria-current={isActive ? 'location' : undefined}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className={styles.pill}
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        />
                      )}
                      <span className={styles.linkText}>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.right}>
            <PlanLink className={styles.plan} />
            <button
              type="button"
              className={styles.burger}
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Открыть меню"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
        <motion.div className={styles.progress} style={{ scaleX: progress }} aria-hidden="true" />
      </header>

      {isClient &&
        createPortal(
          <AnimatePresence>{menuOpen && <MobileMenu onClose={closeMenu} active={active} />}</AnimatePresence>,
          document.body,
        )}
    </>
  );
}
