// ============================================================
//  config.js — single source of truth for backend URL + shared utils
// ============================================================

export const API_BASE = 'http://localhost:8000';

export const LANGUAGES = [
  { code: 'en', label: 'English',    dir: 'ltr', api: 'English' },
  { code: 'es', label: 'Español',    dir: 'ltr', api: 'Spanish' },
  { code: 'fr', label: 'Français',   dir: 'ltr', api: 'French' },
  { code: 'ar', label: 'العربية',    dir: 'rtl', api: 'Arabic' },
  { code: 'pt', label: 'Português',  dir: 'ltr', api: 'Portuguese' },
  { code: 'de', label: 'Deutsch',    dir: 'ltr', api: 'German' },
  { code: 'ko', label: '한국어',      dir: 'ltr', api: 'Korean' },
  { code: 'zh', label: '中文(简体)',   dir: 'ltr', api: 'Chinese (Simplified)' },
  { code: 'ja', label: '日本語',      dir: 'ltr', api: 'Japanese' },
  { code: 'tr', label: 'Türkçe',     dir: 'ltr', api: 'Turkish' },
];

export const QUESTION_TYPES = {
  why_winner:        { key: 'why_winner',        label: 'Why did [winner] win?',     icon: 'trophy' },
  why_loser:         { key: 'why_loser',         label: 'Why did [loser] lose?',      icon: 'link' },
  who_dominated:     { key: 'who_dominated',     label: 'Who dominated the match?',   icon: 'zap' },
  who_underperformed:{ key: 'who_underperformed',label: 'Which team underperformed?', icon: 'trending-down' },
  custom:            { key: 'custom',            label: 'Ask your own question',       icon: 'message-circle' },
};

