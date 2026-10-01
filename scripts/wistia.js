/*
 * Wistia helpers shared by blocks that turn authored Wistia links into players
 * (tabs-solutions, columns-podcast).
 */

/**
 * Wistia media id from a fast.wistia.com / fast.wistia.net embed or media URL.
 * @param {string} href
 * @returns {string|null}
 */
// eslint-disable-next-line import/prefer-default-export
export function getWistiaId(href) {
  try {
    const url = new URL(href, window.location.href);
    if (!/(^|\.)wistia\.(com|net)$/.test(url.hostname)) return null;
    const match = url.pathname.match(/\/(?:embed\/)?(?:medias|iframe)\/([a-z0-9]+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
