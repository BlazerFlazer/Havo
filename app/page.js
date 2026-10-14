import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { Manifest } from '@/components/sections/Manifest';
import { Problem } from '@/components/sections/Problem';
import { Levels } from '@/components/sections/Levels';
import { Actions } from '@/components/sections/Actions';
import { Tools } from '@/components/sections/Tools';
import { Initiatives } from '@/components/sections/Initiatives';
import { Progress } from '@/components/sections/Progress';
import { ActionSheet } from '@/features/actions/ActionSheet';

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Manifest />
        <Problem />
        <Levels />
        <Actions />
        <Tools />
        <Initiatives />
        <Progress />
      </main>
      <Footer />
      <ActionSheet />
    </>
  );
}