// Country code map for flagcdn — full FIFA member list
export const COUNTRY_CODES = {
  // UEFA (Europe)
  'Albania':                'al', 'Andorra':               'ad', 'Armenia':               'am',
  'Austria':                'at', 'Azerbaijan':            'az', 'Belarus':               'by',
  'Belgium':                'be', 'Bosnia and Herzegovina':'ba', 'Bosnia-Herzegovina':    'ba', 'Bulgaria':              'bg',
  'Croatia':                'hr', 'Cyprus':                'cy', 'Czech Republic':        'cz',
  'Czechia':                'cz', 'Denmark':               'dk', 'England':               'gb-eng',
  'Estonia':                'ee', 'Faroe Islands':         'fo', 'Finland':               'fi',
  'France':                 'fr', 'Georgia':               'ge', 'Germany':               'de',
  'Gibraltar':              'gi', 'Greece':                'gr', 'Hungary':               'hu',
  'Iceland':                'is', 'Ireland':               'ie', 'Israel':                'il',
  'Italy':                  'it', 'Kazakhstan':            'kz', 'Kosovo':                'xk',
  'Latvia':                 'lv', 'Liechtenstein':         'li', 'Lithuania':             'lt',
  'Luxembourg':             'lu', 'Malta':                 'mt', 'Moldova':               'md',
  'Montenegro':             'me', 'Netherlands':           'nl', 'North Macedonia':       'mk',
  'Northern Ireland':       'gb-nir','Norway':             'no', 'Poland':                'pl',
  'Portugal':               'pt', 'Romania':               'ro', 'Russia':                'ru',
  'San Marino':             'sm', 'Scotland':              'gb-sct','Serbia':              'rs',
  'Slovakia':               'sk', 'Slovenia':              'si', 'Spain':                 'es',
  'Sweden':                 'se', 'Switzerland':           'ch', 'Turkey':                'tr',
  'Turkiye':                'tr', 'Ukraine':               'ua', 'Wales':                 'gb-wls',

  // CONMEBOL (South America)
  'Argentina':              'ar', 'Bolivia':               'bo', 'Brazil':                'br',
  'Chile':                  'cl', 'Colombia':              'co', 'Ecuador':               'ec',
  'Paraguay':               'py', 'Peru':                  'pe', 'Uruguay':               'uy',
  'Venezuela':              've',

  // CONCACAF (North/Central America & Caribbean)
  'Antigua and Barbuda':    'ag', 'Aruba':                 'aw', 'Bahamas':               'bs',
  'Barbados':               'bb', 'Belize':                'bz', 'Bermuda':               'bm',
  'British Virgin Islands': 'vg', 'Canada':                'ca', 'Cayman Islands':        'ky',
  'Costa Rica':             'cr', 'Cuba':                  'cu', 'Curaçao':               'cw',
  'Curacao':                'cw', 'Dominica':              'dm', 'Dominican Republic':    'do',
  'El Salvador':            'sv', 'Grenada':               'gd', 'Guatemala':             'gt',
  'Guyana':                 'gy', 'Haiti':                 'ht', 'Honduras':              'hn',
  'Jamaica':                'jm', 'Mexico':                'mx', 'Montserrat':            'ms',
  'Nicaragua':              'ni', 'Panama':                'pa', 'Puerto Rico':           'pr',
  'Saint Kitts and Nevis':  'kn', 'Saint Lucia':           'lc', 'Saint Vincent and the Grenadines': 'vc',
  'Suriname':               'sr', 'Trinidad and Tobago':   'tt', 'Turks and Caicos Islands': 'tc',
  'USA':                    'us', 'United States':         'us', 'US Virgin Islands':     'vi',

  // CAF (Africa)
  'Algeria':                'dz', 'Angola':                'ao', 'Benin':                 'bj',
  'Botswana':               'bw', 'Burkina Faso':          'bf', 'Burundi':               'bi',
  'Cameroon':               'cm', 'Cape Verde':            'cv', 'Cape Verde Islands':    'cv',
  'Central African Republic':'cf','Chad':                  'td', 'Comoros':               'km',
  'Congo':                  'cg', 'Congo DR':              'cd', 'DR Congo':              'cd',
  "Côte d'Ivoire":          'ci', 'Ivory Coast':           'ci', 'Djibouti':              'dj',
  'Egypt':                  'eg', 'Equatorial Guinea':     'gq', 'Eritrea':               'er',
  'Eswatini':               'sz', 'Ethiopia':              'et', 'Gabon':                 'ga',
  'Gambia':                 'gm', 'Ghana':                 'gh', 'Guinea':                'gn',
  'Guinea-Bissau':          'gw', 'Kenya':                 'ke', 'Lesotho':               'ls',
  'Liberia':                'lr', 'Libya':                 'ly', 'Madagascar':            'mg',
  'Malawi':                 'mw', 'Mali':                  'ml', 'Mauritania':            'mr',
  'Mauritius':              'mu', 'Morocco':               'ma', 'Mozambique':            'mz',
  'Namibia':                'na', 'Niger':                 'ne', 'Nigeria':               'ng',
  'Rwanda':                 'rw', 'São Tomé and Príncipe': 'st', 'Senegal':               'sn',
  'Seychelles':             'sc', 'Sierra Leone':          'sl', 'Somalia':               'so',
  'South Africa':           'za', 'South Sudan':           'ss', 'Sudan':                 'sd',
  'Tanzania':               'tz', 'Togo':                  'tg', 'Tunisia':               'tn',
  'Uganda':                 'ug', 'Zambia':                'zm', 'Zimbabwe':              'zw',

  // AFC (Asia)
  'Afghanistan':            'af', 'Australia':             'au', 'Bahrain':               'bh',
  'Bangladesh':             'bd', 'Bhutan':                'bt', 'Brunei':                'bn',
  'Cambodia':               'kh', 'China':                 'cn', "China PR":              'cn',
  'Chinese Taipei':         'tw', 'Guam':                  'gu', 'Hong Kong':             'hk',
  'India':                  'in', 'Indonesia':             'id', 'Iran':                  'ir',
  'Iraq':                   'iq', 'Japan':                 'jp', 'Jordan':                'jo',
  'Kuwait':                 'kw', 'Kyrgyzstan':            'kg', 'Laos':                  'la',
  'Lebanon':                'lb', 'Macau':                 'mo', 'Malaysia':              'my',
  'Maldives':               'mv', 'Mongolia':              'mn', 'Myanmar':               'mm',
  'Nepal':                  'np', 'North Korea':           'kp', 'Oman':                  'om',
  'Pakistan':               'pk', 'Palestine':             'ps', 'Philippines':           'ph',
  'Qatar':                  'qa', 'Saudi Arabia':          'sa', 'Singapore':             'sg',
  'South Korea':            'kr', 'Korea Republic':        'kr', 'Sri Lanka':             'lk',
  'Syria':                  'sy', 'Tajikistan':            'tj', 'Thailand':              'th',
  'Timor-Leste':            'tl', 'Turkmenistan':          'tm', 'UAE':                   'ae',
  'United Arab Emirates':   'ae', 'Uzbekistan':            'uz', 'Vietnam':               'vn',
  'Yemen':                  'ye',

  // OFC (Oceania)
  'American Samoa':         'as', 'Cook Islands':          'ck', 'Fiji':                  'fj',
  'New Caledonia':          'nc', 'New Zealand':           'nz', 'Papua New Guinea':      'pg',
  'Samoa':                  'ws', 'Solomon Islands':       'sb', 'Tahiti':                'pf',
  'Tonga':                  'to', 'Vanuatu':               'vu',

  // ── Common API name variants / abbreviations ──────────────────
  'Türkiye':                'tr', 'Republic of Ireland':   'ie',
  'IR Iran':                'ir', 'Korea DPR':             'kp',
  'DPR Korea':              'kp', 'Republic of Korea':     'kr',
  'Kyrgyz Republic':        'kg', 'FYR Macedonia':         'mk',
  'North Macedonia':        'mk', 'Chinese Taipei':        'tw',
  'Tahiti':                 'pf', 'New Caledonia':         'nc',
  'Sint Maarten':           'sx', 'Curaçao':               'cw',
  'St. Kitts and Nevis':    'kn', 'St. Lucia':             'lc',
  'St. Vincent / Grenadines':'vc','Trinidad & Tobago':     'tt',
  'Antigua & Barbuda':      'ag', 'Bosnia & Herzegovina':  'ba',
  'Sao Tome and Principe':  'st', 'Sao Tome & Principe':  'st',
  'Eq. Guinea':             'gq', 'Equatorial Guinea':     'gq',
  'DR Congo':               'cd', 'Congo DR':              'cd',
  'Cote d\'Ivoire':         'ci', 'Cote dIvoire':          'ci',
  'USA':                    'us', 'U.S.A.':                'us',
  'United States of America':'us','U.S. Virgin Islands':  'vi',
  'Korea Republic':         'kr', 'Korea, Republic of':   'kr',
  'Cabo Verde':             'cv', 'São Tomé e Príncipe':  'st',
  // ── Extra short/common forms ──────────────────────────────────
  'US':                     'us', 'UK':                    'gb',
  'UAE':                    'ae', 'KSA':                   'sa',
  'RSA':                    'za', 'BIH':                   'ba',
  'NED':                    'nl', 'GER':                   'de',
  'ENG':                    'gb-eng', 'SCO':               'gb-sct',
  'WAL':                    'gb-wls', 'NIR':               'gb-nir',
  'CIV':                    'ci', 'CAR':                   'cf',
  'GNB':                    'gw', 'STP':                   'st',
  'CGO':                    'cg', 'COD':                   'cd',
  'Trinidad and Tobago':    'tt', 'Ivory Coast':           'ci',
  'Czechia':                'cz', 'Czech Republic':        'cz',
  'Republic of Congo':      'cg', 'Congo Republic':        'cg',
  'Korea':                  'kr', 'Iran':                  'ir',
};

