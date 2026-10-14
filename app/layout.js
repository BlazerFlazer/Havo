// Fonts are bundled from npm (no runtime requests to font CDNs).
import '@fontsource-variable/manrope';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata = {
  title: 'HAVO — будущее воздуха в наших руках',
  description:
    'Платформа для подростков 13–18 лет: как устроено загрязнение воздуха в Узбекистане и какие реальные шаги можно сделать дома, в школе и в своём районе.',
  applicationName: 'HAVO',
  openGraph: {
    title: 'HAVO — будущее воздуха в наших руках',
    description: 'Понять проблему, выбрать реальные действия и отслеживать свой вклад в чистый воздух Узбекистана.',
    locale: 'ru_RU',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#07130f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="skip-link">
          Перейти к содержанию
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
