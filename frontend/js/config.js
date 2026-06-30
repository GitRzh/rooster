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

  // ── search API fallback — returns up to N candidate titles ────
  const searchWiki = async (query, limit = 5) => {
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(query)}` +
        `&srnamespace=0&srlimit=${limit}&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const d = await res.json();
      return (d?.query?.search || []).map(h => h.title);
    } catch { return []; }
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

    // 2. Direct hit but fails the football gate (e.g. wrong namesake at the
    //    exact slug) — don't trust it blindly, fall through to disambiguation.
    if (d && requireFootballer && !FOOTBALL_RE.test(d.extract)) d = null;

    // 3. Search fallback — try a football-biased query first so a same-named
    //    footballer doesn't get buried under a more famous non-footballer.
    //    Check EVERY candidate against the football gate, not just the top hit.
    if (!d) {
      const queries = requireFootballer
        ? [`${name} footballer`, `${name} football manager`, name]
        : [name];

      outer:
      for (const q of queries) {
        const candidates = await searchWiki(q);
        for (const candidate of candidates) {
          const candDoc = await fetchSummary(toSlug(candidate));
          if (!candDoc) continue;
          if (requireFootballer && !FOOTBALL_RE.test(candDoc.extract)) continue;
          d = candDoc;
          break outer;
        }
      }
    }

    if (!d) return null;

    // 4. Final footballer gate (belt-and-braces — should already be satisfied above)
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

// ── UI Translations ───────────────────────────────────────────
// Static strings for UI chrome — LLM output is already translated server-side.
// Keys map to the language codes in LANGUAGES above.
// RTL note: Arabic strings are written in natural RTL flow; no forced LTR.

