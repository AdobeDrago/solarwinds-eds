const icon = (name = 'nav-observability', alt = '') => `
  <picture>
    <img src="/icons/${name}.svg" alt="${alt}" width="96" height="96">
  </picture>`;

const link = (label, href = '#') => `<a href="${href}">${label}</a>`;
const button = (label, style = 'primary') => `<p><a href="#" data-button="${style}">${label}</a></p>`;
const cell = (content) => `<div>${content}</div>`;
const row = (...cells) => `<div>${cells.map(cell).join('')}</div>`;

const standardCopy = (title = 'SolarWinds observability') => `
  <h3>${title}</h3>
  <p>See clearly, act decisively, and resolve issues faster with a unified platform.</p>
  ${button('Start free trial')}`;

const cardsFixture = () => [
  row(icon('nav-observability', 'Observability'), standardCopy('Observability')),
  row(icon('nav-database', 'Database'), standardCopy('Database performance')),
  row(icon('nav-itsm', 'IT service management'), standardCopy('IT service management')),
].join('');

const offersFixture = () => [
  row(
    icon('nav-observability', 'Product icon'),
    `<h3>Hybrid Cloud Observability</h3><p><strong>$12</strong></p><p>Per node, per month</p>${
      button('Start free trial')}<p>Fully functional for 30 days</p>`,
    '<p><strong>Unify visibility across your environment.</strong></p><ul><li>Infrastructure</li><li>Applications</li></ul>',
    '<p>Deployment</p><p>SaaS</p>',
  ),
  row(
    icon('nav-database', 'Product icon'),
    `<h3>Database Observability</h3><p><strong>$8</strong></p><p>Per database, per month</p>${
      button('Start free trial')}<p>Fully functional for 30 days</p>`,
    '<p><strong>Find and resolve database bottlenecks.</strong></p><ul><li>Query analysis</li><li>Alerts</li></ul>',
    '<p>Deployment</p><p>Self-Hosted</p>',
  ),
].join('');

const staticHeader = `
  <nav id="nav">
    <div class="nav-brand"><p>${link('SolarWinds', '/')} ${icon('sw-mark', 'SolarWinds')}</p></div>
    <div class="nav-sections"><ul><li>${link('Products')}</li><li>${link('Solutions')}</li><li>${link('Resources')}</li></ul></div>
    <div class="nav-tools"><p>${link('Contact sales')}</p></div>
  </nav>`;

const staticFooter = `
  <div>
    <div class="footer-top">
      <div class="footer-brand">${icon('sw-mark', 'SolarWinds')}</div>
      <div class="footer-columns">
        <div class="footer-col"><h3>Products</h3><ul><li>${link('Observability')}</li><li>${link('Database')}</li></ul></div>
        <div class="footer-col"><h3>Resources</h3><ul><li>${link('Documentation')}</li><li>${link('Support')}</li></ul></div>
      </div>
    </div>
    <div class="footer-copyright"><p>Copyright © SolarWinds Worldwide, LLC.</p></div>
  </div>`;

