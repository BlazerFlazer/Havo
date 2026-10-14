import { SectionIntro } from '@/components/ui/SectionIntro';
import { ProgressDashboard } from '@/features/progress/ProgressDashboard';
import styles from './Progress.module.css';

export function Progress() {
  return (
    <section id="progress" className={`section ${styles.section}`} aria-labelledby="progress-title">
      <div className="container">
        <SectionIntro
          index="06"
          eyebrow="Мой вклад"
          id="progress-title"
          title="Твой план и твой прогресс"
          layout="split"
          lead="Собирай действия в личный план, ставь сроки и отмечай то, что действительно сделал. Без регистрации — всё хранится в твоём браузере."
        />
        <ProgressDashboard />
      </div>
    </section>
  );
}
