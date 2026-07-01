import { loadZip } from './zipUtils';

// Pulls <dc:title> / <dc:creator> out of an epub's OPF package document.
// META-INF/container.xml points at the OPF file, which carries the
// actual Dublin Core metadata. Returns nulls (rather than throwing) on
// any parse failure so the caller can fall back to filename/'Unknown'.
export async function extractEpubMetadata(uri) {
  try {
    const zip = await loadZip(uri);

    const containerXml = await zip
      .file('META-INF/container.xml')
      ?.async('text');
    if (!containerXml) return { title: null, author: null };

    const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
    if (!opfPath) return { title: null, author: null };

    const opfFile = zip.file(opfPath);
    if (!opfFile) return { title: null, author: null };
    const opfXml = await opfFile.async('text');

    const title = extractTag(opfXml, 'dc:title') || extractTag(opfXml, 'title');
    const author =
      extractTag(opfXml, 'dc:creator') || extractTag(opfXml, 'creator');

    return { title, author };
  } catch (e) {
    return { title: null, author: null };
  }
}

// Pulls the text content of the first matching tag, ignoring attributes
// (e.g. opf:role="aut" on <dc:creator>).
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  if (!match) return null;
  const value = decodeXmlEntities(match[1].trim());
  return value || null;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
