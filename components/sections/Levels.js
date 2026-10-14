import { InterventionStack } from '@/features/levels/InterventionStack';
import { SectionIntro } from '@/components/ui/SectionIntro';
import styles from './Levels.module.css';

/** Bridge between "the problem" and "what you can do": who controls which levers. */
export function Levels() {
  return (
    <section id="levels" className={`section theme-forest-2 ${styles.section}`} aria-labelledby="levels-title">
      <div className="container">
        <SectionIntro
          eyebrow="Уровни перемен"
          id="levels-title"
          title={'Твои шаги важны. И их недостаточно — это нормально'}
          layout="split"
          lead="Чистый воздух складывается из решений на разных уровнях. Личные привычки дают прямой, но небольшой эффект. Школа и махалля усиливают его. Транспорт, энергетику и промышленность меняют решения города и государства. Подростки могут участвовать на каждом уровне."
        />
        <InterventionStack />
      </div>
    </section>
  );
}
