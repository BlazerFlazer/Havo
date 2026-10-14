'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { HeroVisual } from '@/components/three/HeroVisual';
import { Button } from '@/components/ui/Button';
import { SplitHeading } from '@/components/ui/Reveal';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import styles from './Hero.module.css';

const EASE = [0.22, 1, 0.36, 1];

const STEPS = [
  { href: '#problem', index: '01', title: 'Понять', text: 'откуда берётся грязный воздух' },
  { href: '#actions', index: '02', title: 'Действовать', text: 'шаги, доступные уже сегодня' },
  { href: '#progress', index: '03', title: 'Отслеживать', text: 'личный план и прогресс' },
];

export function Hero() {
  const sectionRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  // null = the visitor has not chosen yet (the intro plays), true/false = explicit choice.
  const [choice, setChoice] = useState(null);
  const [introDone, setIntroDone] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });

  // Short cinematic intro: the haze clears on its own after a moment.
  useEffect(() => {
    const id = setTimeout(() => setIntroDone(true), 2600);
    return () => clearTimeout(id);
  }, []);

  const clean = choice ?? (reduced || introDone);

  const fade = (delay) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section id="home" ref={sectionRef} className={styles.hero} aria-labelledby="hero-title">
      <HeroVisual cleanTarget={clean ? 1 : 0} scrollProgress={scrollYProgress} />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.content}>
          <motion.p className={styles.audience} {...fade(0.1)}>
            <span className={styles.pulse} aria-hidden="true" />
            Для подростков 13–18 лет
            <span className={styles.audienceSep} aria-hidden="true" />
            Узбекистан
          </motion.p>

          <SplitHeading
            as="h1"
            id="hero-title"
            className={`t-display ${styles.title}`}
            inView={false}
            delay={0.2}
            stagger={0.07}
            parts={[
              { text: 'Будущее', breakAfter: true },
              { text: 'воздуха —', breakAfter: true },
              { text: 'в наших руках.', className: `t-serif ${styles.titleAccent}` },
            ]}
          />

          <motion.p className={`t-lead ${styles.lead}`} {...fade(0.75)}>
            Не нужно ждать, пока мир изменится. Начни с действий, которые доступны тебе уже сегодня.
          </motion.p>

          <motion.div className={styles.ctas} {...fade(0.9)}>
            <Button href="#actions" size="lg" icon={ArrowRight}>
              Найти свой первый шаг
            </Button>
            <Button href="#problem" size="lg" variant="secondary">
              Изучить проблему
            </Button>
          </motion.div>
        </div>

        <motion.div className={styles.rail} {...fade(1.1)}>
          <ol className={styles.steps} role="list" aria-label="Как устроена платформа">
            {STEPS.map((step) => (
              <li key={step.index}>
                <a href={step.href} className={styles.step}>
                  <span className={styles.stepIndex}>{step.index}</span>
                  <span>
                    <span className={styles.stepTitle}>{step.title}</span>
                    <span className={styles.stepText}>{step.text}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>

          <div className={styles.atmo}>
            <div className={styles.toggle} role="group" aria-label="Состояние атмосферы на визуализации">
              <button type="button" aria-pressed={!clean} onClick={() => setChoice(false)} className={styles.toggleBtn}>
                Смог
              </button>
              <button type="button" aria-pressed={clean} onClick={() => setChoice(true)} className={styles.toggleBtn}>
                Чистый воздух
              </button>
            </div>
            <p className={styles.atmoNote}>Символическая визуализация, не научная модель</p>
          </div>
        </motion.div>
      </div>

      <p className={styles.brandNote} aria-hidden="true">
        havo — «воздух» по-узбекски
      </p>
    </section>
  );
}
