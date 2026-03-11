import * as cheerio from 'cheerio';

/**
 * Scrapes a URL and extracts a compact page structure for AI context.
 * Returns null on failure — never blocks test case generation.
 *
 * @param {string} url - Full URL to scrape
 * @returns {string|null} Compact page representation or null
 */
export async function scrapePageContent(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QA-TestCraft/1.0 (Test Case Generator)',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeout);

    console.log(`Scraping ${url} - Response: ${response.text}`);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, noscript, svg, iframe, link, meta').remove();

    const parts = [];

    // Page title
    const title = $('title').first().text().trim();
    if (title) parts.push(`Title: ${title}`);

    // Headings
    const headings = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text) headings.push(`${el.tagName}: ${text}`);
    });
    if (headings.length > 0) parts.push(`Headings:\n${headings.slice(0, 10).join('\n')}`);

    // Forms and inputs
    const forms = [];
    $('form').each((_, form) => {
      const action = $(form).attr('action') || '';
      const method = $(form).attr('method') || 'GET';
      const inputs = [];
      $(form)
        .find('input, select, textarea')
        .each((_, input) => {
          const name = $(input).attr('name') || $(input).attr('id') || '';
          const type = $(input).attr('type') || input.tagName;
          const placeholder = $(input).attr('placeholder') || '';
          if (name || placeholder) {
            inputs.push(`  - ${type}: ${name}${placeholder ? ` (${placeholder})` : ''}`);
          }
        });
      if (inputs.length > 0) {
        forms.push(`Form [${method.toUpperCase()} ${action}]:\n${inputs.join('\n')}`);
      }
    });

    // Standalone inputs outside forms
    const standaloneInputs = [];
    $('input, select, textarea')
      .not('form input, form select, form textarea')
      .each((_, input) => {
        const name = $(input).attr('name') || $(input).attr('id') || '';
        const type = $(input).attr('type') || input.tagName;
        const placeholder = $(input).attr('placeholder') || '';
        if (name || placeholder) {
          standaloneInputs.push(`  - ${type}: ${name}${placeholder ? ` (${placeholder})` : ''}`);
        }
      });
    if (standaloneInputs.length > 0) {
      forms.push(`Standalone inputs:\n${standaloneInputs.slice(0, 10).join('\n')}`);
    }

    if (forms.length > 0) parts.push(forms.join('\n'));

    // Buttons
    const buttons = [];
    $('button, [role="button"], input[type="submit"], input[type="button"]').each((_, btn) => {
      const text =
        $(btn).text().trim().replace(/\s+/g, ' ') ||
        $(btn).attr('value') ||
        $(btn).attr('aria-label') ||
        '';
      if (text && text.length < 50) buttons.push(text);
    });
    if (buttons.length > 0) {
      parts.push(`Buttons: ${[...new Set(buttons)].slice(0, 15).join(', ')}`);
    }

    // Navigation links
    const navLinks = [];
    $('nav a, [role="navigation"] a, header a').each((_, a) => {
      const text = $(a).text().trim().replace(/\s+/g, ' ');
      const href = $(a).attr('href') || '';
      if (text && text.length < 40 && href) {
        navLinks.push(`${text} → ${href}`);
      }
    });
    if (navLinks.length > 0) {
      parts.push(`Navigation:\n${[...new Set(navLinks)].slice(0, 10).join('\n')}`);
    }

    const result = parts.join('\n\n');
    if (!result.trim()) return null;

    // Trim to ~1500 chars to keep token usage low
    return result.length > 1500 ? result.slice(0, 1497) + '...' : result;
  } catch {
    // Graceful failure — scraping is optional
    return null;
  }
}
