'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { INTERVENTION_LEVELS } from '@/data/pollution';
import styles from './InterventionStack.module.css';

const EASE = [0.22, 1, 0.36, 1];
// Plates from the top of the stack (smallest, "me") to the base (largest).
const PLATE_SIZES = [38, 56, 76, 100];

/**
 * Interactive "levels of change": personal habits sit on top of school,
 * community and state decisions. Built with CSS 3D transforms (no WebGL).
 */
export function InterventionStack() {
  const [activeId, setActiveId] = useState('me');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const sceneRef = useRef(null);
  const active = INTERVENTION_LEVELS.find((l) => l.id === activeId);
  const activeIndex = INTERVENTION_LEVELS.indexOf(active);

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const rect = sceneRef.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - rect.top) / rect.height - 0.5) * -8,
      y: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
    });
  };

  const onKeyDown = (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (activeIndex + keys[e.key] + INTERVENTION_LEVELS.length) % INTERVENTION_LEVELS.length;
    setActiveId(INTERVENTION_LEVELS[next].id);
    document.getElementById(`level-tab-${INTERVENTION_LEVELS[next].id}`)?.focus();
  };

  return (
    <div className={styles.wrap}>
      <div
        ref={sceneRef}
        className={styles.scene}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        aria-hidden="true"
      >
        <div
          className={styles.stack}
          style={{ transform: `rotateX(${58 + tilt.x}deg) rotateZ(${-36 + tilt.y}deg)` }}
        >
          {[...INTERVENTION_LEVELS].reverse().map((level) => {
            const i = INTERVENTION_LEVELS.indexOf(level);
            const isActive = level.id === activeId;
            const size = PLATE_SIZES[i];
            const z = (INTERVENTION_LEVELS.length - 1 - i) * 46 + (isActive ? 26 : 0);
            return (
              <button
                key={level.id}
                type="button"
                tabIndex={-1}
                className={styles.plate}
                data-active={isActive || undefined}
                data-level={i}
                style={{
                  width: `${size}%`,
                  height: `${size}%`,
                  transform: `translate(-50%, -50%) translateZ(${z}px)`,
                }}
                onClick={() => setActiveId(level.id)}
              >
                <span className={styles.plateLabel}>{level.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tabs} role="tablist" aria-label="Уровни изменений" onKeyDown={onKeyDown}>
          {INTERVENTION_LEVELS.map((level, i) => (
            <button
              key={level.id}
              id={`level-tab-${level.id}`}
              type="button"
              role="tab"
              aria-selected={level.id === activeId}
              aria-controls="level-panel"
              tabIndex={level.id === activeId ? 0 : -1}
              className={styles.tab}
              onClick={() => setActiveId(level.id)}
            >
              <span className={styles.tabNum}>{String(i + 1).padStart(2, '0')}</span>
              {level.title}
            </button>
          ))}
        </div>

        <div id="level-panel" role="tabpanel" aria-labelledby={`level-tab-${activeId}`} className={styles.detail}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <p className={styles.scale}>{active.scale}</p>
              <p className={styles.control}>{active.control}</p>
              <ul className={styles.levers} role="list">
                {active.levers.map((l) => (
                  <li key={l}>
                    <Check size={16} aria-hidden="true" />
                    {l}
                  </li>
                ))}
              </ul>
              <p className={styles.teen}>
                <span className={styles.teenLabel}>Роль подростка</span>
                {active.teen}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
