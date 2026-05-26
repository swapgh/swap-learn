import { PageShell } from "@/components/layout/PageShell";
import { homeBlocks } from "@/config/blocks.config";
import type { Locale } from "@/lib/locale";
import { FeaturedGames } from "./sections/FeaturedGames";
import { featuredGamesContent } from "./sections/FeaturedGames/content";
import { HeroSection } from "./sections/HeroSection";
import { heroSectionContent } from "./sections/HeroSection/content";
import { CallToAction } from "./sections/CallToAction";
import { callToActionContent } from "./sections/CallToAction/content";
import { ShowcaseCarousel } from "./sections/ShowcaseCarousel";
import { showcaseCarouselContent } from "./sections/ShowcaseCarousel/content";

export function HomePage({ locale }: { locale: Locale }) {
  return (
    <>
      {homeBlocks.showcaseCarousel && (
        <ShowcaseCarousel content={showcaseCarouselContent[locale]} />
      )}
      <PageShell>
        {homeBlocks.featuredGames && (
          <FeaturedGames content={featuredGamesContent[locale]} locale={locale} />
        )}
        {homeBlocks.callToAction && (
          <CallToAction content={callToActionContent[locale]} locale={locale} />
        )}
        {homeBlocks.hero && <HeroSection content={heroSectionContent[locale]} locale={locale} />}
      </PageShell>
    </>
  );
}
