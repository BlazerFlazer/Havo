import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { NAV_ITEMS } from './navigation';
import { LogoMark } from './Logo';
import styles from './Footer.module.css';

const TOOL_LINKS = [
  { href: '#actions', label: 'Подбор действий' },
  { href: '#library', label: 'Библиотека действий' },
  { href: '#tools', label: 'Калькулятор, воздух, квиз' },
  { href: '#initiatives', label: 'Предложить инициативу' },
];

const EXTERNAL = [
  { href: 'https://www.who.int/publications/i/item/9789240034228', label: 'Рекомендации ВОЗ по качеству воздуха' },
  { href: 'https://monitoring.meteo.uz/ru/', label: 'Мониторинг загрязнения — Узгидромет' },
  { href: 'https://gov.uz/ru/eco', label: 'Национальный комитет по экологии' },
];

export function Footer() {
  return (
    <footer className={`${styles.footer} theme-lime`}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <p className={styles.statement}>
            Воздух общий. <br />
            Значит, и решения — тоже.
          </p>
          <a href="#home" className={styles.toTop}>
            Наверх
            <ArrowUp size={18} aria-hidden="true" />
          </a>
        </div>

        <div className={styles.columns}>
          <nav aria-label="Разделы сайта" className={styles.col}>
            <p className={styles.colTitle}>Разделы</p>
            <ul role="list">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Инструменты" className={styles.col}>
            <p className={styles.colTitle}>Инструменты</p>
            <ul role="list">
              {TOOL_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.col}>
            <p className={styles.colTitle}>Источники</p>
            <ul role="list">
              {EXTERNAL.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                    <ArrowUpRight size={14} aria-hidden="true" />
                    <span className="sr-only"> (откроется в новой вкладке)</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="#sources">Все источники и методология</a>
              </li>
            </ul>
          </div>
          <div className={styles.col}>
            <p className={styles.colTitle}>О проекте</p>
            <p className={styles.about}>
              HAVO — образовательная платформа для подростков 13–18 лет в Узбекистане. Очки отражают участие, а не
              измеренное снижение загрязнения. Личный план хранится только в твоём браузере.
            </p>
          </div>
        </div>

        <div className={styles.wordmark} aria-hidden="true">
          <LogoMark size={64} className={styles.mark} />
          <span>HAVO</span>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} HAVO · Сделано для подростков Узбекистана</p>
          <p>Havo — «воздух» по-узбекски</p>
        </div>
      </div>
    </footer>
  );
}