// ── Flag helpers ──────────────────────────────────────────────

// Valid flagcdn widths: 20, 40, 160, 320, 640
function snapFlagSize(size) {
  if (size <= 20)  return 20;
  if (size <= 40)  return 40;
  if (size <= 160) return 160;
  if (size <= 320) return 320;
  return 640;
}

export function flagUrl(team, size = 40) {
  if (!team) return null;
  const t = team.trim();
  // Exact match first
  const code = COUNTRY_CODES[t] ?? COUNTRY_CODES[t.replace(/\s+/g, ' ')] ?? null;
  if (code) return `https://flagcdn.com/w${snapFlagSize(size)}/${code}.png`;
  // Case-insensitive fallback
  const lower = t.toLowerCase();
  const entry = Object.entries(COUNTRY_CODES).find(([k]) => k.toLowerCase() === lower);
  if (entry) return `https://flagcdn.com/w${snapFlagSize(size)}/${entry[1]}.png`;
  return null;
}

/** Returns <img> or a placeholder <div> — never a broken image */
export function flagImg(team, cls = '', size = 40) {
  const url = flagUrl(team, size);
  if (url) {
    return `<img src="${url}" alt="${team}" class="${cls}" onerror="this.style.display='none'">`;
  }
  return `<div class="${cls} flag-placeholder" title="${team}"></div>`;
}

// ── Wikipedia helpers ─────────────────────────────────────────

