'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { AtmosphereField } from '@/components/canvas/AtmosphereField';
import styles from './Manifest.module.css';

const TEXT =
  'Чистый воздух не появляется от одного поступка. Его создают решения людей, школ, городов и государства. Твоя часть — реальна, и она начинается с малого.';

function Word({ children, progress, range, accent }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className={accent ? styles.accent : undefined}>
      {children}{' '}
    </motion.span>
  );
}

const ACCENT_WORDS = new Set(['людей,', 'школ,', 'городов', 'государства.']);

/** Scroll-linked manifesto: words light up as the visitor reads down the page. */
export function Manifest() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] });
  const words = TEXT.split(' ');

  return (
    <section id="manifest" ref={ref} className={styles.section} aria-label="Идея HAVO">
      <AtmosphereField progress={scrollYProgress} className={styles.field} />
      <div className={`container ${styles.inner}`}>
        <p className={styles.kicker}>Почему HAVO</p>
        <p className={styles.text}>
          <span className="sr-only">{TEXT}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <Word
                key={i}
                progress={scrollYProgress}
                range={[i / words.length, (i + 1) / words.length]}
                accent={ACCENT_WORDS.has(w)}
              >
                {w}
              </Word>
            ))}
          </span>
        </p>
        <div className={styles.footnote}>
          <span className={styles.rule} aria-hidden="true" />
          <p>
            Мы не обещаем, что один человек очистит воздух в городе. Мы показываем, какие шаги реальны для подростка и
            как они складываются с решениями школ, городов и страны.
          </p>
        </div>
      </div>
    </section>
  );
}
