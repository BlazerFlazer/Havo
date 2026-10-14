'use client';

import { motion } from 'motion/react';
import { Calculator, CircleHelp, Gauge } from 'lucide-react';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { ImpactCalculator } from '@/features/impact/ImpactCalculator';
import { AirDashboard } from '@/features/air/AirDashboard';
import { Quiz } from '@/features/quiz/Quiz';
import { TOOL_TABS, setToolTab, useToolTab } from '@/features/tools/toolTabStore';
import styles from './Tools.module.css';

const ICONS = { impact: Calculator, air: Gauge, quiz: CircleHelp };

const PANELS = {
  impact: {
    title: 'Сколько даёт одна привычка?',
    text: 'Оцени, сколько CO₂ можно не выбросить, если заменить короткие поездки на машине. Формула, допущения и неопределённость — на виду.',
  },
  air: {
    title: 'Что с воздухом в моём городе?',
    text: 'Живые показания появляются здесь, только если подключён настоящий источник данных. Без него мы честно отправляем тебя на проверенные сайты.',
  },
  quiz: {
    title: 'Проверь себя',
    text: 'Тринадцать вопросов о частицах, погоде, транспорте и о том, что работает, а что нет. Правильный ответ видно только после твоего выбора.',
  },
};

export function Tools() {
  const active = useToolTab();

  const onKeyDown = (e) => {
    const i = TOOL_TABS.findIndex((t) => t.id === active);
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % TOOL_TABS.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + TOOL_TABS.length) % TOOL_TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TOOL_TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setToolTab(TOOL_TABS[next].id);
    document.getElementById(`tool-tab-${TOOL_TABS[next].id}`)?.focus();
  };

  return (
    <section id="tools" className={`section theme-forest-2 ${styles.section}`} aria-labelledby="tools-title">
      <div className="container">
        <SectionIntro
          index="04"
          eyebrow="Инструменты"
          id="tools-title"
          title="Посчитать, проверить, разобраться"
          layout="split"
          lead="Три инструмента, которые работают без регистрации и без выдуманных данных: калькулятор влияния, панель качества воздуха и квиз."
        />

        <div className={styles.tabs} role="tablist" aria-label="Инструменты" onKeyDown={onKeyDown}>
          {TOOL_TABS.map((tab) => {
            const Icon = ICONS[tab.id];
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                id={`tool-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`tool-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                className={styles.tab}
                onClick={() => setToolTab(tab.id)}
              >
                {selected && (
                  <motion.span
                    layoutId="tool-tab-bg"
                    className={styles.tabBg}
                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                  />
                )}
                <Icon size={18} aria-hidden="true" className={styles.tabIcon} />
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {TOOL_TABS.map((tab) => (
          <div
            key={tab.id}
            id={`tool-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tool-tab-${tab.id}`}
            hidden={tab.id !== active}
            className={styles.panel}
          >
            <div className={styles.panelHead}>
              <h3 className={styles.panelTitle}>{PANELS[tab.id].title}</h3>
              <p className={styles.panelText}>{PANELS[tab.id].text}</p>
            </div>
            {tab.id === 'impact' && <ImpactCalculator />}
            {tab.id === 'air' && <AirDashboard />}
            {tab.id === 'quiz' && <Quiz />}
          </div>
        ))}
      </div>
    </section>
  );
}