export function wikiUrl(name) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`;
}

/**
 * Fetch Wikipedia summary for a name.
 * Returns { title, extract, thumbnail, url } or null.
 *
 * Strategy (in order):
 *  1. Direct REST summary via normalised slug
 *  2. If that misses (404 / no extract), fall back to the Wikipedia
 *     search API to find the best-matching article title, then retry.
 *
 * requireFootballer — when true the extract must mention football-related
 * keywords; deliberately broad to catch managers, coaches, and players
 * whose articles don't open with the word "footballer".
 */
export async function fetchWikiData(name, requireFootballer = false) {
  // ── keyword gate ─────────────────────────────────────────────
  const FOOTBALL_RE = /footballer|soccer player|football manager|football coach|association football|international footballer|national team|World Cup|FIFA|Premier League|La Liga|Serie A|Bundesliga|Ligue 1|UEFA/i;

  // ── normalise name for slug building ─────────────────────────
  // Collapse all apostrophe variants (', ', `) to ASCII apostrophe,
  // then NFC-normalise accents, then URI-encode.
  const normaliseForSlug = (n) =>
    n
      .replace(/[\u2018\u2019\u02BC\u0060]/g, "'")  // curly/modifier apostrophes → '
      .normalize('NFC')
      .replace(/ /g, '_');

  const toSlug = (n) => encodeURIComponent(normaliseForSlug(n));

  // ── fetch one summary URL, return parsed JSON or null ─────────
  const fetchSummary = async (slug) => {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`
      );
      if (!res.ok) return null;
      const d = await res.json();
      return d.extract ? d : null;
    } catch { return null; }
  };

  // ── search API fallback — returns best-match title or null ────
  const searchWiki = async (query) => {
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(query)}` +
        `&srnamespace=0&srlimit=3&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const d = await res.json();
      const hit = d?.query?.search?.[0];
      return hit ? hit.title : null;
    } catch { return null; }
  };

  // ── shape result ──────────────────────────────────────────────
  const shape = (d, fallbackName) => ({
    title:     d.title,
    extract:   d.extract,
    thumbnail: d.thumbnail?.source || null,
    url:       d.content_urls?.desktop?.page || wikiUrl(fallbackName),
  });

  try {
    // 1. Direct lookup
    let d = await fetchSummary(toSlug(name));

    // 2. Search fallback — always try if direct miss, regardless of
    //    whether the returned title looks the same (encoding may differ)
    if (!d) {
      const found = await searchWiki(name);
      if (found) {
        d = await fetchSummary(toSlug(found));
      }
    }

    if (!d) return null;

    // 3. Footballer gate (relaxed)
    if (requireFootballer && !FOOTBALL_RE.test(d.extract)) return null;

    return shape(d, name);
  } catch {
    return null;
  }
}

// ── Language helpers ──────────────────────────────────────────

export function getCurrentLang() {
  return localStorage.getItem('rooster_lang') || 'en';
}

export function setCurrentLang(code) {
  localStorage.setItem('rooster_lang', code);
  const lang = LANGUAGES.find(l => l.code === code);
  if (lang) {
    document.documentElement.setAttribute('dir', lang.dir);
    document.documentElement.setAttribute('lang', code);
  }
}

export function getApiLang() {
  const code = getCurrentLang();
  return LANGUAGES.find(l => l.code === code)?.api || 'English';
}

// ── Player name extraction ────────────────────────────────────

// Regex fallback — covers accented, hyphenated, prefixed names
const SKIP_WORDS = new Set([
  'The','This','That','They','Their','There','These','Then','When','Where',
  'What','Why','Who','Which','How','After','Before','During','Despite','With',
  'World','Cup','Group','Stage','Half','Time','Final','Semi','Quarter','Round',
  'Match','Game','Team','Club','League','Season','Tournament','Championship',
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
  'January','February','March','April','May','June','July','August',
  'September','October','November','December','Premier','Champions',
  'International','National','European','South','North','West','East',
]);

export function extractPlayerNames(text) {
  // Extended regex: handles hyphens (Al-Hussein), accents (Éló), prefixes (De/Van/El/Al)
  const regex = /\b([A-ZÁÉÍÓÚÀÈÌÒÙÄÖÜÑÇÃÕ][a-záéíóúàèìòùäöüñçãõ]+(?:[\s-][A-Za-záéíóúàèìòùäöüñçãõ]+){1,3})\b/g;
  const names = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) {
    const candidate = m[1];
    const parts = candidate.split(/[\s-]/);
    if (parts.length >= 2 && !parts.some(p => SKIP_WORDS.has(p))) {
      names.add(candidate);
    }
  }
  return [...names];
}

// Backend-powered name extraction — uses Groq 8b (fast+cheap), cached per text
// Falls back to regex silently if backend unavailable
export async function extractPlayerNamesFromBackend(text) {
  try {
    const res = await fetch(`${API_BASE}/extract-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('backend unavailable');
    const data = await res.json();
    return data.names || [];
  } catch {
    return extractPlayerNames(text); // regex fallback
  }
}

/**
 * Highlight validated footballer/manager names in HTML.
 * Each name is validated against Wikipedia before highlighting.
 * Returns highlighted HTML string (async).
 */