export function fixtureFor(name) {
  switch (name) {
    case 'cards':
      return cardsFixture();
    case 'cards-authors':
      return row(icon('user', 'Author'), '<h3>Alex Morgan</h3><p>Principal Product Strategist</p><p>Observability</p>');
    case 'cards-catalog':
      return [
        row('<p>Not sure where to start? Contact our product experts.</p>'),
        row('<h2>Monitoring & Observability</h2>'),
        row(
          `<h3><a href="#">Hybrid Cloud Observability</a></h3><p>See everything from anywhere.</p>${
            button('Start trial')}${button('See overview', 'secondary')}`,
          '<p>Product Type</p><p>Observability</p>',
          '<h3>Hybrid Cloud Observability</h3><p>A unified view across networks and systems.</p>',
        ),
        row(
          `<h3><a href="#">Network Performance Monitor</a></h3><p>Multi-vendor network monitoring.</p>${
            button('Start trial')}${button('See overview', 'secondary')}`,
          '<p>Product Type</p><p>Network Management</p>',
          '<h3>Network Performance Monitor</h3><p>Detect and diagnose network issues quickly.</p>',
        ),
      ].join('');
    case 'cards-feature':
      return [
        row(standardCopy('Reduce mean time to resolution')),
        row(standardCopy('Improve service reliability')),
        row(standardCopy('Control operational costs')),
      ].join('');
    case 'cards-posts':
      return [
        row(icon('nav-resource-center', 'Article'), `<p>${link('Observability', '#')}</p><h3>${link('A practical guide to observability', '#')}</h3><p>October 6, 2026</p><p>${link('Alex Morgan', '#')}</p>`),
        row(icon('nav-community', 'Article'), `<p>${link('ITSM', '#')}</p><h3>${link('Building resilient IT services', '#')}</h3><p>September 24, 2026</p><p>${link('Jordan Lee', '#')}</p>`),
      ].join('');
    case 'cards-pricing':
      return [
        row(`<h3>Essentials</h3><p>Starts at:</p><p><strong>$8</strong></p><p>Per month</p>${
          button('Start free trial')}<ul><li>Core monitoring</li><li>Community support</li></ul>`),
        row(`<h3>Advanced</h3><p>Starts at:</p><p><strong>$15</strong></p><p>Per month</p>${
          button('Contact sales')}<ul><li>Full-stack visibility</li><li>Premium support</li></ul>`),
      ].join('');
    case 'cards-products':
    case 'cards-tools':
      return offersFixture();
    case 'cards-resources':
      return [
        row(icon('nav-resource-center', 'Resource'), `<p>Guide</p><h3>${link('The complete observability guide')}</h3>`),
        row(icon('nav-community', 'Resource'), `<p>Webinar</p><h3>${link('Operate with confidence')}</h3>`),
        row(icon('nav-partners', 'Resource'), `<p>Case study</p><h3>${link('Scale without blind spots')}</h3>`),
      ].join('');
    case 'carousel':
      return [
        row(icon('nav-observability', 'Observability'), '<h2>See more, solve faster</h2><p>Unified insights across your technology landscape.</p>'),
        row(icon('nav-database', 'Database'), '<h2>Optimize every database</h2><p>Find performance problems before users do.</p>'),
      ].join('');
    case 'carousel-testimonial':
      return [
        row(icon('sw-mark', 'SolarWinds'), `<p>SolarWinds helps our team understand the full environment.</p><p>${link('Read the story')}</p><p><strong>Jamie Rivera</strong></p><p>Director of IT</p><p>Example Company</p>`),
        row(icon('sw-mark', 'SolarWinds'), '<p>We reduced investigation time and improved service reliability.</p><p><strong>Taylor Chen</strong></p><p>Platform Lead</p><p>Example Company</p>'),
      ].join('');
    case 'columns':
      return row('<h2>Designed for complex environments</h2><p>Flexible monitoring that grows with your organization.</p>', icon('nav-observability', 'Observability'));
    case 'columns-awards':
      return row('<h2>Recognized by customers and analysts</h2>', `${icon('sw-mark', 'Award')}${icon('nav-partners', 'Award')}${icon('nav-community', 'Award')}`);
    case 'columns-callout':
    case 'columns-event':
      return row('<h2>Join SolarWinds Day</h2><p>Learn practical strategies from technology leaders.</p><p><a href="https://www.solarwinds.com/">Register now</a></p>', icon('nav-community', 'SolarWinds event'));
    case 'columns-logos':
      return row('<h2>Trusted by technology teams worldwide</h2>', `${icon('sw-mark', 'Customer logo')}${icon('nav-partners', 'Customer logo')}${icon('nav-community', 'Customer logo')}`);
    case 'columns-podcast':
      return row(`<h2>TechPod: Inside observability</h2><p>${link('Listen to the episode', '#')}</p><p>${link('Observability', '#')}</p><p>October 6, 2026</p>`, icon('nav-resource-center', 'Podcast'));
    case 'columns-stats':
      return row('<p><strong>300K+</strong> customers</p>', '<p><strong>99.9%</strong> availability</p>', '<p><strong>25+</strong> years of innovation</p>');
    case 'columns-topics':
      return row(
        `<h3>${link('Observability')}</h3><p><strong>${link('Understanding service health')}</strong></p><p>October 6 | Alex Morgan</p>`,
        `<h3>${link('ITSM')}</h3><p><strong>${link('Modern service management')}</strong></p><p>October 1 | Jordan Lee</p>`,
      );
    case 'hero-banner':
      return row(`${icon('nav-observability', '')}${icon('nav-database', '')}`, `<h2>Build resilience through visibility</h2><p>See everything. Solve anything.</p>${button('Explore SolarWinds')}`);
    case 'hero-blog':
      return row(icon('nav-resource-center', 'Featured article'), `<h2>${link('A new era of operational resilience')}</h2><p>October 6, 2026</p><p>${link('Alex Morgan')}</p><p>${link('Observability')}</p>`);
    case 'hero-split':
      return row(`<h1>See clearly. Act decisively.</h1><p>Full-stack visibility for modern technology teams.</p>${button('Start free trial')}`, icon('nav-observability', 'SolarWinds platform'));
    case 'tabs':
      return [
        row('<p>Overview</p>', '<h3>Unified visibility</h3><p>Understand service health from every angle.</p>'),
        row('<p>Capabilities</p>', '<h3>Faster troubleshooting</h3><p>Connect signals across the stack.</p>'),
      ].join('');
    case 'tabs-deployment':
      return [
        row('<h2>Choose your deployment</h2>'),
        row('<p><strong>All</strong></p>', '<p>Every product</p>'),
        row('<p>SaaS</p>', '<p>Cloud deployment</p>'),
        row('<p>Self-Hosted</p>', '<p>Customer-managed deployment</p>'),
      ].join('');
    case 'tabs-solutions':
      return [
        row('<p>Observability</p>', `<h3>Full-stack observability</h3><p>Connect data across applications, infrastructure, databases, and networks.</p>${button('Explore observability')}`),
        row('<p>Service Management</p>', `<h3>Modern ITSM</h3><p>Deliver efficient employee services with intuitive workflows.</p>${button('Explore ITSM')}`),
      ].join('');
    case 'footer':
      return staticFooter;
    case 'header':
      return staticHeader;
    case 'fragment':
      return '<div class="default-content-wrapper"><h2>Reusable fragment content</h2><p>Fragments let authors share content across pages.</p></div>';
    case 'hero':
      return '<div><div><h1>Default hero block</h1><p>Hero content supplied by the backend.</p></div></div>';
    case 'section-metadata':
      return row('<p>Style</p>', '<p>Highlight</p>');
    default:
      return row(standardCopy(name));
  }
}

export const widgetFixture = row('<p><a href="/widgets/sample.html?theme=light">SolarWinds status widget</a></p>');
