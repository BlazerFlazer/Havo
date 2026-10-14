'use client';

import { motion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

/** Fades and lifts content into view once. Reduced motion is handled by <MotionConfig>. */
export function Reveal({ as = 'div', delay = 0, y = 26, amount = 0.2, className, children, ...rest }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * Heading whose words rise from a mask one after another.
 * The animated copy is aria-hidden; screen readers get the plain text.
 * `parts` is an array of { text, className } segments so styling can vary.
 */
export function SplitHeading({ as = 'h2', id, parts, className, delay = 0, stagger = 0.06, inView = true }) {
  const Tag = as;
  const plain = parts.map((p) => p.text).join(' ');
  let index = 0;
  const animateProps = inView
    ? { whileInView: { y: '0%' }, viewport: { once: true, amount: 0.4 } }
    : { animate: { y: '0%' } };

  return (
    <Tag id={id} className={className}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden="true">
        {parts.map((part, pi) => (
          <span key={pi} className={part.className}>
            {part.text.split(' ').map((word, wi) => {
              const i = index++;
              return (
                <span
                  key={wi}
                  style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em' }}
                >
                  <motion.span
                    style={{ display: 'inline-block', willChange: 'transform' }}
                    initial={{ y: '105%' }}
                    transition={{ duration: 0.9, delay: delay + i * stagger, ease: EASE }}
                    {...animateProps}
                  >
                    {word}
                  </motion.span>
                  {' '}
                </span>
              );
            })}
            {part.breakAfter && <br />}
          </span>
        ))}
      </span>
    </Tag>
  );
}
