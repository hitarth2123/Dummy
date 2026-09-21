const DEFAULT_BASE_URL = 'http://127.0.0.1:9292';

const devdocsBaseUrl = () => (process.env.DEVDOCS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const isCodingQuery = (query) => /\b(code|coding|program|programming|api|algorithm|bug|debug|javascript|typescript|react|node|python|java|html|css|sql|docker|git|express|mongodb|npm|function|class|array|regex)\b/i.test(query || '');

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
};

const searchDevDocs = async (query, options = {}) => {
  if (!isCodingQuery(query)) return { context: '', sources: [] };
  try {
    const docs = await fetchJson(`${devdocsBaseUrl()}/docs.json`);
    if (!Array.isArray(docs)) return { context: '', sources: [] };
    const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
    const matches = docs
      .filter((doc) => terms.some((term) => `${doc.name} ${doc.slug} ${doc.alias || ''}`.toLowerCase().includes(term)))
      .slice(0, options.topK || 2);
    const pages = await Promise.all(matches.map(async (doc) => {
      const index = await fetchJson(`${devdocsBaseUrl()}/docs/${doc.slug}/index.json`);
      const entries = Array.isArray(index?.entries) ? index.entries : [];
      const relevant = entries.filter((entry) => terms.some((term) => `${entry.name} ${entry.path}`.toLowerCase().includes(term))).slice(0, 3);
      return { doc, entries: relevant.length ? relevant : entries.slice(0, 2) };
    }));
    const sources = pages.flatMap(({ doc, entries }) => entries.map((entry) => ({
      chunk_id: `devdocs:${doc.slug}:${entry.path}`,
      source_document: `DevDocs: ${doc.name}`,
      source_type: 'devdocs',
      topic: entry.name,
      score: 1,
      url: `${devdocsBaseUrl()}/#${doc.slug}/${entry.path}`,
    })));
    const context = pages.flatMap(({ doc, entries }) => entries.map((entry) => (
      `[DevDocs: ${doc.name} - ${entry.name}]\n${entry.description || entry.name}\nReference: ${devdocsBaseUrl()}/#${doc.slug}/${entry.path}`
    ))).join('\n\n');
    return { context, sources };
  } catch {
    return { context: '', sources: [] };
  }
};

module.exports = { devdocsBaseUrl, isCodingQuery, searchDevDocs };