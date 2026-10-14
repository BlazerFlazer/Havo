import { SectionIntro } from '@/components/ui/SectionIntro';
import { InitiativeList } from '@/features/initiatives/InitiativeList';
import { ProposalForm } from '@/features/initiatives/ProposalForm';
import styles from './Initiatives.module.css';

export function Initiatives() {
  return (
    <section id="initiatives" className={`section theme-paper ${styles.section}`} aria-labelledby="initiatives-title">
      <div className="container">
        <SectionIntro
          index="05"
          eyebrow="Инициативы"
          id="initiatives-title"
          title="Проекты, которые можно запустить с командой"
          layout="split"
          lead="Шесть готовых сценариев: роли, шаги, материалы, чек-лист безопасности и честный ожидаемый результат. Возьми любой за основу и адаптируй под свою школу или махаллю."
        >
          <p className={styles.note}>
            Это примеры проектов-шаблонов, а не описания реальных действующих кампаний.
          </p>
        </SectionIntro>
        <InitiativeList />
        <div className={styles.form}>
          <ProposalForm />
        </div>
      </div>
    </section>
  );
}