const UI_STRINGS = {
  // ── Stage 1: Hero search bar ─────────────────────────────────
  hero_search_placeholder: {
    en: 'Search match using team name',
    es: 'Buscar partido por nombre de equipo',
    fr: 'Rechercher un match par nom d\u2019équipe',
    ar: 'ابحث عن مباراة باسم الفريق',
    pt: 'Buscar partida pelo nome do time',
    de: 'Spiel anhand des Mannschaftsnamens suchen',
    ko: '팀 이름으로 경기 검색',
    zh: '按球队名称搜索比赛',
    ja: 'チーム名で試合を検索',
    tr: 'Takım adıyla maç ara',
  },
  hero_search_by_date: {
    en: 'Search by date',
    es: 'Buscar por fecha',
    fr: 'Rechercher par date',
    ar: 'ابحث حسب التاريخ',
    pt: 'Buscar por data',
    de: 'Nach Datum suchen',
    ko: '날짜로 검색',
    zh: '按日期搜索',
    ja: '日付で検索',
    tr: 'Tarihe göre ara',
  },
  // ── Stage 2: Question card titles ────────────────────────────
  q_why_winner_title: {
    en: 'Why did they win?',      es: '¿Por qué ganaron?',
    fr: 'Pourquoi ont-ils gagné ?', ar: 'لماذا فازوا؟',
    pt: 'Por que venceram?',      de: 'Warum haben sie gewonnen?',
    ko: '왜 이겼나요?',             zh: '他们为何获胜？',
    ja: 'なぜ勝ったのか？',          tr: 'Neden kazandılar?',
  },
  q_why_winner_sub: {
    en: 'Decisive factors and key moments',
    es: 'Factores decisivos y momentos clave',
    fr: 'Facteurs décisifs et moments clés',
    ar: 'العوامل الحاسمة والحظات المحورية',
    pt: 'Fatores decisivos e momentos-chave',
    de: 'Entscheidende Faktoren und Schlüsselmomente',
    ko: '결정적 요인과 핵심 순간들',
    zh: '决定性因素与关键时刻',
    ja: '決定的な要因と重要な瞬間',
    tr: 'Belirleyici faktörler ve kilit anlar',
  },
  q_why_loser_title: {
    en: 'Why did they lose?',     es: '¿Por qué perdieron?',
    fr: 'Pourquoi ont-ils perdu ?', ar: 'لماذا خسروا؟',
    pt: 'Por que perderam?',      de: 'Warum haben sie verloren?',
    ko: '왜 졌나요?',               zh: '他们为何失败？',
    ja: 'なぜ負けたのか？',          tr: 'Neden kaybettiler?',
  },
  q_why_loser_sub: {
    en: 'What cost them the match?',
    es: '¿Qué les costó el partido?',
    fr: 'Ce qui leur a coûté le match',
    ar: 'ما الذي أضاع المباراة؟',
    pt: 'O que custou a partida?',
    de: 'Was hat sie das Spiel gekostet?',
    ko: '무엇이 경기를 잃게 했나요?',
    zh: '是什么葬送了这场比赛？',
    ja: '何が試合を決めたのか？',
    tr: 'Maçı kaybettiren neydi?',
  },
  q_who_dominated_title: {
    en: 'Who ran the show?',       es: '¿Quién dominó el partido?',
    fr: 'Qui a dominé le match ?', ar: 'من أدار المباراة؟',
    pt: 'Quem dominou o jogo?',    de: 'Wer hat das Spiel dominiert?',
    ko: '누가 경기를 지배했나요?',    zh: '谁主导了比赛？',
    ja: '誰が試合を支配したのか？',   tr: 'Maça kim hâkim oldu?',
  },
  q_who_dominated_sub: {
    en: 'The entity that dominated',
    es: 'El dominador del encuentro',
    fr: 'L\'entité qui a dominé',
    ar: 'الجهة المسيطرة على المباراة',
    pt: 'A entidade que dominou',
    de: 'Die dominierende Partei',
    ko: '경기를 지배한 주체',
    zh: '主导比赛的一方',
    ja: '試合を支配したもの',
    tr: 'Maçı domine eden taraf',
  },
  q_who_underperformed_title: {
    en: 'Who was underwhelming?',       es: '¿Quién decepcionó?',
    fr: 'Qui a déçu ?',                ar: 'من خذل الجمهور؟',
    pt: 'Quem decepcionou?',           de: 'Wer hat enttäuscht?',
    ko: '누가 기대에 못 미쳤나요?',       zh: '谁令人失望？',
    ja: '誰が期待外れだったのか？',       tr: 'Kim hayal kırıklığı yarattı?',
  },
  q_who_underperformed_sub: {
    en: 'Failed to show up when it mattered',
    es: 'No apareció en los momentos clave',
    fr: 'Absent quand il le fallait',
    ar: 'لم يظهر حين دعت الحاجة',
    pt: 'Não apareceu na hora certa',
    de: 'War nicht da, als es zählte',
    ko: '중요한 순간에 나타나지 않은',
    zh: '关键时刻缺席',
    ja: '肝心な時に存在感がなかった',
    tr: 'Kritik anlarda ortaya çıkamadı',
  },
  q_custom_title: {
    en: 'Ask your own question',   es: 'Haz tu propia pregunta',
    fr: 'Posez votre question',    ar: 'اطرح سؤالك الخاص',
    pt: 'Faça sua própria pergunta', de: 'Stell deine eigene Frage',
    ko: '직접 질문하기',              zh: '提出你的问题',
    ja: '自分で質問する',             tr: 'Kendi sorunuzu sorun',
  },
  q_custom_sub: {
    en: 'Q&A — anything about this match',
    es: 'P&R — cualquier cosa sobre este partido',
    fr: 'Q&R — tout sur ce match',
    ar: 'أسئلة وأجوبة — أي شيء عن هذه المباراة',
    pt: 'P&R — qualquer coisa sobre este jogo',
    de: 'F&A — alles über dieses Spiel',
    ko: 'Q&A — 이 경기에 관한 모든 것',
    zh: '问答 — 关于本场比赛的一切',
    ja: 'Q&A — この試合について何でも',
    tr: 'S&C — bu maçla ilgili her şey',
  },
  // ── Tooltip ───────────────────────────────────────────────────
  tooltip_title: {
    en: 'What can I ask?',    es: '¿Qué puedo preguntar?',
    fr: 'Que puis-je demander ?', ar: 'ماذا يمكنني أن أسأل؟',
    pt: 'O que posso perguntar?', de: 'Was kann ich fragen?',
    ko: '무엇을 질문할 수 있나요?', zh: '我能问什么？',
    ja: '何を聞けばいいの？',      tr: 'Ne sorabilirim?',
  },
  tooltip_ask_about_label: {
    en: 'Ask about',    es: 'Puedes preguntar',
    fr: 'Vous pouvez demander', ar: 'يمكنك السؤال عن',
    pt: 'Pode perguntar',       de: 'Frag nach',
    ko: '질문 가능',             zh: '可以问',
    ja: '聞けること',            tr: 'Sorabilirsin',
  },
  tooltip_ask_about_body: {
    en: 'Tactics & formations · Player performances · Goals & key moments · Manager decisions · "What if" scenarios · Referee calls · Match momentum',
    es: 'Tácticas y formaciones · Rendimientos · Goles y momentos clave · Decisiones del técnico · Escenarios "¿Y si…?" · Árbitro · Momentum',
    fr: 'Tactiques & formations · Performances · Buts & moments clés · Décisions du coach · "Et si…" · Arbitrage · Momentum',
    ar: 'التكتيكات والتشكيلات · أداء اللاعبين · الأهداف واللحظات المحورية · قرارات المدرب · سيناريوهات "ماذا لو" · قرارات الحكم · زخم المباراة',
    pt: 'Táticas e formações · Desempenhos · Gols e momentos · Decisões do técnico · "E se…" · Árbitro · Momentum',
    de: 'Taktik & Formation · Leistungen · Tore & Schlüsselmomente · Trainerentscheidungen · "Was wäre wenn…" · Schiedsrichter · Spielfluss',
    ko: '전술 & 포메이션 · 선수 퍼포먼스 · 골 & 주요 순간 · 감독 결정 · "만약에" 시나리오 · 심판 판정 · 경기 흐름',
    zh: '战术与阵型 · 球员表现 · 进球与关键时刻 · 主教练决策 · "如果"假设 · 裁判判罚 · 比赛走势',
    ja: '戦術＆フォーメーション · 選手パフォーマンス · ゴール＆重要な場面 · 監督の決断 · 「もし…」の仮定 · 審判の判定 · 試合の流れ',
    tr: 'Taktikler & formasyonlar · Oyuncu performansları · Goller & kilit anlar · Teknik direktör kararları · "Ya olsaydı" senaryoları · Hakem kararları · Maç ivmesi',
  },
  tooltip_wont_work_label: {
    en: "Won't work",    es: 'No funcionará',
    fr: 'Ne fonctionnera pas', ar: 'لن ينجح',
    pt: 'Não vai funcionar',  de: 'Funktioniert nicht',
    ko: '안 되는 것',           zh: '不支持',
    ja: '使えないもの',          tr: 'Çalışmaz',
  },
  tooltip_wont_work_body: {
    en: "Single letters or gibberish · Topics unrelated to this match (cooking, politics, coding…)",
    es: "Letras sueltas o sin sentido · Temas ajenos al partido (cocina, política, código…)",
    fr: "Lettres isolées ou charabia · Sujets sans rapport avec le match (cuisine, politique, code…)",
    ar: "أحرف منفردة أو كلام غير مفهوم · مواضيع لا علاقة لها بالمباراة (طبخ، سياسة، برمجة…)",
    pt: "Letras soltas ou nonsense · Assuntos não relacionados ao jogo (culinária, política, código…)",
    de: "Einzelne Buchstaben oder Unsinn · Themen ohne Bezug zum Spiel (Kochen, Politik, Code…)",
    ko: "단일 문자 또는 의미 없는 입력 · 경기와 무관한 주제 (요리, 정치, 코딩…)",
    zh: "单个字母或乱码 · 与本场比赛无关的话题（烹饪、政治、编程…）",
    ja: "一文字や意味不明な入力 · 試合と無関係なトピック（料理・政治・コーディング…）",
    tr: "Tek harfler veya anlamsız metin · Maçla ilgisiz konular (yemek, siyaset, kod…)",
  },
  tooltip_examples_label: {
    en: 'Examples',    es: 'Ejemplos',
    fr: 'Exemples',    ar: 'أمثلة',
    pt: 'Exemplos',    de: 'Beispiele',
    ko: '예시',         zh: '示例',
    ja: '例',           tr: 'Örnekler',
  },
  tooltip_examples_body: {
    en: '"Why didn\'t the manager sub earlier?"<br>"Who was the best player on the pitch?"<br>"What if [Player] had started from the first minute?"',
    es: '"¿Por qué el técnico no hizo cambios antes?"<br>"¿Quién fue el mejor jugador?"<br>"¿Y si [Jugador] hubiera empezado desde el principio?"',
    fr: '"Pourquoi le coach n\'a-t-il pas fait de changement plus tôt ?"<br>"Qui était le meilleur joueur sur le terrain ?"<br>"Et si [Joueur] avait commencé dès la première minute ?"',
    ar: '"لماذا لم يُجرِ المدرب تغييرات مبكراً؟"<br>"من كان أفضل لاعب في الملعب؟"<br>"ماذا لو بدأ [اللاعب] من الدقيقة الأولى؟"',
    pt: '"Por que o técnico não fez substituições antes?"<br>"Quem foi o melhor jogador em campo?"<br>"E se [Jogador] tivesse começado desde o início?"',
    de: '"Warum hat der Trainer nicht früher gewechselt?"<br>"Wer war der beste Spieler auf dem Platz?"<br>"Was wäre wenn [Spieler] von der ersten Minute an gespielt hätte?"',
    ko: '"왜 감독은 더 일찍 교체하지 않았나요?"<br>"가장 활약한 선수는 누구인가요?"<br>"만약 [선수]가 처음부터 선발이었다면?"',
    zh: '"为什么主教练没有更早换人？"<br>"场上表现最好的球员是谁？"<br>"如果[球员]从第一分钟就首发会怎样？"',
    ja: '"なぜ監督はもっと早く交代させなかったのか？"<br>"ピッチで最も活躍した選手は誰ですか？"<br>"もし[選手]が最初からスタートしていたら？"',
    tr: '"Teknik direktör neden daha erken oyuncu değiştirmedi?"<br>"Sahada en iyi oynayan kimdi?"<br>"[Oyuncu] ilk dakikadan oynasaydı ne olurdu?"',
  },
  // ── Stage 2: Q custom input placeholder ──────────────────────
  q_custom_placeholder: {
    en: 'Enter your question here…',
    es: 'Escribe tu pregunta aquí…',
    fr: 'Entrez votre question ici…',
    ar: 'أدخل سؤالك هنا…',
    pt: 'Digite sua pergunta aqui…',
    de: 'Gib deine Frage hier ein…',
    ko: '여기에 질문을 입력하세요…',
    zh: '在此输入您的问题…',
    ja: 'ここに質問を入力してください…',
    tr: 'Sorunuzu buraya yazın…',
  },
  // ── Stage 2: CTA button ───────────────────────────────────────
  analyze_btn: {
    en: 'Analyze',        es: 'Analizar',
    fr: 'Analyser',       ar: 'تحليل',
    pt: 'Analisar',       de: 'Analysieren',
    ko: '분석하기',         zh: '分析',
    ja: '分析する',         tr: 'Analiz Et',
  },
  // ── Stage 2: "Too short" reject message ───────────────────────
  q_too_short: {
    en: '⚠ Invalid.',             es: '⚠ Inválido.',
    fr: '⚠ Invalide.',            ar: '⚠ غير صالح.',
    pt: '⚠ Inválido.',            de: '⚠ Ungültig.',
    ko: '⚠ 유효하지 않습니다.',      zh: '⚠ 无效。',
    ja: '⚠ 無効です。',            tr: '⚠ Geçersiz.',
  },
  // ── Stage 3: Loading label ────────────────────────────────────
  loading_analyzing: {
    en: 'Analyzing',    es: 'Analizando',
    fr: 'Analyse en cours', ar: 'جارٍ التحليل',
    pt: 'Analisando',   de: 'Wird analysiert',
    ko: '분석 중',        zh: '分析中',
    ja: '分析中',         tr: 'Analiz ediliyor',
  },
  // ── Stage 4: Answer card heads ────────────────────────────────
  tldr: {
    en: 'TL;DR',       es: 'Resumen',
    fr: 'En bref',     ar: 'ملخص',
    pt: 'Resumo',      de: 'Kurzfassung',
    ko: '요약',          zh: '简述',
    ja: '要約',          tr: 'Özet',
  },
  full_narrative: {
    en: 'Full Narrative',      es: 'Narrativa completa',
    fr: 'Récit complet',       ar: 'السرد الكامل',
    pt: 'Narrativa completa',  de: 'Vollständige Erzählung',
    ko: '전체 분석',             zh: '完整叙述',
    ja: '詳細分析',              tr: 'Tam Anlatı',
  },
  // ── Stage 4: Result nav ───────────────────────────────────────
  questions_btn: {
    en: 'Questions',      es: 'Preguntas',
    fr: 'Questions',      ar: 'الأسئلة',
    pt: 'Perguntas',      de: 'Fragen',
    ko: '질문 목록',        zh: '问题列表',
    ja: '質問一覧',         tr: 'Sorular',
  },
  ask_again_btn: {
    en: 'Ask Again',      es: 'Preguntar de nuevo',
    fr: 'Redemander',     ar: 'اسأل مجدداً',
    pt: 'Perguntar novamente', de: 'Nochmal fragen',
    ko: '다시 질문하기',    zh: '再次提问',
    ja: 'もう一度聞く',     tr: 'Tekrar Sor',
  },
  off_topic_msg: {
    en: 'I only analyse football matches. Ask me something about this game.',
    es: 'Solo analizo partidos de fútbol. Pregúntame algo sobre este partido.',
    fr: 'Je n\'analyse que les matchs de football. Posez-moi une question sur ce match.',
    ar: 'أنا أحلل مباريات كرة القدم فقط. اسألني شيئاً عن هذه المباراة.',
    pt: 'Só analiso partidas de futebol. Pergunte-me algo sobre este jogo.',
    de: 'Ich analysiere nur Fußballspiele. Frag mich etwas über dieses Spiel.',
    ko: '저는 축구 경기만 분석합니다. 이 경기에 대해 질문해 주세요.',
    zh: '我只分析足球比赛。请向我提问关于这场比赛的问题。',
    ja: '私はサッカーの試合のみ分析します。この試合について質問してください。',
    tr: 'Sadece futbol maçlarını analiz ederim. Bu maç hakkında bir şey sor.',
  },
  off_topic_hint: {
    en: 'Try: tactics, players, goals, moments, decisions, "what if…"',
    es: 'Prueba: tácticas, jugadores, goles, momentos, decisiones, "¿y si…?"',
    fr: 'Essayez : tactiques, joueurs, buts, moments, décisions, "et si…"',
    ar: 'جرب: التكتيكات، اللاعبين، الأهداف، اللحظات، القرارات، "ماذا لو…"',
    pt: 'Tente: táticas, jogadores, gols, momentos, decisões, "e se…"',
    de: 'Versuche: Taktik, Spieler, Tore, Momente, Entscheidungen, "was wäre wenn…"',
    ko: '시도해 보세요: 전술, 선수, 골, 순간, 결정, "만약에…"',
    zh: '试试：战术、球员、进球、关键时刻、决策、"如果…"',
    ja: '試してみて：戦術、選手、ゴール、場面、決断、「もし…」',
    tr: 'Dene: taktikler, oyuncular, goller, anlar, kararlar, "ya olsaydı…"',
  },
  preview_btn: {
    en: 'Preview',        es: 'Vista previa',
    fr: 'Aperçu',         ar: 'معاينة',
    pt: 'Pré-estreia',    de: 'Vorschau',
    ko: '프리뷰',           zh: '预览',
    ja: 'プレビュー',        tr: 'Önizleme',
  },
  // ── Stage 4: Sidebar label ────────────────────────────────────
  hover_hint: {
    en: 'Click a highlighted name to see their profile here.',
    es: 'Haz clic en un nombre destacado para ver su perfil.',
    fr: 'Cliquez sur un nom en surbrillance pour voir son profil.',
    ar: 'انقر على اسم مضاء لعرض ملفه هنا.',
    pt: 'Clique em um nome destacado para ver o perfil.',
    de: 'Klicke auf einen markierten Namen für das Profil.',
    ko: '강조된 이름을 클릭하여 프로필을 확인하세요.',
    zh: '点击高亮名称以查看其资料。',
    ja: 'ハイライトされた名前をクリックしてください。',
    tr: 'Profili görmek için vurgulanan bir isme tıklayın.',
  },
  player_info: {
    en: 'Player Info',       es: 'Info del jugador',
    fr: 'Infos joueur',      ar: 'معلومات اللاعب',
    pt: 'Info do jogador',   de: 'Spielerinfo',
    ko: '선수 정보',           zh: '球员信息',
    ja: '選手情報',            tr: 'Oyuncu Bilgisi',
  },
  manager_info: {
    en: 'Manager Info',      es: 'Info del técnico',
    fr: 'Infos entraîneur',  ar: 'معلومات المدرب',
    pt: 'Info do técnico',   de: 'Trainerinfo',
    ko: '감독 정보',           zh: '主教练信息',
    ja: '監督情報',            tr: 'Teknik Direktör Bilgisi',
  },
  // ── Stage 4: Entity stat labels ───────────────────────────────
  stat_nationality: {
    en: 'Nationality',   es: 'Nacionalidad',
    fr: 'Nationalité',   ar: 'الجنسية',
    pt: 'Nacionalidade', de: 'Nationalität',
    ko: '국적',           zh: '国籍',
    ja: '国籍',           tr: 'Milliyet',
  },
  stat_position: {
    en: 'Position',   es: 'Posición',
    fr: 'Poste',      ar: 'المركز',
    pt: 'Posição',    de: 'Position',
    ko: '포지션',      zh: '位置',
    ja: 'ポジション', tr: 'Mevki',
  },
  stat_club: {
    en: 'Club',   es: 'Club',
    fr: 'Club',   ar: 'النادي',
    pt: 'Clube',  de: 'Verein',
    ko: '클럽',    zh: '俱乐部',
    ja: 'クラブ',  tr: 'Kulüp',
  },
  stat_age: {
    en: 'Age',   es: 'Edad',
    fr: 'Âge',   ar: 'العمر',
    pt: 'Idade', de: 'Alter',
    ko: '나이',   zh: '年龄',
    ja: '年齢',   tr: 'Yaş',
  },
  stat_wc_goals: {
    en: 'FIFA 2026 Goals',   es: 'Goles FIFA 2026',
    fr: 'Buts FIFA 2026',    ar: 'أهداف كأس العالم 2026',
    pt: 'Gols FIFA 2026',    de: 'FIFA 2026 Tore',
    ko: 'FIFA 2026 골',       zh: 'FIFA 2026 进球',
    ja: 'FIFA 2026 ゴール',   tr: 'FIFA 2026 Golleri',
  },
  stat_awards: {
    en: 'Awards',    es: 'Premios',
    fr: 'Récompenses', ar: 'الجوائز',
    pt: 'Prêmios',   de: 'Auszeichnungen',
    ko: '수상',        zh: '奖项',
    ja: '受賞歴',      tr: 'Ödüller',
  },
  stat_currently_manages: {
    en: 'Currently Manages',   es: 'Dirige actualmente',
    fr: 'Entraîne actuellement', ar: 'يدرب حالياً',
    pt: 'Gerencia atualmente',  de: 'Aktueller Verein',
    ko: '현재 지도 팀',           zh: '现执教球队',
    ja: '現在の監督チーム',        tr: 'Şu An Yönetiyor',
  },
  stat_previously_managed: {
    en: 'Previously Managed',   es: 'Dirigió anteriormente',
    fr: 'Anciennement entraîneur de', ar: 'دَرَّب سابقاً',
    pt: 'Gerenciou anteriormente', de: 'Frühere Vereine',
    ko: '이전 지도 팀',             zh: '曾执教球队',
    ja: '以前の監督チーム',          tr: 'Daha Önce Yönetti',
  },
  stat_years_active: {
    en: 'Years Active',   es: 'Años activo',
    fr: 'Années actif',   ar: 'سنوات النشاط',
    pt: 'Anos ativos',    de: 'Aktive Jahre',
    ko: '활동 기간',        zh: '执教年限',
    ja: '活動期間',         tr: 'Aktif Yıllar',
  },
  stat_trophies: {
    en: 'Trophies',   es: 'Trofeos',
    fr: 'Trophées',   ar: 'الألقاب',
    pt: 'Troféus',    de: 'Trophäen',
    ko: '트로피',       zh: '荣誉',
    ja: 'タイトル',     tr: 'Kupalar',
  },
  // ── Stage 2: Draw badge ───────────────────────────────────────
  draw_match: {
    en: 'Match was a draw', es: 'El partido fue empate',
    fr: 'Match nul',        ar: 'المباراة انتهت بالتعادل',
    pt: 'Empate',           de: 'Unentschieden',
    ko: '무승부 경기',        zh: '平局',
    ja: '引き分け',           tr: 'Berabere bitti',
  },
  // ── Nav links ─────────────────────────────────────────────────
  nav_home: {
    en: 'Home',       es: 'Inicio',
    fr: 'Accueil',    ar: 'الرئيسية',
    pt: 'Início',     de: 'Startseite',
    ko: '홈',          zh: '首页',
    ja: 'ホーム',       tr: 'Ana Sayfa',
  },
  nav_analysis: {
    en: 'Analysis',   es: 'Análisis',
    fr: 'Analyse',    ar: 'تحليل',
    pt: 'Análise',    de: 'Analyse',
    ko: '분석',         zh: '分析',
    ja: '分析',         tr: 'Analiz',
  },
  nav_preview: {
    en: 'Preview',    es: 'Vista previa',
    fr: 'Aperçu',     ar: 'معاينة',
    pt: 'Pré-estreia', de: 'Vorschau',
    ko: '프리뷰',       zh: '预览',
    ja: 'プレビュー',    tr: 'Önizleme',
  },
  nav_tech: {
    en: 'Used Tech',  es: 'Tecnología',
    fr: 'Tech utilisée', ar: 'التقنية',
    pt: 'Tecnologia', de: 'Technologie',
    ko: '사용 기술',    zh: '技术栈',
    ja: '使用技術',     tr: 'Kullanılan Teknoloji',
  },
  // ── Stage 1: Hero page ───────────────────────────────────────
  insight_btn: {
    en: 'Analyze',    es: 'Analizar',
    fr: 'Analyser',   ar: 'تحليل',
    pt: 'Analisar',   de: 'Analysieren',
    ko: '분석',         zh: '分析',
    ja: '分析する',      tr: 'Analiz Et',
  },
  analyze_match_btn: {
    en: 'Analyze',             es: 'Analizar',
    fr: 'Analyser',            ar: 'تحليل',
    pt: 'Analisar',            de: 'Analysieren',
    ko: '분석하기',              zh: '分析',
    ja: '分析する',              tr: 'Analiz Et',
  },
  upcoming_no_analysis: {
    en: 'Upcoming · No analysis yet',        es: 'Próximo · Sin análisis aún',
    fr: 'À venir · Pas encore d\'analyse',   ar: 'قادم · لا تحليل بعد',
    pt: 'Em breve · Sem análise ainda',      de: 'Demnächst · Noch keine Analyse',
    ko: '예정 · 아직 분석 없음',              zh: '即将开始 · 暂无分析',
    ja: '予定 · まだ分析なし',               tr: 'Yaklaşan · Henüz analiz yok',
  },
  search_placeholder: {
    en: 'Search team or match…',         es: 'Buscar equipo o partido…',
    fr: 'Chercher une équipe ou un match…', ar: 'ابحث عن فريق أو مباراة…',
    pt: 'Buscar equipe ou partida…',     de: 'Team oder Spiel suchen…',
    ko: '팀 또는 경기 검색…',              zh: '搜索队伍或比赛…',
    ja: 'チームまたは試合を検索…',          tr: 'Takım veya maç ara…',
  },
  section_finished: {
    en: 'Finished',    es: 'Finalizados',
    fr: 'Terminés',    ar: 'منتهية',
    pt: 'Finalizados', de: 'Beendet',
    ko: '종료된 경기',   zh: '已结束',
    ja: '終了',         tr: 'Bitti',
  },
  section_upcoming: {
    en: 'Upcoming',    es: 'Próximos',
    fr: 'À venir',     ar: 'القادمة',
    pt: 'Próximos',    de: 'Bevorstehend',
    ko: '예정된 경기',   zh: '即将进行',
    ja: '予定',         tr: 'Yaklaşan',
  },
  section_featured: {
    en: 'Featured',    es: 'Destacado',
    fr: 'En vedette',  ar: 'مميز',
    pt: 'Destaque',    de: 'Empfohlen',
    ko: '추천',          zh: '精选',
    ja: '注目',          tr: 'Öne Çıkan',
  },
  section_pinned: {
    en: 'Pinned',      es: 'Fijado',
    fr: 'Épinglé',     ar: 'مثبت',
    pt: 'Fixado',      de: 'Angeheftet',
    ko: '고정됨',        zh: '已置顶',
    ja: '固定済み',      tr: 'Sabitlenmiş',
  },
  featured_match: {
    en: 'Featured Match',   es: 'Partido destacado',
    fr: 'Match en vedette', ar: 'مباراة مميزة',
    pt: 'Partida destaque', de: 'Empfohlenes Spiel',
    ko: '추천 경기',          zh: '精选比赛',
    ja: '注目の試合',          tr: 'Öne Çıkan Maç',
  },
  pinned_match: {
    en: 'Pinned Match',     es: 'Partido fijado',
    fr: 'Match épinglé',    ar: 'مباراة مثبتة',
    pt: 'Partida fixada',   de: 'Angeheftetes Spiel',
    ko: '고정된 경기',        zh: '置顶比赛',
    ja: '固定された試合',      tr: 'Sabitlenmiş Maç',
  },
  click_to_feature: {
    en: 'Click any match to feature it here',
    es: 'Haz clic en un partido para destacarlo',
    fr: 'Cliquez sur un match pour l\'afficher ici',
    ar: 'انقر على أي مباراة لعرضها هنا',
    pt: 'Clique em qualquer partida para destacá-la',
    de: 'Klick auf ein Spiel um es hier anzuzeigen',
    ko: '경기를 클릭하면 여기에 표시됩니다',
    zh: '点击任意比赛将其置顶显示',
    ja: '試合をクリックしてここに表示',
    tr: 'Buraya sabitlemek için bir maça tıklayın',
  },
  today_label: {
    en: 'Today',    es: 'Hoy',
    fr: "Aujourd'hui", ar: 'اليوم',
    pt: 'Hoje',     de: 'Heute',
    ko: '오늘',      zh: '今日',
    ja: '今日',      tr: 'Bugün',
  },
  // ── Tech page: card bullets ───────────────────────────────────
  tech_fastapi_b1: {
    en: 'Python web framework',       es: 'Framework web Python',
    fr: 'Framework web Python',       ar: 'إطار ويب Python',
    pt: 'Framework web Python',       de: 'Python-Webframework',
    ko: 'Python 웹 프레임워크',          zh: 'Python Web 框架',
    ja: 'Pythonウェブフレームワーク',     tr: 'Python web çerçevesi',
  },
  tech_fastapi_b2: {
    en: 'REST API server',            es: 'Servidor REST API',
    fr: 'Serveur REST API',           ar: 'خادم REST API',
    pt: 'Servidor REST API',          de: 'REST-API-Server',
    ko: 'REST API 서버',               zh: 'REST API 服务器',
    ja: 'REST APIサーバー',             tr: 'REST API sunucusu',
  },
  tech_fastapi_b3: {
    en: 'routing & cors',             es: 'enrutamiento y CORS',
    fr: 'routage et CORS',            ar: 'توجيه وCORS',
    pt: 'roteamento e CORS',          de: 'Routing & CORS',
    ko: '라우팅 & CORS',               zh: '路由 & CORS',
    ja: 'ルーティング & CORS',           tr: 'yönlendirme & CORS',
  },
  tech_groq_b1: {
    en: 'AI inference platform',      es: 'Plataforma de inferencia IA',
    fr: "Plateforme d'inférence IA",  ar: 'منصة استنتاج الذكاء الاصطناعي',
    pt: 'Plataforma de inferência IA',de: 'KI-Inferenzplattform',
    ko: 'AI 추론 플랫폼',               zh: 'AI 推理平台',
    ja: 'AI推論プラットフォーム',         tr: 'Yapay zeka çıkarım platformu',
  },
  tech_groq_b2: {
    en: 'runs llama-3.3-70b',         es: 'ejecuta llama-3.3-70b',
    fr: 'fait tourner llama-3.3-70b', ar: 'يشغّل llama-3.3-70b',
    pt: 'executa llama-3.3-70b',      de: 'führt llama-3.3-70b aus',
    ko: 'llama-3.3-70b 실행',          zh: '运行 llama-3.3-70b',
    ja: 'llama-3.3-70bを実行',          tr: 'llama-3.3-70b çalıştırır',
  },
  tech_groq_b3: {
    en: 'ultra-low latency LLM',      es: 'LLM de latencia ultrabaja',
    fr: 'LLM ultra basse latence',    ar: 'نموذج لغوي فائق السرعة',
    pt: 'LLM de latência ultrabaixa', de: 'LLM mit extrem niedriger Latenz',
    ko: '초저지연 LLM',                zh: '超低延迟大语言模型',
    ja: '超低遅延LLM',                 tr: 'ultra düşük gecikmeli LLM',
  },
  tech_docling_b1: {
    en: 'document parsing library',   es: 'librería de análisis de documentos',
    fr: 'bibliothèque de parsing',    ar: 'مكتبة تحليل المستندات',
    pt: 'biblioteca de parsing',      de: 'Dokumenten-Parsing-Bibliothek',
    ko: '문서 파싱 라이브러리',           zh: '文档解析库',
    ja: 'ドキュメント解析ライブラリ',      tr: 'doküman ayrıştırma kütüphanesi',
  },
  tech_docling_b2: {
    en: 'extracts Wikipedia context', es: 'extrae contexto de Wikipedia',
    fr: 'extrait le contexte Wikipedia','ar': 'يستخرج سياق ويكيبيديا',
    pt: 'extrai contexto da Wikipedia',de: 'extrahiert Wikipedia-Kontext',
    ko: '위키피디아 컨텍스트 추출',        zh: '提取维基百科内容',
    ja: 'Wikipediaのコンテキストを抽出',   tr: 'Wikipedia bağlamını çıkarır',
  },
  tech_docling_b3: {
    en: 'by IBM Research',            es: 'de IBM Research',
    fr: "d'IBM Research",             ar: 'من IBM Research',
    pt: 'da IBM Research',            de: 'von IBM Research',
    ko: 'IBM Research 제작',           zh: '由 IBM Research 开发',
    ja: 'IBM Research製',              tr: 'IBM Research tarafından',
  },
  tech_fd_b1: {
    en: 'football data REST API',     es: 'API REST de datos de fútbol',
    fr: 'API REST de données football','ar': 'واجهة REST لبيانات كرة القدم',
    pt: 'API REST de dados de futebol',de: 'Fußball-Daten-REST-API',
    ko: '축구 데이터 REST API',         zh: '足球数据 REST 接口',
    ja: 'サッカーデータREST API',        tr: 'futbol verisi REST API',
  },
  tech_fd_b2: {
    en: 'live scores & fixtures',     es: 'marcadores y calendarios',
    fr: 'scores en direct & calendrier','ar': 'نتائج مباشرة ومباريات',
    pt: 'placares ao vivo e jogos',   de: 'Live-Ergebnisse & Spielplan',
    ko: '실시간 스코어 및 일정',          zh: '实时比分与赛程',
    ja: 'ライブスコア・試合日程',          tr: 'canlı skorlar ve fikstür',
  },
  tech_fd_b3: {
    en: 'match stats & standings',    es: 'estadísticas y clasificación',
    fr: 'stats de match & classement', ar: 'إحصائيات المباريات والترتيب',
    pt: 'estatísticas e classificação',de: 'Spielstatistiken & Tabellen',
    ko: '경기 통계 및 순위',             zh: '比赛数据与积分榜',
    ja: '試合統計・順位表',               tr: 'maç istatistikleri & puan tablosu',
  },
  tech_js_b1: {
    en: 'vanilla browser JavaScript', es: 'JavaScript puro de navegador',
    fr: 'JavaScript natif navigateur', ar: 'JavaScript خالص للمتصفح',
    pt: 'JavaScript puro do navegador',de: 'Vanilla Browser-JavaScript',
    ko: '순수 브라우저 JavaScript',      zh: '原生浏览器 JavaScript',
    ja: 'バニラブラウザJavaScript',      tr: 'saf tarayıcı JavaScript',
  },
  tech_js_b2: {
    en: 'ES modules, no bundler',     es: 'módulos ES, sin bundler',
    fr: 'modules ES, sans bundler',   ar: 'وحدات ES بدون حزّام',
    pt: 'módulos ES, sem bundler',    de: 'ES-Module, kein Bundler',
    ko: 'ES 모듈, 번들러 없음',          zh: 'ES 模块，无需打包工具',
    ja: 'ESモジュール、バンドラー不要',    tr: 'ES modülleri, bundler yok',
  },
  tech_js_b3: {
    en: 'SPA with staged navigation', es: 'SPA con navegación por etapas',
    fr: 'SPA à navigation par étapes', ar: 'تطبيق أحادي الصفحة بتنقل مرحلي',
    pt: 'SPA com navegação em etapas', de: 'SPA mit stufenweiser Navigation',
    ko: '단계별 내비게이션 SPA',          zh: '分阶段导航单页应用',
    ja: '段階ナビゲーションSPA',          tr: 'aşamalı navigasyonlu SPA',
  },
  tech_wiki_b1: {
    en: 'free encyclopedia REST API', es: 'API REST de Wikipedia',
    fr: "API REST de l'encyclopédie", ar: 'واجهة REST لموسوعة ويكيبيديا',
    pt: 'API REST da enciclopédia',   de: 'Freie Enzyklopädie REST-API',
    ko: '자유 백과사전 REST API',        zh: '维基百科免费百科 REST 接口',
    ja: '無料百科事典REST API',          tr: 'özgür ansiklopedi REST API',
  },
  tech_wiki_b2: {
    en: 'player photos & bios',       es: 'fotos y biografías de jugadores',
    fr: 'photos et biographies',      ar: 'صور اللاعبين وسيرهم',
    pt: 'fotos e biografias de jogadores','de': 'Spielerfotos & Biografien',
    ko: '선수 사진 및 약력',             zh: '球员照片与传记',
    ja: '選手写真・略歴',               tr: 'oyuncu fotoğrafları & biyografileri',
  },
  tech_wiki_b3: {
    en: 'validates player names',     es: 'valida nombres de jugadores',
    fr: 'valide les noms de joueurs', ar: 'يتحقق من أسماء اللاعبين',
    pt: 'valida nomes de jogadores',  de: 'Validiert Spielernamen',
    ko: '선수 이름 검증',               zh: '验证球员姓名',
    ja: '選手名を検証',                 tr: 'oyuncu isimlerini doğrular',
  },
  tech_flag_b1: {
    en: 'free flag image CDN',        es: 'CDN de imágenes de banderas',
    fr: 'CDN gratuit pour drapeaux',  ar: 'شبكة توصيل أعلام مجانية',
    pt: 'CDN gratuito de bandeiras',  de: 'Kostenloser Flaggen-CDN',
    ko: '무료 국기 이미지 CDN',          zh: '免费国旗图片 CDN',
    ja: '無料国旗画像CDN',              tr: 'ücretsiz bayrak CDN',
  },
  tech_flag_b2: {
    en: 'all FIFA member nations',    es: 'todos los países FIFA',
    fr: 'tous les pays FIFA',         ar: 'جميع أعضاء الفيفا',
    pt: 'todos os países FIFA',       de: 'Alle FIFA-Mitgliedsländer',
    ko: '전 FIFA 회원국',               zh: '所有 FIFA 成员国',
    ja: 'FIFA全加盟国',                tr: 'tüm FIFA üye ülkeleri',
  },
  tech_flag_b3: {
    en: 'no API key required',        es: 'sin clave API',
    fr: 'sans clé API',               ar: 'لا يحتاج مفتاح API',
    pt: 'sem chave de API',           de: 'kein API-Schlüssel nötig',
    ko: 'API 키 불필요',               zh: '无需 API 密钥',
    ja: 'APIキー不要',                 tr: 'API anahtarı gerekmez',
  },
  tech_plex_b1: {
    en: 'IBM open-source typeface',   es: 'Tipografía open-source de IBM',
    fr: 'Police open-source IBM',     ar: 'خط مفتوح المصدر من IBM',
    pt: 'Tipografia open-source IBM', de: 'IBM Open-Source-Schrift',
    ko: 'IBM 오픈소스 서체',            zh: 'IBM 开源字体',
    ja: 'IBMオープンソース書体',         tr: 'IBM açık kaynak yazı tipi',
  },
  tech_plex_b2: {
    en: 'Sans + Mono, used throughout', es: 'Sans + Mono en toda la app',
    fr: 'Sans + Mono, partout',       ar: 'Sans + Mono في كل التطبيق',
    pt: 'Sans + Mono em todo o app',  de: 'Sans + Mono, überall eingesetzt',
    ko: 'Sans + Mono 전체 사용',        zh: 'Sans + Mono，贯穿全局',
    ja: 'Sans + Mono を全体で使用',     tr: 'Sans + Mono, her yerde kullanılır',
  },
  // ── Stage 0: Search bar ────────────────────────────────────────
  search_by_team: {
    en: 'Search match using team name',     es: 'Buscar partido por nombre de equipo',
    fr: 'Rechercher un match par équipe',   ar: 'ابحث عن مباراة باسم الفريق',
    pt: 'Buscar partida pelo nome do time', de: 'Spiel nach Teamname suchen',
    ko: '팀 이름으로 경기 검색',              zh: '按球队名称搜索比赛',
    ja: 'チーム名で試合を検索',               tr: 'Takım adına göre maç ara',
  },
  search_by_date: {
    en: 'Search by date',  es: 'Buscar por fecha',
    fr: 'Rechercher par date', ar: 'البحث حسب التاريخ',
    pt: 'Buscar por data', de: 'Nach Datum suchen',
    ko: '날짜로 검색',        zh: '按日期搜索',
    ja: '日付で検索',         tr: 'Tarihe göre ara',
  },
  // ── Stage 5: Preview ────────────────────────────────────────────
  pv_upcoming: {
    en: 'Upcoming',  es: 'Próximo',
    fr: 'À venir',   ar: 'قادمة',
    pt: 'Em breve',  de: 'Bevorstehend',
    ko: '예정',        zh: '即将进行',
    ja: '予定',        tr: 'Yaklaşan',
  },
  pv_preview: {
    en: 'Preview',     es: 'Vista previa',
    fr: 'Aperçu',      ar: 'معاينة',
    pt: 'Pré-estreia', de: 'Vorschau',
    ko: '프리뷰',        zh: '预览',
    ja: 'プレビュー',     tr: 'Önizleme',
  },
  pv_change_match: {
    en: 'Change Match',  es: 'Cambiar partido',
    fr: 'Changer de match', ar: 'تغيير المباراة',
    pt: 'Trocar partida', de: 'Spiel wechseln',
    ko: '경기 변경',        zh: '更换比赛',
    ja: '試合を変更',       tr: 'Maçı Değiştir',
  },
  pv_style: {
    en: 'Style',   es: 'Estilo',
    fr: 'Style',   ar: 'الأسلوب',
    pt: 'Estilo',  de: 'Stil',
    ko: '스타일',    zh: '风格',
    ja: 'スタイル',  tr: 'Stil',
  },
  pv_danger: {
    en: 'Danger',   es: 'Peligro',
    fr: 'Danger',   ar: 'الخطورة',
    pt: 'Perigo',   de: 'Gefahr',
    ko: '위협 요소',  zh: '威胁',
    ja: '脅威',      tr: 'Tehlike',
  },
  pv_vulnerability: {
    en: 'Vulnerability',  es: 'Vulnerabilidad',
    fr: 'Vulnérabilité',  ar: 'نقطة الضعف',
    pt: 'Vulnerabilidade', de: 'Schwachstelle',
    ko: '약점',             zh: '弱点',
    ja: '弱点',             tr: 'Zafiyet',
  },
  pv_tactical_contrast: {
    en: 'Tactical Contrast',  es: 'Contraste táctico',
    fr: 'Contraste tactique', ar: 'التباين التكتيكي',
    pt: 'Contraste tático',   de: 'Taktischer Kontrast',
    ko: '전술적 대비',          zh: '战术对比',
    ja: '戦術的対比',           tr: 'Taktiksel Karşıtlık',
  },
  pv_why_unmissable: {
    en: 'Why This Match Is Unmissable',  es: 'Por qué no te puedes perder este partido',
    fr: 'Pourquoi ce match est incontournable', ar: 'لماذا هذه المباراة لا تُفوَّت',
    pt: 'Por que esta partida é imperdível',    de: 'Warum dieses Spiel ein Muss ist',
    ko: '이 경기를 놓쳐선 안 되는 이유',           zh: '为何这场比赛不容错过',
    ja: 'この試合を見逃せない理由',                tr: 'Bu Maçı Kaçırmamanız Gereken Sebep',
  },
  pv_watch: {
    en: 'Watch',  es: 'Vigilar',
    fr: 'À suivre', ar: 'مراقبة',
    pt: 'Observar', de: 'Beobachten',
    ko: '주목 선수',  zh: '关注球员',
    ja: '注目選手',  tr: 'İzlenecekler',
  },
  pv_first_meeting_text: {
    en: 'First ever World Cup meeting — history starts here.',
    es: 'Primer enfrentamiento en un Mundial — la historia empieza aquí.',
    fr: 'Première confrontation en Coupe du Monde — l\'histoire commence ici.',
    ar: 'أول مواجهة بينهما في كأس العالم — التاريخ يبدأ هنا.',
    pt: 'Primeiro confronto em Copas do Mundo — a história começa aqui.',
    de: 'Erstes WM-Aufeinandertreffen überhaupt — Geschichte beginnt hier.',
    ko: '월드컵 사상 첫 맞대결 — 역사가 시작된다.',
    zh: '世界杯历史上的首次交锋——历史从此刻开始。',
    ja: 'ワールドカップ史上初対決——歴史はここから始まる。',
    tr: 'Dünya Kupası tarihindeki ilk karşılaşma — tarih burada başlıyor.',
  },
  pv_first_meeting_badge: {
    en: 'First Meeting',  es: 'Primer enfrentamiento',
    fr: 'Première confrontation', ar: 'أول مواجهة',
    pt: 'Primeiro confronto',     de: 'Erstes Aufeinandertreffen',
    ko: '첫 맞대결',                zh: '首次交锋',
    ja: '初対決',                  tr: 'İlk Karşılaşma',
  },
  pv_manager: {
    en: 'Manager',  es: 'Entrenador',
    fr: 'Sélectionneur', ar: 'المدرب',
    pt: 'Técnico',  de: 'Trainer',
    ko: '감독',       zh: '主帅',
    ja: '監督',       tr: 'Teknik Direktör',
  },
  pv_player: {
    en: 'Player',  es: 'Jugador',
    fr: 'Joueur',  ar: 'لاعب',
    pt: 'Jogador', de: 'Spieler',
    ko: '선수',      zh: '球员',
    ja: '選手',      tr: 'Oyuncu',
  },
};

