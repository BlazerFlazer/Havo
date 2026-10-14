import { SectionIntro } from '@/components/ui/SectionIntro';
import { SubHead } from '@/components/ui/SubHead';
import { ActionFinder } from '@/features/actions/ActionFinder';
import { ActionLibrary } from '@/features/actions/ActionLibrary';
import { EFFECTS } from '@/data/actions';
import styles from './Actions.module.css';

export function Actions() {
  return (
    <section id="actions" className={`section ${styles.section}`} aria-labelledby="actions-title">
      <div className="container">
        <SectionIntro
          index="03"
          eyebrow="Действия"
          id="actions-title"
          title={'Что ты можешь сделать — на самом деле'}
          layout="split"
          lead="Здесь нет подвигов и чувства вины. Только реальные шаги для подростка: дома, в школе, в районе и онлайн. У каждого — время, бюджет, правила безопасности и честное описание пользы."
        />

        <ActionFinder />

        <SubHead
          id="library"
          index="3.1"
          title="Библиотека действий"
          lead="Мы отделяем действия, которые прямо уменьшают выбросы, от тех, что в первую очередь дают знания или вовлекают других. Важно и то, и другое — но это разные вещи."
          aside={
            <ul className={styles.effects} role="list">
              {Object.entries(EFFECTS).map(([id, e]) => (
                <li key={id}>
                  <span className={styles.dot} style={{ background: `var(--fx-${id})` }} aria-hidden="true" />
                  <span>
                    <strong>{e.label}.</strong> {e.description}
                  </span>
                </li>
              ))}
            </ul>
          }
        />
        <ActionLibrary />
      </div>
    </section>
  );
}
