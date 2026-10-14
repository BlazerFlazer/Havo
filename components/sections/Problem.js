import { SectionIntro } from '@/components/ui/SectionIntro';
import { SubHead } from '@/components/ui/SubHead';
import { TashkentSnapshot } from '@/features/problem/TashkentSnapshot';
import { FactorsList } from '@/features/problem/FactorsList';
import { InversionLab } from '@/features/problem/InversionLab';
import { Pollutants } from '@/features/problem/Pollutants';
import { ParticleScale } from '@/features/problem/ParticleScale';
import { AqiExplainer } from '@/features/problem/AqiExplainer';
import { SourcesMethodology } from '@/features/problem/SourcesMethodology';
import styles from './Problem.module.css';

export function Problem() {
  return (
    <section id="problem" className={`section theme-paper ${styles.section}`} aria-labelledby="problem-title">
      <div className="container">
        <SectionIntro
          index="02"
          eyebrow="Проблема"
          id="problem-title"
          title="Откуда берётся грязный воздух"
          layout="split"
          lead="Качество воздуха складывается из двух частей: что выбрасывают транспорт, отопление, промышленность и пыль — и какая погода помогает загрязнению рассеяться или, наоборот, удерживает его у земли. В Узбекистане с его долинами, пустынями и холодной зимой важно и то, и другое."
        >
          <p className={styles.honesty}>
            Мы не публикуем выдуманные цифры. Числа ниже — из проверенных источников, а где данных нет, мы объясняем
            качественно.
          </p>
        </SectionIntro>

        <TashkentSnapshot />

        <SubHead
          index="2.1"
          title="Источники и условия"
          lead="Источник выбрасывает загрязнение, а условия решают, сколько его останется там, где мы дышим. Открой каждую строку, чтобы узнать, что здесь могут подростки, а что решается на уровне города и страны."
        />
        <FactorsList />

        <SubHead
          index="2.2"
          title="Как погода запирает дым"
          lead="Включи инверсию, выключи ветер — и посмотри, что происходит у земли при тех же выбросах. Модель упрощённая и показывает принцип, а не точные значения."
        />
        <InversionLab />

        <SubHead
          index="2.3"
          title="Чем мы дышим"
          lead="Разные загрязнители появляются из разных источников и по-разному влияют на здоровье. Четыре главных — в карточках ниже."
        />
        <Pollutants />
        <div className={styles.gap}>
          <ParticleScale />
        </div>

        <div className={styles.block}>
          <AqiExplainer />
        </div>

        <div className={styles.block}>
          <SourcesMethodology />
        </div>
      </div>
    </section>
  );
}