/**
 * t(key) — translate a UI string key to the current language.
 * Falls back to English when a translation is missing.
 */
export function t(key) {
  const lang = getCurrentLang();
  return UI_STRINGS[key]?.[lang] ?? UI_STRINGS[key]?.['en'] ?? key;
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
  '#E8C547', // warm yellow
  '#7EB8F7', // soft blue
  '#79E8A2', // mint green
  '#F7A07E', // soft orange
  '#C47EF7', // soft purple
  '#7EF7E8', // teal
  '#F77EAA', // soft pink
  '#B8E87E', // lime
  '#F7D27E', // soft gold
  '#9FA8F7', // periwinkle
  '#7EE8C4', // seafoam
  '#F78E7E', // coral
  '#D17EF7', // orchid
  '#7ED4F7', // sky blue
  '#E8A87E', // tan/copper
  '#A8E87E', // light green
  '#F77EE0', // magenta-pink
  '#7EF7A0', // spring green
];

function hashName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

// Fallback single-name lookup (used when no per-render map is available)
function nameColor(name) {
  return NAME_COLORS[hashName(name) % NAME_COLORS.length];
}

/**
 * Build a name → color map for one render pass, assigning colors in
 * order of first appearance so distinct names never collide (as long
 * as there are fewer names than colors in the palette).
 */
