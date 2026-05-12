/**
 * ============================================================
 *  io/search.js — Velocity Real Web Search Engine
 *
 *  Antigravity Parity: Uses DuckDuckGo Instant Answer API
 *  (no API key required) with a fallback HTML scrape strategy.
 *  This replaces the mock implementation.
 * ============================================================
 */

/**
 * Primary: DuckDuckGo Instant Answer API (JSON, no key needed)
 */
async function fetchDDGInstant(query) {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'VelocityAI/1.0 (Autonomous Swarm)' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
        const data = await res.json();

        const results = [];

        // Abstract (main instant answer)
        if (data.Abstract) {
            results.push({
                title: data.Heading || query,
                url: data.AbstractURL || data.AbstractSource || '',
                snippet: data.Abstract
            });
        }

        // Related topics
        if (data.RelatedTopics) {
            for (const topic of data.RelatedTopics.slice(0, 5)) {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.slice(0, 80),
                        url: topic.FirstURL,
                        snippet: topic.Text
                    });
                }
                // Handle subtopics (nested groups)
                if (topic.Topics) {
                    for (const sub of topic.Topics.slice(0, 2)) {
                        if (sub.Text && sub.FirstURL) {
                            results.push({
                                title: sub.Text.slice(0, 80),
                                url: sub.FirstURL,
                                snippet: sub.Text
                            });
                        }
                    }
                }
            }
        }

        // Results section
        if (data.Results) {
            for (const r of data.Results.slice(0, 3)) {
                results.push({
                    title: r.Text?.slice(0, 80) || query,
                    url: r.FirstURL || '',
                    snippet: r.Text || ''
                });
            }
        }

        return results;
    } catch (e) {
        console.warn(`[Search] DDG Instant API failed: ${e.message}`);
        return [];
    }
}

/**
 * Fallback: DuckDuckGo HTML lite search (scrapes text snippets)
 */
async function fetchDDGLite(query) {
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'VelocityAI/1.0' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) throw new Error(`DDG Lite HTTP ${res.status}`);
        const html = await res.text();

        const results = [];
        // Extract links and snippets from the lite HTML
        const linkRegex = /<a[^>]*class="result-link"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
        const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

        let match;
        const links = [];
        while ((match = linkRegex.exec(html)) !== null) {
            links.push({ url: match[1], title: match[2].trim() });
        }
        const snippets = [];
        while ((match = snippetRegex.exec(html)) !== null) {
            snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
        }

        for (let i = 0; i < Math.min(links.length, 5); i++) {
            results.push({
                title: links[i]?.title || query,
                url: links[i]?.url || '',
                snippet: snippets[i] || links[i]?.title || ''
            });
        }

        return results;
    } catch (e) {
        console.warn(`[Search] DDG Lite scrape failed: ${e.message}`);
        return [];
    }
}

/**
 * Main search entry point — tries instant API first, then lite scrape.
 * Always returns at least a useful result array.
 */
export async function webSearch(query) {
    console.log(`[Search] 🔍 Searching: "${query}"`);

    // Strategy 1: Instant Answer API
    let results = await fetchDDGInstant(query);

    // Strategy 2: Lite HTML scrape fallback
    if (results.length === 0) {
        console.log(`[Search] Falling back to DDG Lite...`);
        results = await fetchDDGLite(query);
    }

    // Strategy 3: Absolute minimum — at least return the query context
    if (results.length === 0) {
        console.warn(`[Search] All strategies exhausted. Returning context stub.`);
        results = [{
            title: `Search context for: ${query}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: `No instant results found. The user should manually visit the search URL for: "${query}".`
        }];
    }

    console.log(`[Search] ✅ Found ${results.length} results.`);
    return results;
}
