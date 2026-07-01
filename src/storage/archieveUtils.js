export const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i;

// Noise every archive tool produces that should never count against — or
// for — the "is this a comic" ratio below.
const IGNORED_NAME =
  /(^|[/\\])(__MACOSX|\.DS_Store|Thumbs\.db|desktop\.ini)([/\\]|$)/i;

// Plain string sort puts "page10.jpg" before "page2.jpg". Comics need
// reading order, so sort numeric runs numerically.
export function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Given a flat list of file paths (no directory entries) from a zip or
// rar listing, decides whether this archive is actually a comic/manga —
// i.e. predominantly page images — rather than some other kind of
// archive that happens to carry a .zip/.rar/.cbz/.cbr extension.
//
// A ratio-based check (rather than "every entry must be an image") is
// deliberate: real scanlation releases routinely ship one ComicInfo.xml,
// a credits .txt, or an oddly-named cover file alongside the pages.
// Requiring 100% images would reject perfectly normal comics.
export function classifyArchiveEntries(allPaths) {
  const paths = allPaths.filter(p => !IGNORED_NAME.test(p));
  if (paths.length === 0) return { isComic: false, pages: [] };

  const images = paths.filter(p => IMAGE_EXT.test(p)).sort(naturalCompare);
  const ratio = images.length / paths.length;

  // Need at least one page and an overwhelming majority of the archive
  // to be images. Below this ratio it's something else — a mod archive,
  // a document bundle, a random folder someone zipped up.
  const isComic = images.length > 0 && ratio >= 0.9;
  return { isComic, pages: isComic ? images : [] };
}
