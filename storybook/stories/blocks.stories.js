import { blockStory, markupStory } from '../lib/aem-story.js';
import { fixtureFor } from '../lib/fixtures.js';

export default {
  title: 'Blocks',
  tags: ['autodocs'],
};

export const Overview = markupStory(
  'Blocks',
  'Blocks are authored as tables, delivered as rows and cells, and decorated by the matching repository JavaScript and CSS. Blocks are never nested.',
  '<div><h2>Story coverage</h2><p>This catalog includes every block currently present in the repository. Interactive stories run the real block decorator against deterministic authored markup.</p></div>',
);

export const Cards = blockStory('cards', fixtureFor('cards'));
export const CardsAuthors = blockStory('cards-authors', fixtureFor('cards-authors'));
export const CardsCatalog = blockStory('cards-catalog', fixtureFor('cards-catalog'));
export const CardsFeature = blockStory('cards-feature', fixtureFor('cards-feature'));
export const CardsPosts = blockStory('cards-posts', fixtureFor('cards-posts'));
export const CardsPricing = blockStory('cards-pricing', fixtureFor('cards-pricing'));
export const CardsProducts = blockStory('cards-products', fixtureFor('cards-products'));
export const CardsResources = blockStory('cards-resources', fixtureFor('cards-resources'));
export const CardsTools = blockStory('cards-tools', fixtureFor('cards-tools'));
export const Carousel = blockStory('carousel', fixtureFor('carousel'));
export const CarouselTestimonial = blockStory('carousel-testimonial', fixtureFor('carousel-testimonial'));
export const Columns = blockStory('columns', fixtureFor('columns'));
export const ColumnsAwards = blockStory('columns-awards', fixtureFor('columns-awards'));
export const ColumnsCallout = blockStory('columns-callout', fixtureFor('columns-callout'));
export const ColumnsEvent = blockStory('columns-event', fixtureFor('columns-event'));
export const ColumnsLogos = blockStory('columns-logos', fixtureFor('columns-logos'));
export const ColumnsPodcast = blockStory('columns-podcast', fixtureFor('columns-podcast'));
export const ColumnsStats = blockStory('columns-stats', fixtureFor('columns-stats'));
export const ColumnsTopics = blockStory('columns-topics', fixtureFor('columns-topics'));
export const Footer = blockStory('footer', fixtureFor('footer'), {
  docs: 'Uses the production footer CSS with a safe static fixture; the production decorator loads a full AEM fragment.',
});
export const Fragment = blockStory('fragment', fixtureFor('fragment'), {
  docs: 'Shows reusable fragment content without importing the full-page fragment loader.',
});
export const Header = blockStory('header', fixtureFor('header'), {
  docs: 'Uses the production header CSS with a safe static fixture; the production decorator loads navigation fragments and page listeners.',
});
export const Hero = blockStory('hero', fixtureFor('hero'));
export const HeroBanner = blockStory('hero-banner', fixtureFor('hero-banner'));
export const HeroBlog = blockStory('hero-blog', fixtureFor('hero-blog'));
export const HeroSplit = blockStory('hero-split', fixtureFor('hero-split'));
export const SectionMetadata = blockStory('section-metadata', fixtureFor('section-metadata'));
export const Tabs = blockStory('tabs', fixtureFor('tabs'));
export const TabsDeployment = blockStory('tabs-deployment', fixtureFor('tabs-deployment'));
export const TabsSolutions = blockStory('tabs-solutions', fixtureFor('tabs-solutions'));