// ── Per-name color assignment ─────────────────────────────────
const NAME_COLORS = [
  '#E8C547', // yellow-warm
  '#7EB8F7', // soft blue
  '#79E8A2', // mint green
  '#F7A07E', // soft orange
  '#C47EF7', // soft purple
  '#7EF7E8', // teal
  '#F77EAA', // soft pink
  '#B8E87E', // lime
];

function nameColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[hash % NAME_COLORS.length];
}

export async function highlightPlayersAsync(text, names) {
  if (!names.length) return escapeHtml(text);

  // Validate all names concurrently
  const validations = await Promise.all(
    names.map(async name => {
      const data = await fetchWikiData(name, true);
      return data ? name : null;
    })
  );
  const validNames = validations.filter(Boolean);

  if (!validNames.length) return escapeHtml(text);

  const sorted = [...validNames].sort((a, b) => b.length - a.length);
  let result = escapeHtml(text);

  for (const name of sorted) {
    // Use Unicode-aware lookarounds instead of \b so that accented final
    // characters (é, ä, ø …) and names containing apostrophes (N'Golo)
    // are matched correctly. \b treats non-ASCII as a boundary itself.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\p{L}\\p{N}'])${escaped}(?![\\p{L}\\p{N}'])`, 'gu');
    const url = wikiUrl(name);
    result = result.replace(re,
      `<span class="player-hl" data-name="${name}" style="color:${nameColor(name)}">` +
        name +
        `<a href="${url}" target="_blank" rel="noopener" class="hl-link" title="Wikipedia">` +
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` +
        `</a>` +
      `</span>`
    );
  }
  return result;
}

/** Synchronous fallback — no validation, use when already validated */
export function highlightPlayers(text, names) {
  if (!names.length) return text;
  const sorted = [...names].sort((a, b) => b.length - a.length);
  let result = text;
  for (const name of sorted) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\p{L}\\p{N}'])${escaped}(?![\\p{L}\\p{N}'])`, 'gu');
    const url = wikiUrl(name);
    result = result.replace(re,
      `<span class="player-hl" data-name="${name}" style="color:${nameColor(name)}">` +
        name +
        `<a href="${url}" target="_blank" rel="noopener" class="hl-link" title="Wikipedia">` +
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` +
        `</a>` +
      `</span>`
    );
  }
  return result;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
/**
 * Highlight validated names across TWO text blocks (tldr + full narrative)
 * so each name only receives a Wikipedia link on its very first occurrence
 * anywhere in the combined output. Subsequent occurrences are plain text spans
 * (still hoverable via data-name) with no duplicate link icon.
 *
 * Returns { tldrHl, fullHl } — both as HTML strings.
 */
export async function highlightPlayersDeduped(tldr, full, names) {
  if (!names.length) return { tldrHl: escapeHtml(tldr), fullHl: escapeHtml(full) };

  // 1. Validate all names against Wikipedia (same as highlightPlayersAsync)
  const validations = await Promise.all(
    names.map(async name => {
      const data = await fetchWikiData(name, true);
      return data ? name : null;
    })
  );
  const validNames = validations.filter(Boolean);
  if (!validNames.length) return { tldrHl: escapeHtml(tldr), fullHl: escapeHtml(full) };

  // Sort longest first to avoid partial matches
  const sorted = [...validNames].sort((a, b) => b.length - a.length);

  // 2. Track which names have already been linked (first-occurrence wins)
  const linked = new Set();

  const applyHighlights = (text) => {
    let result = escapeHtml(text);
    for (const name of sorted) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![\\p{L}\\p{N}'])${escaped}(?![\\p{L}\\p{N}'])`, 'gu');
      const url = wikiUrl(name);
      const alreadyLinked = linked.has(name);

      // Replace all occurrences in this block; track if we link this pass
      let firstInBlock = true;
      result = result.replace(re, () => {
        if (!alreadyLinked && firstInBlock) {
          // First ever occurrence — full linked highlight
          firstInBlock = false;
          linked.add(name);
          return (
            `<span class="player-hl" data-name="${name}" style="color:${nameColor(name)}">` +
              name +
              `<a href="${url}" target="_blank" rel="noopener" class="hl-link" title="Wikipedia">` +
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` +
              `</a>` +
            `</span>`
          );
        }
        // Subsequent occurrence — hoverable span, NO link icon
        return `<span class="player-hl player-hl-repeat" data-name="${name}" style="color:${nameColor(name)}">${name}</span>`;
      });
    }
    return result;
  };

  // Process tldr first so its names are marked linked before full runs
  const tldrHl = applyHighlights(tldr);
  const fullHl = applyHighlights(full);

  return { tldrHl, fullHl };
}