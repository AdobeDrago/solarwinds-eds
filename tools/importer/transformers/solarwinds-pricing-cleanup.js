/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SolarWinds pricing page cleanup (template "pricing").
 * No-op for every other template.
 *
 * Selectors verified against migration-work/cleaned.html (pricing page):
 *  - Product / tool icons: <div class="[&_svg]:fill-[currentColor]"><img src="data:image/svg+xml;base64,...">
 *    placed before the row's / card's <h3> product name (18 inside #main-content;
 *    the same wrapper is also used in header/footer chrome, which is out of scope).
 *  - Decorative chevrons: <img src="data:..."> inside "Get a Quote" links.
 *  - Hidden duplicate trial CTAs: <a>...<span>Email Link to Trial</span></a> next to
 *    the visible "Download Trial" / "Start Trial" link (8 occurrences).
 *  - Empty tracking-pixel wrapper: div.builder-9ba72dce3d594944b01dff1ba2a10867
 *    (page-structure.json excluded "rc5").
 *
 * Must run in beforeTransform so parsers see the DA icon URLs. The generic
 * solarwinds-cleanup transformer skips its data:/blob: image removal for this
 * template; this transformer removes the remaining data:/blob: images AFTER
 * the icon mapping.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Product name (H3 text) -> icon uploaded to DA (migration-work/pricing-icons.json).
const DA_ASSETS = 'https://content.da.live/adobedrago/solarwinds-eds/assets';
const PRICING_ICONS = {
  'SolarWinds Observability SaaS': `${DA_ASSETS}/pricing/solarwinds-observability-saas.svg`,
  'SolarWinds Observability Self-Hosted': `${DA_ASSETS}/pricing/solarwinds-observability-self-hosted.svg`,
  'Storage Resource Monitor': `${DA_ASSETS}/pricing/storage-resource-monitor.svg`,
  'Service Desk': `${DA_ASSETS}/pricing/service-desk.svg`,
  'Web Help Desk': `${DA_ASSETS}/pricing/web-help-desk.svg`,
  'SolarWinds SQL Sentry': `${DA_ASSETS}/pricing/solarwinds-sql-sentry.svg`,
  'Database Performance Analyzer': `${DA_ASSETS}/pricing/database-performance-analyzer.svg`,
  'Dameware Remote Everywhere': `${DA_ASSETS}/pricing/dameware-remote-everywhere.svg`,
  'Dameware Mini Remote Control': `${DA_ASSETS}/pricing/dameware-mini-remote-control.svg`,
  'Dameware Remote Support': `${DA_ASSETS}/pricing/dameware-remote-support.svg`,
  "Engineer's Toolset": `${DA_ASSETS}/pricing/engineer-s-toolset.svg`,
  'Kiwi CatTools': `${DA_ASSETS}/pricing/kiwi-cattools.svg`,
  'Kiwi Syslog Server': `${DA_ASSETS}/pricing/kiwi-syslog-server.svg`,
  'Kiwi Log Viewer': `${DA_ASSETS}/pricing/kiwi-log-viewer.svg`,
  'Network Topology Mapper': `${DA_ASSETS}/pricing/network-topology-mapper.svg`,
  'Serv-U File Transfer Protocol Server': `${DA_ASSETS}/pricing/serv-u-file-transfer-protocol-server.svg`,
  'Serv-U Managed File Transfer Server': `${DA_ASSETS}/pricing/serv-u-managed-file-transfer-server.svg`,
  'SolarWinds Incident Response': `${DA_ASSETS}/pricing/solarwinds-incident-response.svg`,
};

function normalizeName(text) {
  return (text || '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[®™]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const ICONS_BY_NAME = Object.fromEntries(
  Object.entries(PRICING_ICONS).map(([name, url]) => [normalizeName(name), url]),
);

// Text of a node, ignoring inline <style>/<script> content.
function textWithoutStyles(node) {
  let text = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) text += child.textContent;
    else if (child.nodeType === 1 && !/^(STYLE|SCRIPT)$/.test(child.tagName)) {
      text += ` ${textWithoutStyles(child)} `;
    }
  });
  return text;
}

// First <h3> that follows `img` inside the closest ancestor containing one.
function findProductHeading(img, root) {
  for (let a = img.parentElement; a && a !== root.parentElement; a = a.parentElement) {
    const following = [...a.querySelectorAll('h3')].find(
      // eslint-disable-next-line no-bitwise
      (h) => img.compareDocumentPosition(h) & 4, // Node.DOCUMENT_POSITION_FOLLOWING
    );
    if (following) return following;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const templateName = payload && payload.template && payload.template.name;
  if (templateName !== 'pricing') return;

  const main = element.querySelector('#main-content') || element;

  if (hookName === TransformHook.beforeTransform) {
    // Inline <style> elements inside headings / text (live page) would leak CSS
    // text into the imported content.
    WebImporter.DOMUtils.remove(main, ['style']);

    // 1. Product / tool icons -> DA asset URLs, keyed by the row's H3 name.
    // (the importer has already turned data: URIs into blob: URLs by the time transformers run)
    main.querySelectorAll('div[class*="fill-[currentColor]"] > img:is([src^="data:"], [src^="blob:"])').forEach((img) => {
      if (img.closest('a, button')) return; // chevrons live inside links
      const heading = findProductHeading(img, main);
      if (!heading) return;
      const url = ICONS_BY_NAME[normalizeName(textWithoutStyles(heading))];
      if (!url) {
        console.warn(`[solarwinds-pricing-cleanup] No DA icon for "${heading.textContent.trim()}"`);
        return;
      }
      img.setAttribute('src', url);
      img.removeAttribute('srcset');
      if (!img.getAttribute('alt')) img.setAttribute('alt', '');
    });

    // 2. Remaining data:/blob: images (chevrons in "Get a Quote" links, etc.).
    //    Runs after the mapping above; whole element, not just #main-content.
    WebImporter.DOMUtils.remove(element, ['img[src^="data:"]', 'img[src^="blob:"]']);

    // 3. Hidden duplicate "Email Link to Trial" CTAs (mobile alternates of the
    //    visible trial button; authoring-analysis.json "excluded").
    main.querySelectorAll('a, button').forEach((el) => {
      if (/^email link to trial$/i.test(el.textContent.replace(/\s+/g, ' ').trim())) el.remove();
    });

    // Empty tracking-pixel wrapper (page-structure.json excluded "rc5").
    WebImporter.DOMUtils.remove(main, ['.builder-9ba72dce3d594944b01dff1ba2a10867']);
  }
}