function assignNameColors(names) {
  const map = new Map();
  let i = 0;
  for (const name of names) {
    if (map.has(name)) continue;
    map.set(name, NAME_COLORS[i % NAME_COLORS.length]);
    i++;
  }
  return map;
}

/**
 * Remove any name that is wholly contained inside another (longer) name
 * in the list — e.g. drop "Minamino" if "Takumi Minamino" is also present.
 * Without this, highlighting the short name can match text sitting inside
 * the long name's already-inserted data-name="..." attribute, corrupting
 * the markup. We'd rather skip highlighting the short form than risk that.
 */
function dropSubsumedNames(names) {
  const unique = [...new Set(names)];
  return unique.filter(name => {
    const lower = name.toLowerCase();
    return !unique.some(other =>
      other !== name &&
      other.toLowerCase().includes(lower) &&
      // tie-break equal-length duplicates deterministically so neither drops the other
      (other.length > name.length || (other.length === name.length && other > name))
    );
  });
}

export async function highlightPlayersAsync(text, names) {
  if (!names.length) return escapeHtml(text);
  names = dropSubsumedNames(names); // dedupe + drop names contained inside a longer name

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
  const colorMap = assignNameColors(validNames);
  let result = escapeHtml(text);

  for (const name of sorted) {
    // Use Unicode-aware lookarounds instead of \b so that accented final
    // characters (é, ä, ø …) and names containing apostrophes (N'Golo)
    // are matched correctly. \b treats non-ASCII as a boundary itself.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\p{L}\\p{N}'])${escaped}(?![\\p{L}\\p{N}'])`, 'gu');
    const url = wikiUrl(name);
    const color = colorMap.get(name) || nameColor(name);
    result = result.replace(re,
      `<span class="player-hl" data-name="${name}" style="color:${color}">` +
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
  names = dropSubsumedNames(names); // dedupe + drop names contained inside a longer name
  const sorted = [...names].sort((a, b) => b.length - a.length);
  const colorMap = assignNameColors(names);
  let result = text;
  for (const name of sorted) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\p{L}\\p{N}'])${escaped}(?![\\p{L}\\p{N}'])`, 'gu');
    const url = wikiUrl(name);
    const color = colorMap.get(name) || nameColor(name);
    result = result.replace(re,
      `<span class="player-hl" data-name="${name}" style="color:${color}">` +
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
  names = dropSubsumedNames(names); // dedupe + drop names contained inside a longer name

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
  const colorMap = assignNameColors(validNames);

  // 2. Track which names have already been linked (first-occurrence wins)
  const linked = new Set();

  const applyHighlights = (text) => {
    let result = escapeHtml(text);
    for (const name of sorted) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![\\p{L}\\p{N}'])${escaped}(?![\\p{L}\\p{N}'])`, 'gu');
      const url = wikiUrl(name);
      const color = colorMap.get(name) || nameColor(name);
      const alreadyLinked = linked.has(name);

      // Replace all occurrences in this block; track if we link this pass
      let firstInBlock = true;
      result = result.replace(re, () => {
        if (!alreadyLinked && firstInBlock) {
          // First ever occurrence — full linked highlight
          firstInBlock = false;
          linked.add(name);
          return (
            `<span class="player-hl" data-name="${name}" style="color:${color}">` +
              name +
              `<a href="${url}" target="_blank" rel="noopener" class="hl-link" title="Wikipedia">` +
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` +
              `</a>` +
            `</span>`
          );
        }
        // Subsequent occurrence — hoverable span, NO link icon
        return `<span class="player-hl player-hl-repeat" data-name="${name}" style="color:${color}">${name}</span>`;
      });
    }
    return result;
  };

  // Process tldr first so its names are marked linked before full runs
  const tldrHl = applyHighlights(tldr);
  const fullHl = applyHighlights(full);

  return { tldrHl, fullHl };
}