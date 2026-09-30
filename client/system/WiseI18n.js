(function () {
  const isBrowser = typeof window !== 'undefined';

  const LANGUAGES = {
    id: { code: 'id', label: 'Bahasa Indonesia', nativeLabel: 'Bahasa Indonesia' },
    en: { code: 'en', label: 'English', nativeLabel: 'English' },
    de: { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
    es: { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
    fr: { code: 'fr', label: 'French', nativeLabel: 'Français' },
    ar: { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' }
  };

  const CURRENCIES = {
    // ── Global Major & Key Currencies ──────────────────────────────
    IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', prefix: 'Rp ', locale: 'id-ID', decimal: ',', group: '.' },
    USD: { code: 'USD', name: 'US Dollar', symbol: '$', prefix: '$ ', locale: 'en-US', decimal: '.', group: ',' },
    EUR: { code: 'EUR', name: 'Euro', symbol: '€', prefix: '€ ', locale: 'de-DE', decimal: ',', group: '.' },
    GBP: { code: 'GBP', name: 'British Pound Sterling', symbol: '£', prefix: '£ ', locale: 'en-GB', decimal: '.', group: ',' },
    JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', prefix: '¥ ', locale: 'ja-JP', decimal: '.', group: ',' },
    CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', prefix: '¥ ', locale: 'zh-CN', decimal: '.', group: ',' },
    AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', prefix: 'A$ ', locale: 'en-AU', decimal: '.', group: ',' },
    CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', prefix: 'C$ ', locale: 'en-CA', decimal: '.', group: ',' },
    CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', prefix: 'CHF ', locale: 'de-CH', decimal: '.', group: "'" },
    HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', prefix: 'HK$ ', locale: 'zh-HK', decimal: '.', group: ',' },
    SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', prefix: 'S$ ', locale: 'en-SG', decimal: '.', group: ',' },
    NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', prefix: 'NZ$ ', locale: 'en-NZ', decimal: '.', group: ',' },
    KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', prefix: '₩ ', locale: 'ko-KR', decimal: '.', group: ',' },
    INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', prefix: '₹ ', locale: 'en-IN', decimal: '.', group: ',' },
    BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', prefix: 'R$ ', locale: 'pt-BR', decimal: ',', group: '.' },
    RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', prefix: '₽ ', locale: 'ru-RU', decimal: ',', group: ' ' },
    ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', prefix: 'R ', locale: 'en-ZA', decimal: '.', group: ',' },
    MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', prefix: 'Mex$ ', locale: 'es-MX', decimal: '.', group: ',' },
    TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', prefix: '₺ ', locale: 'tr-TR', decimal: ',', group: '.' },
    SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', prefix: 'SAR ', locale: 'ar-SA', decimal: '.', group: ',' },
    AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', prefix: 'AED ', locale: 'ar-AE', decimal: '.', group: ',' },

    // ── Southeast & East Asia ─────────────────────────────────────
    MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', prefix: 'RM ', locale: 'ms-MY', decimal: '.', group: ',' },
    THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', prefix: '฿ ', locale: 'th-TH', decimal: '.', group: ',' },
    PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', prefix: '₱ ', locale: 'en-PH', decimal: '.', group: ',' },
    VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', prefix: '₫ ', locale: 'vi-VN', decimal: ',', group: '.' },
    TWD: { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', prefix: 'NT$ ', locale: 'zh-TW', decimal: '.', group: ',' },
    BND: { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', prefix: 'B$ ', locale: 'ms-BN', decimal: '.', group: ',' },
    KHR: { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', prefix: '៛ ', locale: 'km-KH', decimal: '.', group: ',' },
    LAK: { code: 'LAK', name: 'Lao Kip', symbol: '₭', prefix: '₭ ', locale: 'lo-LA', decimal: '.', group: ',' },
    MMK: { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', prefix: 'K ', locale: 'my-MM', decimal: '.', group: ',' },
    MOP: { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', prefix: 'MOP$ ', locale: 'zh-MO', decimal: '.', group: ',' },
    MNT: { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', prefix: '₮ ', locale: 'mn-MN', decimal: '.', group: ',' },

    // ── South Asia ────────────────────────────────────────────────
    PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR', prefix: 'PKR ', locale: 'ur-PK', decimal: '.', group: ',' },
    BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', prefix: '৳ ', locale: 'bn-BD', decimal: '.', group: ',' },
    LKR: { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', prefix: 'Rs ', locale: 'si-LK', decimal: '.', group: ',' },
    NPR: { code: 'NPR', name: 'Nepalese Rupee', symbol: 'NPR', prefix: 'NPR ', locale: 'ne-NP', decimal: '.', group: ',' },
    MVR: { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', prefix: 'Rf ', locale: 'dv-MV', decimal: '.', group: ',' },
    BTN: { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu', prefix: 'Nu ', locale: 'dz-BT', decimal: '.', group: ',' },
    AFN: { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', prefix: '؋ ', locale: 'ps-AF', decimal: '.', group: ',' },

    // ── Middle East & Central Asia ────────────────────────────────
    QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', prefix: 'QR ', locale: 'ar-QA', decimal: '.', group: ',' },
    KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', prefix: 'KD ', locale: 'ar-KW', decimal: '.', group: ',' },
    BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', prefix: 'BD ', locale: 'ar-BH', decimal: '.', group: ',' },
    OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', prefix: 'OMR ', locale: 'ar-OM', decimal: '.', group: ',' },
    JOD: { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', prefix: 'JD ', locale: 'ar-JO', decimal: '.', group: ',' },
    ILS: { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', prefix: '₪ ', locale: 'he-IL', decimal: '.', group: ',' },
    IQD: { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD', prefix: 'IQD ', locale: 'ar-IQ', decimal: '.', group: ',' },
    IRR: { code: 'IRR', name: 'Iranian Rial', symbol: 'IRR', prefix: 'IRR ', locale: 'fa-IR', decimal: '.', group: ',' },
    LBP: { code: 'LBP', name: 'Lebanese Pound', symbol: 'LBP', prefix: 'LBP ', locale: 'ar-LB', decimal: '.', group: ',' },
    SYP: { code: 'SYP', name: 'Syrian Pound', symbol: 'SYP', prefix: 'SYP ', locale: 'ar-SY', decimal: '.', group: ',' },
    YER: { code: 'YER', name: 'Yemeni Rial', symbol: 'YR', prefix: 'YR ', locale: 'ar-YE', decimal: '.', group: ',' },
    KZT: { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', prefix: '₸ ', locale: 'kk-KZ', decimal: ',', group: ' ' },
    UZS: { code: 'UZS', name: 'Uzbekistani Som', symbol: 'soʻm', prefix: 'soʻm ', locale: 'uz-UZ', decimal: ',', group: ' ' },
    TJS: { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', prefix: 'SM ', locale: 'tg-TJ', decimal: '.', group: ',' },
    TMT: { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'TMT', prefix: 'TMT ', locale: 'tk-TM', decimal: ',', group: ' ' },
    KGS: { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с', prefix: 'с ', locale: 'ky-KG', decimal: '.', group: ',' },
    AZN: { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', prefix: '₼ ', locale: 'az-AZ', decimal: ',', group: '.' },
    GEL: { code: 'GEL', name: 'Georgian Lari', symbol: '₾', prefix: '₾ ', locale: 'ka-GE', decimal: ',', group: ' ' },
    AMD: { code: 'AMD', name: 'Armenian Dram', symbol: '֏', prefix: '֏ ', locale: 'hy-AM', decimal: '.', group: ',' },

    // ── Europe (Non-Euro) ─────────────────────────────────────────
    SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', prefix: 'kr ', locale: 'sv-SE', decimal: ',', group: ' ' },
    NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', prefix: 'kr ', locale: 'nb-NO', decimal: ',', group: ' ' },
    DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', prefix: 'kr ', locale: 'da-DK', decimal: ',', group: '.' },
    PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', prefix: 'zł ', locale: 'pl-PL', decimal: ',', group: ' ' },
    CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', prefix: 'Kč ', locale: 'cs-CZ', decimal: ',', group: ' ' },
    HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', prefix: 'Ft ', locale: 'hu-HU', decimal: ',', group: ' ' },
    RON: { code: 'RON', name: 'Romanian Leu', symbol: 'lei', prefix: 'lei ', locale: 'ro-RO', decimal: ',', group: '.' },
    BGN: { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', prefix: 'лв ', locale: 'bg-BG', decimal: ',', group: ' ' },
    ISK: { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', prefix: 'kr ', locale: 'is-IS', decimal: ',', group: '.' },
    RSD: { code: 'RSD', name: 'Serbian Dinar', symbol: 'din', prefix: 'din ', locale: 'sr-RS', decimal: ',', group: '.' },
    BAM: { code: 'BAM', name: 'Bosnia and Herzegovina Convertible Mark', symbol: 'KM', prefix: 'KM ', locale: 'bs-BA', decimal: ',', group: '.' },
    MKD: { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', prefix: 'ден ', locale: 'mk-MK', decimal: ',', group: '.' },
    ALL: { code: 'ALL', name: 'Albanian Lek', symbol: 'L', prefix: 'L ', locale: 'sq-AL', decimal: ',', group: '.' },
    UAH: { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', prefix: '₴ ', locale: 'uk-UA', decimal: ',', group: ' ' },
    BYN: { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', prefix: 'Br ', locale: 'be-BY', decimal: ',', group: ' ' },
    MDL: { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', prefix: 'L ', locale: 'ro-MD', decimal: ',', group: '.' },

    // ── Americas ──────────────────────────────────────────────────
    ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', prefix: '$ ', locale: 'es-AR', decimal: ',', group: '.' },
    CLP: { code: 'CLP', name: 'Chilean Peso', symbol: '$', prefix: '$ ', locale: 'es-CL', decimal: ',', group: '.' },
    COP: { code: 'COP', name: 'Colombian Peso', symbol: '$', prefix: '$ ', locale: 'es-CO', decimal: ',', group: '.' },
    PEN: { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.', prefix: 'S/. ', locale: 'es-PE', decimal: '.', group: ',' },
    UYU: { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', prefix: '$U ', locale: 'es-UY', decimal: ',', group: '.' },
    PYG: { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', prefix: '₲ ', locale: 'es-PY', decimal: ',', group: '.' },
    BOB: { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', prefix: 'Bs. ', locale: 'es-BO', decimal: ',', group: '.' },
    VES: { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', prefix: 'Bs. ', locale: 'es-VE', decimal: ',', group: '.' },
    CRC: { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', prefix: '₡ ', locale: 'es-CR', decimal: ',', group: '.' },
    DOP: { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', prefix: 'RD$ ', locale: 'es-DO', decimal: '.', group: ',' },
    GTQ: { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', prefix: 'Q ', locale: 'es-GT', decimal: '.', group: ',' },
    HNL: { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', prefix: 'L ', locale: 'es-HN', decimal: '.', group: ',' },
    NIO: { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', prefix: 'C$ ', locale: 'es-NI', decimal: '.', group: ',' },
    PAB: { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', prefix: 'B/. ', locale: 'es-PA', decimal: '.', group: ',' },
    JMD: { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', prefix: 'J$ ', locale: 'en-JM', decimal: '.', group: ',' },
    TTD: { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$', prefix: 'TT$ ', locale: 'en-TT', decimal: '.', group: ',' },
    BSD: { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$', prefix: 'B$ ', locale: 'en-BS', decimal: '.', group: ',' },
    BBD: { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', prefix: 'Bds$ ', locale: 'en-BB', decimal: '.', group: ',' },
    BZD: { code: 'BZD', name: 'Belizean Dollar', symbol: 'BZ$', prefix: 'BZ$ ', locale: 'en-BZ', decimal: '.', group: ',' },
    GYD: { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$', prefix: 'G$ ', locale: 'en-GY', decimal: '.', group: ',' },
    SRD: { code: 'SRD', name: 'Surinamese Dollar', symbol: 'Sr$', prefix: 'Sr$ ', locale: 'nl-SR', decimal: ',', group: '.' },
    HTG: { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', prefix: 'G ', locale: 'fr-HT', decimal: '.', group: ',' },
    CUP: { code: 'CUP', name: 'Cuban Peso', symbol: '₱', prefix: '₱ ', locale: 'es-CU', decimal: '.', group: ',' },
    XCD: { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$', prefix: 'EC$ ', locale: 'en-AG', decimal: '.', group: ',' },
    AWG: { code: 'AWG', name: 'Aruban Florin', symbol: 'Afl.', prefix: 'Afl. ', locale: 'nl-AW', decimal: ',', group: '.' },
    ANG: { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'NAƒ', prefix: 'NAƒ ', locale: 'nl-CW', decimal: ',', group: '.' },
    KYD: { code: 'KYD', name: 'Cayman Islands Dollar', symbol: 'CI$', prefix: 'CI$ ', locale: 'en-KY', decimal: '.', group: ',' },
    BMD: { code: 'BMD', name: 'Bermudian Dollar', symbol: 'BD$', prefix: 'BD$ ', locale: 'en-BM', decimal: '.', group: ',' },

    // ── Africa ────────────────────────────────────────────────────
    EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', prefix: 'E£ ', locale: 'ar-EG', decimal: '.', group: ',' },
    NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', prefix: '₦ ', locale: 'en-NG', decimal: '.', group: ',' },
    KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', prefix: 'KSh ', locale: 'sw-KE', decimal: '.', group: ',' },
    GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', prefix: 'GH₵ ', locale: 'en-GH', decimal: '.', group: ',' },
    MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', prefix: 'MAD ', locale: 'ar-MA', decimal: '.', group: ',' },
    DZD: { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', prefix: 'DA ', locale: 'ar-DZ', decimal: '.', group: ',' },
    TND: { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', prefix: 'DT ', locale: 'ar-TN', decimal: '.', group: ',' },
    LYD: { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD', prefix: 'LD ', locale: 'ar-LY', decimal: '.', group: ',' },
    ETB: { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', prefix: 'Br ', locale: 'am-ET', decimal: '.', group: ',' },
    TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', prefix: 'TSh ', locale: 'sw-TZ', decimal: '.', group: ',' },
    UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', prefix: 'USh ', locale: 'en-UG', decimal: '.', group: ',' },
    RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', prefix: 'RF ', locale: 'rw-RW', decimal: ',', group: ' ' },
    BWP: { code: 'BWP', name: 'Botswana Pula', symbol: 'P', prefix: 'P ', locale: 'en-BW', decimal: '.', group: ',' },
    NAD: { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', prefix: 'N$ ', locale: 'en-NA', decimal: '.', group: ',' },
    ZMW: { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', prefix: 'ZK ', locale: 'en-ZM', decimal: '.', group: ',' },
    MZN: { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', prefix: 'MT ', locale: 'pt-MZ', decimal: ',', group: '.' },
    AOA: { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', prefix: 'Kz ', locale: 'pt-AO', decimal: ',', group: '.' },
    CDF: { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', prefix: 'FC ', locale: 'fr-CD', decimal: ',', group: ' ' },
    MUR: { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', prefix: '₨ ', locale: 'en-MU', decimal: '.', group: ',' },
    SCR: { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SR', prefix: 'SR ', locale: 'fr-SC', decimal: '.', group: ',' },
    MWK: { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', prefix: 'MK ', locale: 'en-MW', decimal: '.', group: ',' },
    SZL: { code: 'SZL', name: 'Eswatini Lilangeni', symbol: 'E', prefix: 'E ', locale: 'en-SZ', decimal: '.', group: ',' },
    LSL: { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', prefix: 'L ', locale: 'en-LS', decimal: '.', group: ',' },
    SOS: { code: 'SOS', name: 'Somali Shilling', symbol: 'S', prefix: 'S ', locale: 'so-SO', decimal: '.', group: ',' },
    SDG: { code: 'SDG', name: 'Sudanese Pound', symbol: 'SDG', prefix: 'SDG ', locale: 'ar-SD', decimal: '.', group: ',' },
    SSP: { code: 'SSP', name: 'South Sudanese Pound', symbol: 'SSP', prefix: 'SSP ', locale: 'en-SS', decimal: '.', group: ',' },
    DJF: { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', prefix: 'Fdj ', locale: 'fr-DJ', decimal: '.', group: ',' },
    ERN: { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', prefix: 'Nfk ', locale: 'ti-ER', decimal: '.', group: ',' },
    GMD: { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', prefix: 'D ', locale: 'en-GM', decimal: '.', group: ',' },
    GNF: { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', prefix: 'FG ', locale: 'fr-GN', decimal: ',', group: ' ' },
    SLL: { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', prefix: 'Le ', locale: 'en-SL', decimal: '.', group: ',' },
    LRD: { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', prefix: 'L$ ', locale: 'en-LR', decimal: '.', group: ',' },
    CVE: { code: 'CVE', name: 'Cape Verdean Escudo', symbol: 'Esc', prefix: 'Esc ', locale: 'pt-CV', decimal: '$', group: '.' },
    STN: { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', prefix: 'Db ', locale: 'pt-ST', decimal: ',', group: '.' },
    KMF: { code: 'KMF', name: 'Comorian Franc', symbol: 'CF', prefix: 'CF ', locale: 'fr-KM', decimal: '.', group: ',' },
    MGA: { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', prefix: 'Ar ', locale: 'mg-MG', decimal: '.', group: ',' },
    BIF: { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', prefix: 'FBu ', locale: 'fr-BI', decimal: ',', group: ' ' },
    XOF: { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', prefix: 'CFA ', locale: 'fr-SN', decimal: ',', group: ' ' },
    XAF: { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', prefix: 'FCFA ', locale: 'fr-CM', decimal: ',', group: ' ' },

    // ── Oceania ───────────────────────────────────────────────────
    PGK: { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', prefix: 'K ', locale: 'en-PG', decimal: '.', group: ',' },
    FJD: { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', prefix: 'FJ$ ', locale: 'en-FJ', decimal: '.', group: ',' },
    SBD: { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', prefix: 'SI$ ', locale: 'en-SB', decimal: '.', group: ',' },
    VUV: { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', prefix: 'VT ', locale: 'fr-VU', decimal: '.', group: ',' },
    WST: { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', prefix: 'WS$ ', locale: 'en-WS', decimal: '.', group: ',' },
    TOP: { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', prefix: 'T$ ', locale: 'en-TO', decimal: '.', group: ',' }
  };

  const DICTIONARY = {
    // Topbar & Menus
    'Settings': { id: 'Pengaturan', en: 'Settings', de: 'Einstellungen', es: 'Configuración', fr: 'Paramètres', ar: 'الإعدادات' },
    'Pengaturan': { id: 'Pengaturan', en: 'Settings', de: 'Einstellungen', es: 'Configuración', fr: 'Paramètres', ar: 'الإعدادات' },
    'Demos': { id: 'Demo', en: 'Demos', de: 'Demos', es: 'Demostraciones', fr: 'Démos', ar: 'العروض التوضيحية' },
    'Demo': { id: 'Demo', en: 'Demos', de: 'Demos', es: 'Demostraciones', fr: 'Démos', ar: 'العروض التوضيحية' },
    'Controls': { id: 'Kontrol', en: 'Controls', de: 'Steuerelemente', es: 'Controles', fr: 'Contrôles', ar: 'عناصر التحكم' },
    'Kontrol': { id: 'Kontrol', en: 'Controls', de: 'Steuerelemente', es: 'Controles', fr: 'Contrôles', ar: 'عناصر التحكم' },
    'HRIS System': { id: 'Sistem HRIS', en: 'HRIS System', de: 'HRIS-System', es: 'Sistema HRIS', fr: 'Système SIRH', ar: 'نظام الموارد البشرية' },
    'Sistem HRIS': { id: 'Sistem HRIS', en: 'HRIS System', de: 'HRIS-System', es: 'Sistema HRIS', fr: 'Système SIRH', ar: 'نظام الموارد البشرية' },
    'HRIS Portal': { id: 'Portal HRIS', en: 'HRIS Portal', de: 'HRIS-Portal', es: 'Portal HRIS', fr: 'Portail SIRH', ar: 'بوابة الموارد البشرية' },
    'Portal HRIS': { id: 'Portal HRIS', en: 'HRIS Portal', de: 'HRIS-Portal', es: 'Portal HRIS', fr: 'Portail SIRH', ar: 'بوابة الموارد البشرية' },
    'Employee Management': { id: 'Manajemen Karyawan', en: 'Employee Management', de: 'Mitarbeiterverwaltung', es: 'Gestión de Empleados', fr: 'Gestion des Employés', ar: 'إدارة الموظفين' },
    'Manajemen Karyawan': { id: 'Manajemen Karyawan', en: 'Employee Management', de: 'Mitarbeiterverwaltung', es: 'Gestión de Empleados', fr: 'Gestion des Employés', ar: 'إدارة الموظفين' },
    'Windows': { id: 'Jendela', en: 'Windows', de: 'Fenster', es: 'Ventanas', fr: 'Fenêtres', ar: 'النوافذ' },
    'Jendela': { id: 'Jendela', en: 'Windows', de: 'Fenster', es: 'Ventanas', fr: 'Fenêtres', ar: 'النوافذ' },
    'Logout': { id: 'Keluar', en: 'Logout', de: 'Abmelden', es: 'Cerrar sesión', fr: 'Déconnexion', ar: 'تسجيل الخروج' },
    'Keluar': { id: 'Keluar', en: 'Logout', de: 'Abmelden', es: 'Cerrar sesión', fr: 'Déconnexion', ar: 'تسجيل الخروج' },
    'Back': { id: 'Kembali', en: 'Back', de: 'Zurück', es: 'Atrás', fr: 'Retour', ar: 'رجوع' },
    'Kembali': { id: 'Kembali', en: 'Back', de: 'Zurück', es: 'Atrás', fr: 'Retour', ar: 'رجوع' },
    '← Back': { id: '← Kembali', en: '← Back', de: '← Zurück', es: '← Atrás', fr: '← Retour', ar: '← رجوع' },
    '← Kembali': { id: '← Kembali', en: '← Back', de: '← Zurück', es: '← Atrás', fr: '← Retour', ar: '← رجوع' },

    // Settings Window
    'Desktop Preset': { id: 'Preset Tampilan Desktop', en: 'Desktop Preset', de: 'Desktop-Voreinstellung', es: 'Ajuste de Escritorio', fr: 'Préréglage du Bureau', ar: 'إعدادات سطح المكتب' },
    'Preset Tampilan Desktop': { id: 'Preset Tampilan Desktop', en: 'Desktop Preset', de: 'Desktop-Voreinstellung', es: 'Ajuste de Escritorio', fr: 'Préréglage du Bureau', ar: 'إعدادات سطح المكتب' },
    'Background Image': { id: 'Gambar Latar Belakang', en: 'Background Image', de: 'Hintergrundbild', es: 'Imagen de Fondo', fr: 'Image d\'Arrière-plan', ar: 'صورة الخلفية' },
    'Gambar Latar Belakang': { id: 'Gambar Latar Belakang', en: 'Background Image', de: 'Hintergrundbild', es: 'Imagen de Fondo', fr: 'Image d\'Arrière-plan', ar: 'صورة الخلفية' },
    'Previously Uploaded': { id: 'Riwayat Unggahan', en: 'Previously Uploaded', de: 'Zuvor hochgeladen', es: 'Subido previamente', fr: 'Précédemment Téléchargé', ar: 'تم الرفع سابقاً' },
    'Riwayat Unggahan': { id: 'Riwayat Unggahan', en: 'Previously Uploaded', de: 'Zuvor hochgeladen', es: 'Subido previamente', fr: 'Précédemment Téléchargé', ar: 'تم الرفع سابقاً' },
    'Choose Image...': { id: 'Pilih Gambar...', en: 'Choose Image...', de: 'Bild auswählen...', es: 'Elegir imagen...', fr: 'Choisir une image...', ar: 'اختر صورة...' },
    'Pilih Gambar...': { id: 'Pilih Gambar...', en: 'Choose Image...', de: 'Bild auswählen...', es: 'Elegir imagen...', fr: 'Choisir une image...', ar: 'اختر صورة...' },
    'Language': { id: 'Bahasa', en: 'Language', de: 'Sprache', es: 'Idioma', fr: 'Langue', ar: 'اللغة' },
    'Bahasa': { id: 'Bahasa', en: 'Language', de: 'Sprache', es: 'Idioma', fr: 'Langue', ar: 'اللغة' },
    'Currency': { id: 'Mata Uang', en: 'Currency', de: 'Währung', es: 'Moneda', fr: 'Devise', ar: 'العملة' },
    'Mata Uang': { id: 'Mata Uang', en: 'Currency', de: 'Währung', es: 'Moneda', fr: 'Devise', ar: 'العملة' },

    // Toolbar Buttons & Actions
    'Display All': { id: 'Tampilkan Semua', en: 'Display All', de: 'Alle anzeigen', es: 'Mostrar todo', fr: 'Afficher Tout', ar: 'عرض الكل' },
    'Tampilkan Semua': { id: 'Tampilkan Semua', en: 'Display All', de: 'Alle anzeigen', es: 'Mostrar todo', fr: 'Afficher Tout', ar: 'عرض الكل' },
    'Display': { id: 'Tampilkan', en: 'Display', de: 'Anzeigen', es: 'Mostrar', fr: 'Afficher', ar: 'عرض' },
    'Tampilkan': { id: 'Tampilkan', en: 'Display', de: 'Anzeigen', es: 'Mostrar', fr: 'Afficher', ar: 'عرض' },
    'Select/Deselect All': { id: 'Pilih/Batal Semua', en: 'Select/Deselect All', de: 'Alle auswählen/abwählen', es: 'Seleccionar/Deseleccionar todo', fr: 'Tout Sélectionner/Désélectionner', ar: 'تحديد/إلغاء تحديد الكل' },
    'Pilih/Batal Semua': { id: 'Pilih/Batal Semua', en: 'Select/Deselect All', de: 'Alle auswählen/abwählen', es: 'Seleccionar/Deseleccionar todo', fr: 'Tout Sélectionner/Désélectionner', ar: 'تحديد/إلغاء تحديد الكل' },
    'Pilih / Batal': { id: 'Pilih / Batal', en: 'Select / Deselect', de: 'Auswählen / Abwählen', es: 'Seleccionar / Deseleccionar', fr: 'Sélectionner / Désélectionner', ar: 'تحديد / إلغاء' },
    'Detail Employee': { id: 'Detail Karyawan', en: 'Employee Details', de: 'Mitarbeiterdetails', es: 'Detalles del Empleado', fr: 'Détails de l\'Employé', ar: 'تفاصيل الموظف' },
    'Detail Karyawan': { id: 'Detail Karyawan', en: 'Employee Details', de: 'Mitarbeiterdetails', es: 'Detalles del Empleado', fr: 'Détails de l\'Employé', ar: 'تفاصيل الموظف' },
    'Lihat Detail': { id: 'Lihat Detail', en: 'View Details', de: 'Details anzeigen', es: 'Ver detalles', fr: 'Voir les Détails', ar: 'عرض التفاصيل' },
    'Add Employee': { id: 'Tambah Karyawan', en: 'Add Employee', de: 'Mitarbeiter hinzufügen', es: 'Agregar empleado', fr: 'Ajouter un Employé', ar: 'إضافة موظف' },
    'Tambah Karyawan': { id: 'Tambah Karyawan', en: 'Add Employee', de: 'Mitarbeiter hinzufügen', es: 'Agregar empleado', fr: 'Ajouter un Employé', ar: 'إضافة موظف' },
    'Karyawan Baru': { id: 'Karyawan Baru', en: 'New Employee', de: 'Neuer Mitarbeiter', es: 'Nuevo empleado', fr: 'Nouvel Employé', ar: 'موظف جديد' },
    'Edit Employee': { id: 'Edit Karyawan', en: 'Edit Employee', de: 'Mitarbeiter bearbeiten', es: 'Editar empleado', fr: 'Modifier l\'Employé', ar: 'تعديل الموظف' },
    'Edit Karyawan': { id: 'Edit Karyawan', en: 'Edit Employee', de: 'Mitarbeiter bearbeiten', es: 'Editar empleado', fr: 'Modifier l\'Employé', ar: 'تعديل الموظف' },
    'Edit Employee Information': { id: 'Edit Informasi Karyawan', en: 'Edit Employee Information', de: 'Mitarbeiterinformationen bearbeiten', es: 'Editar información del empleado', fr: 'Modifier les Informations de l\'Employé', ar: 'تعديل بيانات الموظف' },
    'Duplicate Employee': { id: 'Duplikat Karyawan', en: 'Duplicate Employee', de: 'Mitarbeiter duplizieren', es: 'Duplicar empleado', fr: 'Dupliquer l\'Employé', ar: 'نسخ الموظف' },
    'Duplikat Karyawan': { id: 'Duplikat Karyawan', en: 'Duplicate Employee', de: 'Mitarbeiter duplizieren', es: 'Duplicar empleado', fr: 'Dupliquer l\'Employé', ar: 'نسخ الموظف' },
    'Duplikat Data Karyawan': { id: 'Duplikat Data Karyawan', en: 'Duplicate Employee Data', de: 'Mitarbeiterdaten duplizieren', es: 'Duplicar datos del empleado', fr: 'Dupliquer les Données de l\'Employé', ar: 'نسخ بيانات الموظف' },
    'Deactivate Employee': { id: 'Ubah Status Karyawan', en: 'Change Employee Status', de: 'Mitarbeiterstatus ändern', es: 'Cambiar estado del empleado', fr: 'Changer le Statut de l\'Employé', ar: 'تغيير حالة الموظف' },
    'Status Aktif': { id: 'Status Aktif', en: 'Active Status', de: 'Aktivitätsstatus', es: 'Estado activo', fr: 'Statut Actif', ar: 'الحالة النشطة' },
    'Find Employee': { id: 'Cari Karyawan', en: 'Find Employee', de: 'Mitarbeiter suchen', es: 'Buscar empleado', fr: 'Rechercher un Employé', ar: 'بحث عن موظف' },
    'Cari Karyawan': { id: 'Cari Karyawan', en: 'Find Employee', de: 'Mitarbeiter suchen', es: 'Buscar empleado', fr: 'Rechercher un Employé', ar: 'بحث عن موظف' },
    'Report': { id: 'Laporan', en: 'Report', de: 'Bericht', es: 'Informe', fr: 'Rapport', ar: 'تقرير' },
    'Laporan': { id: 'Laporan', en: 'Report', de: 'Bericht', es: 'Informe', fr: 'Rapport', ar: 'تقرير' },
    'Laporan Ringkasan': { id: 'Laporan Ringkasan', en: 'Summary Report', de: 'Zusammenfassender Bericht', es: 'Informe resumido', fr: 'Rapport Récapitulatif', ar: 'تقرير ملخص' },

    // Data Table Filters, Paging, and Context Menu
    'Nama / NIK': { id: 'Nama / NIK', en: 'Name / ID', de: 'Name / ID', es: 'Nombre / ID', fr: 'Nom / Identifiant', ar: 'الاسم / الرقم الوظيفي' },
    'Nama/NIK': { id: 'Nama / NIK', en: 'Name / ID', de: 'Name / ID', es: 'Nombre / ID', fr: 'Nom / Identifiant', ar: 'الاسم / الرقم الوظيفي' },
    'Cari nama atau NIK…': { id: 'Cari nama atau NIK…', en: 'Search name or ID…', de: 'Name oder ID suchen…', es: 'Buscar nombre o ID…', fr: 'Rechercher par nom ou identifiant…', ar: 'البحث بالاسم أو الرقم الوظيفي…' },
    'Cari nama atau NIK...': { id: 'Cari nama atau NIK…', en: 'Search name or ID…', de: 'Name oder ID suchen…', es: 'Buscar nombre o ID…', fr: 'Rechercher par nom ou identifiant…', ar: 'البحث بالاسم أو الرقم الوظيفي…' },
    'Cari jabatan…': { id: 'Cari jabatan…', en: 'Search job title…', de: 'Position suchen…', es: 'Buscar cargo…', fr: 'Rechercher par poste…', ar: 'البحث عن المسمى الوظيفي…' },
    'Cari jabatan...': { id: 'Cari jabatan…', en: 'Search job title…', de: 'Position suchen…', es: 'Buscar cargo…', fr: 'Rechercher par poste…', ar: 'البحث عن المسمى الوظيفي…' },
    'Semua': { id: 'Semua', en: 'All', de: 'Alle', es: 'Todos', fr: 'Tous', ar: 'الكل' },
    'Semua Departemen': { id: 'Semua Departemen', en: 'All Departments', de: 'Alle Abteilungen', es: 'Todos los departamentos', fr: 'Tous les Départements', ar: 'جميع الأقسام' },
    'Semua Status': { id: 'Semua Status', en: 'All Statuses', de: 'Alle Status', es: 'Todos los estados', fr: 'Tous les Statuts', ar: 'جميع الحالات' },
    'baris': { id: 'baris', en: 'rows', de: 'Zeilen', es: 'filas', fr: 'lignes', ar: 'صفوف' },
    'halaman': { id: 'halaman', en: 'page', de: 'Seite', es: 'página', fr: 'page', ar: 'صفحة' },
    'Halaman sebelumnya': { id: 'Halaman sebelumnya', en: 'Previous page', de: 'Vorherige Seite', es: 'Página anterior', fr: 'Page précédente', ar: 'الصفحة السابقة' },
    'Halaman berikutnya': { id: 'Halaman berikutnya', en: 'Next page', de: 'Nächste Seite', es: 'Página siguiente', fr: 'Page suivante', ar: 'الصفحة التالية' },
    'Tidak ada data': { id: 'Tidak ada data', en: 'No data available', de: 'Keine Daten verfügbar', es: 'No hay datos disponibles', fr: 'Aucune donnée disponible', ar: 'لا توجد بيانات متاحة' },
    'Tetap': { id: 'Tetap', en: 'Permanent', de: 'Festangestellt', es: 'Permanente', fr: 'Permanent', ar: 'دائم' },
    'Kontrak': { id: 'Kontrak', en: 'Contract', de: 'Vertrag', es: 'Contrato', fr: 'Contractuel', ar: 'عقد' },
    'Magang': { id: 'Magang', en: 'Internship', de: 'Praktikum', es: 'Pasantía', fr: 'Stage', ar: 'تدريب' },
    'Freelance': { id: 'Freelance', en: 'Freelance', de: 'Freiberuflich', es: 'Freelance', fr: 'Freelance', ar: 'عمل حر' },
    '🟢 Aktif': { id: '🟢 Aktif', en: '🟢 Active', de: '🟢 Aktiv', es: '🟢 Activo', fr: '🟢 Actif', ar: '🟢 نشط' },
    '🔴 Nonaktif': { id: '🔴 Nonaktif', en: '🔴 Inactive', de: '🔴 Inaktiv', es: '🔴 Inactivo', fr: '🔴 Inactif', ar: '🔴 غير نشط' },
    'Aktif': { id: 'Aktif', en: 'Active', de: 'Aktiv', es: 'Activo', fr: 'Actif', ar: 'نشط' },
    'Nonaktif': { id: 'Nonaktif', en: 'Inactive', de: 'Inaktiv', es: 'Inactivo', fr: 'Inactif', ar: 'غير نشط' },
    'Copy': { id: 'Salin', en: 'Copy', de: 'Kopieren', es: 'Copiar', fr: 'Copier', ar: 'نسخ' },
    'Salin': { id: 'Salin', en: 'Copy', de: 'Kopieren', es: 'Copiar', fr: 'Copier', ar: 'نسخ' },
    'Paste': { id: 'Tempel', en: 'Paste', de: 'Einfügen', es: 'Pegar', fr: 'Coller', ar: 'لصق' },
    'Tempel': { id: 'Tempel', en: 'Paste', de: 'Einfügen', es: 'Pegar', fr: 'Coller', ar: 'لصق' },

    // Form Common Actions
    'Simpan': { id: 'Simpan', en: 'Save', de: 'Speichern', es: 'Guardar', fr: 'Enregistrer', ar: 'حفظ' },
    'Save': { id: 'Simpan', en: 'Save', de: 'Speichern', es: 'Guardar', fr: 'Enregistrer', ar: 'حفظ' },
    '💾 Simpan': { id: '💾 Simpan', en: '💾 Save', de: '💾 Speichern', es: '💾 Guardar', fr: '💾 Enregistrer', ar: '💾 حفظ' },
    '💾 Save': { id: '💾 Simpan', en: '💾 Save', de: '💾 Speichern', es: '💾 Guardar', fr: '💾 Enregistrer', ar: '💾 حفظ' },
    '💾 Simpan Perubahan': { id: '💾 Simpan Perubahan', en: '💾 Save Changes', de: '💾 Änderungen speichern', es: '💾 Guardar cambios', fr: '💾 Enregistrer les Modifications', ar: '💾 حفظ التغييرات' },
    '💾 Simpan Data Keluarga': { id: '💾 Simpan Data Keluarga', en: '💾 Save Family Data', de: '💾 Familiendaten speichern', es: '💾 Guardar datos familiares', fr: '💾 Enregistrer les Données Familiales', ar: '💾 حفظ بيانات العائلة' },
    'Batal': { id: 'Batal', en: 'Cancel', de: 'Abbrechen', es: 'Cancelar', fr: 'Annuler', ar: 'إلغاء' },
    'Cancel': { id: 'Batal', en: 'Cancel', de: 'Abbrechen', es: 'Cancelar', fr: 'Annuler', ar: 'إلغاء' },
    '✕ Tutup': { id: '✕ Tutup', en: '✕ Close', de: '✕ Schließen', es: '✕ Cerrar', fr: '✕ Fermer', ar: '✕ إغلاق' },
    '✕ Close': { id: '✕ Tutup', en: '✕ Close', de: '✕ Schließen', es: '✕ Cerrar', fr: '✕ Fermer', ar: '✕ إغلاق' },
    'Tutup': { id: 'Tutup', en: 'Close', de: 'Schließen', es: 'Cerrar', fr: 'Fermer', ar: 'إغلاق' },
    'Close': { id: 'Tutup', en: 'Close', de: 'Schließen', es: 'Cerrar', fr: 'Fermer', ar: 'إغلاق' },
    'Hapus': { id: 'Hapus', en: 'Delete', de: 'Löschen', es: 'Eliminar', fr: 'Supprimer', ar: 'حذف' },
    'Delete': { id: 'Hapus', en: 'Delete', de: 'Löschen', es: 'Eliminar', fr: 'Supprimer', ar: 'حذف' },

    // Tabs
    'Data Pribadi': { id: 'Data Pribadi', en: 'Personal Data', de: 'Persönliche Daten', es: 'Datos personales', fr: 'Données Personnelles', ar: 'البيانات الشخصية' },
    'Personal Data': { id: 'Data Pribadi', en: 'Personal Data', de: 'Persönliche Daten', es: 'Datos personales', fr: 'Données Personnelles', ar: 'البيانات الشخصية' },
    'Data Pekerjaan': { id: 'Data Pekerjaan', en: 'Employment Data', de: 'Beschäftigungsdaten', es: 'Datos de empleo', fr: 'Données Professionnelles', ar: 'بيانات العمل' },
    'Employment Data': { id: 'Data Pekerjaan', en: 'Employment Data', de: 'Beschäftigungsdaten', es: 'Datos de empleo', fr: 'Données Professionnelles', ar: 'بيانات العمل' },
    'Kompensasi & Payroll': { id: 'Kompensasi & Payroll', en: 'Compensation & Payroll', de: 'Vergütung & Gehaltsabrechnung', es: 'Compensación y Nómina', fr: 'Rémunération & Paie', ar: 'التعويضات والرواتب' },
    'Compensation & Payroll': { id: 'Kompensasi & Payroll', en: 'Compensation & Payroll', de: 'Vergütung & Gehaltsabrechnung', es: 'Compensación y Nómina', fr: 'Rémunération & Paie', ar: 'التعويضات والرواتب' },
    'Dokumen & Legalitas': { id: 'Dokumen & Legalitas', en: 'Documents & Legality', de: 'Dokumente & Rechtliches', es: 'Documentos y Legalidad', fr: 'Documents & Légalité', ar: 'الوثائق والقانونية' },
    'Documents & Legality': { id: 'Dokumen & Legalitas', en: 'Documents & Legality', de: 'Dokumente & Rechtliches', es: 'Documentos y Legalidad', fr: 'Documents & Légalité', ar: 'الوثائق والقانونية' },
    'Pengalaman Kerja': { id: 'Pengalaman Kerja', en: 'Work Experience', de: 'Berufserfahrung', es: 'Experiencia laboral', fr: 'Expérience Professionnelle', ar: 'الخبرة المهنية' },
    'Work Experience': { id: 'Pengalaman Kerja', en: 'Work Experience', de: 'Berufserfahrung', es: 'Experiencia laboral', fr: 'Expérience Professionnelle', ar: 'الخبرة المهنية' },
    'Riwayat Pendidikan': { id: 'Riwayat Pendidikan', en: 'Education History', de: 'Ausbildungshistorie', es: 'Historial educativo', fr: 'Formation & Diplômes', ar: 'السجل التعليمي' },
    'Education History': { id: 'Riwayat Pendidikan', en: 'Education History', de: 'Ausbildungshistorie', es: 'Historial educativo', fr: 'Formation & Diplômes', ar: 'السجل التعليمي' },
    'Riwayat Karir': { id: 'Riwayat Karir', en: 'Career History', de: 'Karriereverlauf', es: 'Historial profesional', fr: 'Évolution de Carrière', ar: 'السجل الوظيفي' },
    'Career History': { id: 'Riwayat Karir', en: 'Career History', de: 'Karriereverlauf', es: 'Historial profesional', fr: 'Évolution de Carrière', ar: 'السجل الوظيفي' },
    'Data Keluarga': { id: 'Data Keluarga', en: 'Family Data', de: 'Familiendaten', es: 'Datos familiares', fr: 'Données Familiales', ar: 'بيانات العائلة' },
    'Family Data': { id: 'Data Keluarga', en: 'Family Data', de: 'Familiendaten', es: 'Datos familiares', fr: 'Données Familiales', ar: 'بيانات العائلة' },

    // Sub-record buttons
    '➕ Tambah Dokumen': { id: '➕ Tambah Dokumen', en: '➕ Add Document', de: '➕ Dokument hinzufügen', es: '➕ Agregar documento', fr: '➕ Ajouter un Document', ar: '➕ إضافة وثيقة' },
    '✏️ Edit Dokumen': { id: '✏️ Edit Dokumen', en: '✏️ Edit Document', de: '✏️ Dokument bearbeiten', es: '✏️ Editar documento', fr: '✏️ Modifier le Document', ar: '✏️ تعديل الوثيقة' },
    '🗑️ Hapus Dokumen': { id: '🗑️ Hapus Dokumen', en: '🗑️ Delete Document', de: '🗑️ Dokument löschen', es: '🗑️ Eliminar documento', fr: '🗑️ Supprimer le Document', ar: '🗑️ حذف الوثيقة' },
    '➕ Tambah Pengalaman': { id: '➕ Tambah Pengalaman', en: '➕ Add Experience', de: '➕ Erfahrung hinzufügen', es: '➕ Agregar experiencia', fr: '➕ Ajouter une Expérience', ar: '➕ إضافة خبرة' },
    '✏️ Edit Pengalaman': { id: '✏️ Edit Pengalaman', en: '✏️ Edit Experience', de: '✏️ Erfahrung bearbeiten', es: '✏️ Editar experiencia', fr: '✏️ Modifier l\'Expérience', ar: '✏️ تعديل الخبرة' },
    '🗑️ Hapus Pengalaman': { id: '🗑️ Hapus Pengalaman', en: '🗑️ Delete Experience', de: '🗑️ Erfahrung löschen', es: '🗑️ Eliminar experiencia', fr: '🗑️ Supprimer l\'Expérience', ar: '🗑️ حذف الخبرة' },
    '➕ Tambah Pendidikan': { id: '➕ Tambah Pendidikan', en: '➕ Add Education', de: '➕ Ausbildung hinzufügen', es: '➕ Agregar educación', fr: '➕ Ajouter une Formation', ar: '➕ إضافة مؤهل' },
    '✏️ Edit Pendidikan': { id: '✏️ Edit Pendidikan', en: '✏️ Edit Education', de: '✏️ Ausbildung bearbeiten', es: '✏️ Editar educación', fr: '✏️ Modifier la Formation', ar: '✏️ تعديل المؤهل' },
    '🗑️ Hapus Pendidikan': { id: '🗑️ Hapus Pendidikan', en: '🗑️ Delete Education', de: '🗑️ Ausbildung löschen', es: '🗑️ Eliminar educación', fr: '🗑️ Supprimer la Formation', ar: '🗑️ حذف المؤهل' },
    '➕ Catat Riwayat Karir': { id: '➕ Catat Riwayat Karir', en: '➕ Record Career History', de: '➕ Karriereschritt erfassen', es: '➕ Registrar historial profesional', fr: '➕ Enregistrer une Évolution', ar: '➕ تسجيل ترقية/مسار' },
    '✏️ Edit Riwayat Karir': { id: '✏️ Edit Riwayat Karir', en: '✏️ Edit Career History', de: '✏️ Karriereverlauf bearbeiten', es: '✏️ Editar historial profesional', fr: '✏️ Modifier l\'Évolution', ar: '✏️ تعديل المسار الوظيفي' },
    '🗑️ Hapus Riwayat Karir': { id: '🗑️ Hapus Riwayat Karir', en: '🗑️ Delete Career History', de: '🗑️ Karriereverlauf löschen', es: '🗑️ Eliminar historial profesional', fr: '🗑️ Supprimer l\'Évolution', ar: '🗑️ حذف المسار الوظيفي' },
    '➕ Tambah Anggota Keluarga': { id: '➕ Tambah Anggota Keluarga', en: '➕ Add Family Member', de: '➕ Familienmitglied hinzufügen', es: '➕ Agregar familiar', fr: '➕ Ajouter un Membre de Famille', ar: '➕ إضافة فرد من العائلة' },
    '✏️ Edit Anggota Keluarga': { id: '✏️ Edit Anggota Keluarga', en: '✏️ Edit Family Member', de: '✏️ Familienmitglied bearbeiten', es: '✏️ Editar familiar', fr: '✏️ Modifier le Membre de Famille', ar: '✏️ تعديل فرد من العائلة' },
    '🗑️ Hapus Anggota Keluarga': { id: '🗑️ Hapus Anggota Keluarga', en: '🗑️ Delete Family Member', de: '🗑️ Familienmitglied löschen', es: '🗑️ Eliminar familiar', fr: '🗑️ Supprimer le Membre de Famille', ar: '🗑️ حذف فرد من العائلة' },

    // Form Field Labels
    'Nama Lengkap *': { id: 'Nama Lengkap *', en: 'Full Name *', de: 'Vollständiger Name *', es: 'Nombre completo *', fr: 'Nom Complet *', ar: 'الاسم الكامل *' },
    'Nama Lengkap': { id: 'Nama Lengkap', en: 'Full Name', de: 'Vollständiger Name', es: 'Nombre completo', fr: 'Nom Complet', ar: 'الاسم الكامل' },
    'Nama Panggilan': { id: 'Nama Panggilan', en: 'Nickname', de: 'Spitzname', es: 'Apodo', fr: 'Surnom', ar: 'اللقب / الشهرة' },
    'Tempat Lahir': { id: 'Tempat Lahir', en: 'Birth Place', de: 'Geburtsort', es: 'Lugar de nacimiento', fr: 'Lieu de Naissance', ar: 'مكان الميلاد' },
    'Tanggal Lahir': { id: 'Tanggal Lahir', en: 'Birth Date', de: 'Geburtsdatum', es: 'Fecha de nacimiento', fr: 'Date de Naissance', ar: 'تاريخ الميلاد' },
    'Jenis Kelamin': { id: 'Jenis Kelamin', en: 'Gender', de: 'Geschlecht', es: 'Género', fr: 'Genre', ar: 'الجنس' },
    'Gender': { id: 'Jenis Kelamin', en: 'Gender', de: 'Geschlecht', es: 'Género', fr: 'Genre', ar: 'الجنس' },
    'Agama': { id: 'Agama', en: 'Religion', de: 'Religion', es: 'Religión', fr: 'Religion', ar: 'الديانة' },
    'Nomor Telepon / WhatsApp *': { id: 'Nomor Telepon / WhatsApp *', en: 'Phone / WhatsApp *', de: 'Telefon / WhatsApp *', es: 'Teléfono / WhatsApp *', fr: 'Téléphone / WhatsApp *', ar: 'رقم الهاتف / واتساب *' },
    'Email Pribadi *': { id: 'Email Pribadi *', en: 'Personal Email *', de: 'Private E-Mail *', es: 'Correo electrónico personal *', fr: 'Email Personnel *', ar: 'البريد الإلكتروني الشخصي *' },
    'Alamat Tempat Tinggal Saat Ini': { id: 'Alamat Tempat Tinggal Saat Ini', en: 'Current Residential Address', de: 'Aktuelle Wohnadresse', es: 'Dirección residencial actual', fr: 'Adresse Résidentielle Actuelle', ar: 'عنوان السكن الحالي' },
    'Alamat Sesuai KTP': { id: 'Alamat Sesuai KTP', en: 'ID Card Address', de: 'Adresse laut Ausweis', es: 'Dirección según documento', fr: 'Adresse Légale / Carte d\'Identité', ar: 'العنوان حسب الهوية' },
    'Kontak Darurat (Emergency Contact)': { id: 'Kontak Darurat (Emergency Contact)', en: 'Emergency Contact', de: 'Notfallkontakt', es: 'Contacto de emergencia', fr: 'Contact d\'Urgence', ar: 'جهة الاتصال في حالات الطوارئ' },
    'Nama Kontak Darurat': { id: 'Nama Kontak Darurat', en: 'Emergency Contact Name', de: 'Name des Notfallkontakts', es: 'Nombre del contacto de emergencia', fr: 'Nom du Contact d\'Urgence', ar: 'اسم جهة الاتصال للطوارئ' },
    'Hubungan': { id: 'Hubungan', en: 'Relationship', de: 'Beziehung', es: 'Parentesco / Relación', fr: 'Lien de Parenté / Relation', ar: 'صلة القرابة' },
    'Nomor Telepon Darurat': { id: 'Nomor Telepon Darurat', en: 'Emergency Phone Number', de: 'Notfall-Telefonnummer', es: 'Teléfono de emergencia', fr: 'Téléphone d\'Urgence', ar: 'رقم هاتف الطوارئ' },

    'NIK / ID Karyawan *': { id: 'NIK / ID Karyawan *', en: 'Employee ID / NIK *', de: 'Mitarbeiter-ID *', es: 'ID de Empleado *', fr: 'Identifiant Employé *', ar: 'الرقم الوظيفي *' },
    'NIK': { id: 'NIK', en: 'Employee ID', de: 'Mitarbeiter-ID', es: 'ID de Empleado', fr: 'Identifiant Employé', ar: 'الرقم الوظيفي' },
    'Jabatan / Posisi *': { id: 'Jabatan / Posisi *', en: 'Job Title / Position *', de: 'Position / Stelle *', es: 'Cargo / Puesto *', fr: 'Poste / Titre *', ar: 'المسمى الوظيفي *' },
    'Jabatan': { id: 'Jabatan', en: 'Job Title', de: 'Position', es: 'Cargo', fr: 'Poste', ar: 'المسمى الوظيفي' },
    'Tingkat Jabatan': { id: 'Tingkat Jabatan', en: 'Job Level', de: 'Positionsebene', es: 'Nivel del puesto', fr: 'Niveau de Poste', ar: 'المستوى الوظيفي' },
    'Departemen': { id: 'Departemen', en: 'Department', de: 'Abteilung', es: 'Departamento', fr: 'Département', ar: 'القسم' },
    'Divisi / Sub-Departemen': { id: 'Divisi / Sub-Departemen', en: 'Division / Sub-Department', de: 'Bereich / Unterabteilung', es: 'División / Subdepartamento', fr: 'Division / Sous-Département', ar: 'الشعبة / الإدارة الفرعية' },
    'Status Kepegawaian': { id: 'Status Kepegawaian', en: 'Employment Status', de: 'Beschäftigungsstatus', es: 'Estado laboral', fr: 'Statut d\'Emploi', ar: 'الحالة الوظيفية' },
    'Tanggal Bergabung': { id: 'Tanggal Bergabung', en: 'Join Date', de: 'Eintrittsdatum', es: 'Fecha de ingreso', fr: 'Date d\'Embauche', ar: 'تاريخ الانضمام' },
    'Tanggal Berakhir (Kontrak/Magang)': { id: 'Tanggal Berakhir (Kontrak/Magang)', en: 'End Date (Contract/Intern)', de: 'Enddatum (Vertrag/Praktikum)', es: 'Fecha de finalización (Contrato/Pasantía)', fr: 'Date de Fin (Contrat/Stage)', ar: 'تاريخ الانتهاء (عقد/تدريب)' },
    'Atasan Langsung': { id: 'Atasan Langsung', en: 'Direct Manager', de: 'Direkter Vorgesetzter', es: 'Supervisor directo', fr: 'Responsable Direct', ar: 'المدير المباشر' },
    'Lokasi Kerja': { id: 'Lokasi Kerja', en: 'Work Location', de: 'Arbeitsort', es: 'Ubicación de trabajo', fr: 'Lieu de Travail', ar: 'موقع العمل' },
    'Status': { id: 'Status', en: 'Status', de: 'Status', es: 'Estado', fr: 'Statut', ar: 'الحالة' },
    'Masa Kerja': { id: 'Masa Kerja', en: 'Tenure', de: 'Betriebszugehörigkeit', es: 'Antigüedad laboral', fr: 'Ancienneté', ar: 'مدة الخدمة' },

    'Nama Bank': { id: 'Nama Bank', en: 'Bank Name', de: 'Bankname', es: 'Nombre del Banco', fr: 'Nom de la Banque', ar: 'اسم البنك' },
    'Nomor Rekening Bank': { id: 'Nomor Rekening Bank', en: 'Bank Account Number', de: 'Kontonummer', es: 'Número de cuenta bancaria', fr: 'Numéro de Compte Bancaire (IBAN)', ar: 'رقم الحساب البنكي' },
    'Nama Pemilik Rekening': { id: 'Nama Pemilik Rekening', en: 'Account Holder Name', de: 'Kontoinhaber', es: 'Nombre del titular de la cuenta', fr: 'Titulaire du Compte', ar: 'اسم صاحب الحساب' },
    'Gaji Pokok': { id: 'Gaji Pokok', en: 'Basic Salary', de: 'Grundgehalt', es: 'Salario base', fr: 'Salaire de Base', ar: 'الراتب الأساسي' },
    'Tunjangan Jabatan': { id: 'Tunjangan Jabatan', en: 'Position Allowance', de: 'Positionszulage', es: 'Bonificación de cargo', fr: 'Indemnité de Fonction', ar: 'بدل المنصب' },
    'Tunjangan Transport': { id: 'Tunjangan Transport', en: 'Transport Allowance', de: 'Fahrtkostenzuschuss', es: 'Subsidio de transporte', fr: 'Indemnité de Transport', ar: 'بدل المواصلات' },
    'Tunjangan Makan': { id: 'Tunjangan Makan', en: 'Meal Allowance', de: 'Verpflegungszuschuss', es: 'Subsidio de alimentación', fr: 'Indemnité de Restauration', ar: 'بدل الطعام' },
    'Tunjangan Lainnya': { id: 'Tunjangan Lainnya', en: 'Other Allowance', de: 'Sonstige Zulagen', es: 'Otras bonificaciones', fr: 'Autres Indemnités', ar: 'بدلات أخرى' },
    'Total Gaji': { id: 'Total Gaji', en: 'Total Salary', de: 'Gesamtgehalt', es: 'Salario total', fr: 'Salaire Total', ar: 'إجمالي الراتب' },
    'Status Perpajakan (PTKP)': { id: 'Status Perpajakan (PTKP)', en: 'Tax Status', de: 'Steuerstatus', es: 'Estado tributario', fr: 'Statut Fiscal', ar: 'الوضع الضريبي' },
    'Nomor NPWP': { id: 'Nomor NPWP', en: 'Tax ID Number (NPWP)', de: 'Steuernummer', es: 'Número de identificación fiscal', fr: 'Numéro Fiscal', ar: 'الرقم الضريبي' },
    'Nomor BPJS Kesehatan': { id: 'Nomor BPJS Kesehatan', en: 'Health Insurance Number (BPJS)', de: 'Krankenkassennummer', es: 'Número de seguro de salud', fr: 'Numéro d\'Assurance Maladie', ar: 'رقم التأمين الصحي' },
    'Nomor BPJS Ketenagakerjaan': { id: 'Nomor BPJS Ketenagakerjaan', en: 'Employment Insurance (BPJS TK)', de: 'Rentenversicherungsnummer', es: 'Número de seguridad social laboral', fr: 'Numéro de Sécurité Sociale', ar: 'رقم تأمين العمل والتقاعد' },

    // Sub-records fields & headers
    'Jenis Dokumen': { id: 'Jenis Dokumen', en: 'Document Type', de: 'Dokumententyp', es: 'Tipo de documento', fr: 'Type de Document', ar: 'نوع الوثيقة' },
    'Nama / Judul Dokumen': { id: 'Nama / Judul Dokumen', en: 'Document Title', de: 'Dokumententitel', es: 'Título del documento', fr: 'Titre du Document', ar: 'عنوان الوثيقة' },
    'Judul Dokumen *': { id: 'Judul Dokumen *', en: 'Document Title *', de: 'Dokumententitel *', es: 'Título del documento *', fr: 'Titre du Document *', ar: 'عنوان الوثيقة *' },
    'Nomor Dokumen': { id: 'Nomor Dokumen', en: 'Document Number', de: 'Dokumentennummer', es: 'Número de documento', fr: 'Numéro du Document', ar: 'رقم الوثيقة' },
    'Tgl Terbit': { id: 'Tgl Terbit', en: 'Issue Date', de: 'Ausstellungsdatum', es: 'Fecha de emisión', fr: 'Date d\'Émission', ar: 'تاريخ الإصدار' },
    'Tanggal Terbit': { id: 'Tanggal Terbit', en: 'Issue Date', de: 'Ausstellungsdatum', es: 'Fecha de emisión', fr: 'Date d\'Émission', ar: 'تاريخ الإصدار' },
    'Tgl Berakhir': { id: 'Tgl Berakhir', en: 'Expiry Date', de: 'Ablaufdatum', es: 'Fecha de caducidad', fr: 'Date d\'Expiration', ar: 'تاريخ الانتهاء' },
    'Tanggal Berakhir': { id: 'Tanggal Berakhir', en: 'Expiry Date', de: 'Ablaufdatum', es: 'Fecha de caducidad', fr: 'Date d\'Expiration', ar: 'تاريخ الانتهاء' },
    'Keterangan': { id: 'Keterangan', en: 'Description', de: 'Beschreibung', es: 'Descripción', fr: 'Description', ar: 'الوصف / ملاحظات' },
    'Keterangan / Catatan': { id: 'Keterangan / Catatan', en: 'Description / Notes', de: 'Beschreibung / Notizen', es: 'Descripción / Notas', fr: 'Description / Notes', ar: 'الوصف / ملاحظات' },

    'Perusahaan': { id: 'Perusahaan', en: 'Company', de: 'Unternehmen', es: 'Empresa', fr: 'Entreprise', ar: 'الشركة' },
    'Nama Perusahaan *': { id: 'Nama Perusahaan *', en: 'Company Name *', de: 'Unternehmensname *', es: 'Nombre de la empresa *', fr: 'Nom de l\'Entreprise *', ar: 'اسم الشركة *' },
    'Posisi': { id: 'Posisi', en: 'Position', de: 'Position', es: 'Puesto', fr: 'Poste', ar: 'المنصب' },
    'Posisi / Jabatan *': { id: 'Posisi / Jabatan *', en: 'Position / Job Title *', de: 'Position / Stelle *', es: 'Puesto / Cargo *', fr: 'Poste / Titre *', ar: 'المنصب / المسمى الوظيفي *' },
    'Tgl Mulai': { id: 'Tgl Mulai', en: 'Start Date', de: 'Startdatum', es: 'Fecha de inicio', fr: 'Date de Début', ar: 'تاريخ البدء' },
    'Tanggal Mulai': { id: 'Tanggal Mulai', en: 'Start Date', de: 'Startdatum', es: 'Fecha de inicio', fr: 'Date de Début', ar: 'تاريخ البدء' },
    'Tgl Selesai': { id: 'Tgl Selesai', en: 'End Date', de: 'Enddatum', es: 'Fecha de finalización', fr: 'Date de Fin', ar: 'تاريخ الانتهاء' },
    'Tanggal Selesai': { id: 'Tanggal Selesai', en: 'End Date', de: 'Enddatum', es: 'Fecha de finalización', fr: 'Date de Fin', ar: 'تاريخ الانتهاء' },
    'Gaji Terakhir': { id: 'Gaji Terakhir', en: 'Last Salary', de: 'Letztes Gehalt', es: 'Último salario', fr: 'Dernier Salaire', ar: 'آخر راتب' },

    'Institusi Pendidikan': { id: 'Institusi Pendidikan', en: 'Educational Institution', de: 'Bildungseinrichtung', es: 'Institución educativa', fr: 'Établissement Éducatif', ar: 'المؤسسة التعليمية' },
    'Nama Sekolah / Universitas *': { id: 'Nama Sekolah / Universitas *', en: 'School / University Name *', de: 'Name der Schule / Universität *', es: 'Nombre de la escuela / universidad *', fr: 'Nom de l\'École / Université *', ar: 'اسم المدرسة / الجامعة *' },
    'Jenjang': { id: 'Jenjang', en: 'Degree Level', de: 'Abschlussgrad', es: 'Nivel de grado', fr: 'Niveau d\'Études', ar: 'المستوى الدراسي' },
    'Jenjang Pendidikan': { id: 'Jenjang Pendidikan', en: 'Degree Level', de: 'Bildungsstufe', es: 'Nivel educativo', fr: 'Niveau d\'Études', ar: 'المستوى التعليمي' },
    'Jurusan': { id: 'Jurusan', en: 'Major / Field of Study', de: 'Fachrichtung', es: 'Especialidad / Carrera', fr: 'Filière / Domaine d\'Études', ar: 'التخصص' },
    'Jurusan / Program Studi': { id: 'Jurusan / Program Studi', en: 'Major / Program Study', de: 'Studiengang', es: 'Carrera / Programa de estudio', fr: 'Filière / Programme', ar: 'التخصص / البرنامج الدراسي' },
    'Tgl Lulus': { id: 'Tgl Lulus', en: 'Graduation Date', de: 'Abschlussdatum', es: 'Fecha de graduación', fr: 'Date d\'Obtention', ar: 'تاريخ التخرج' },
    'Tanggal Kelulusan': { id: 'Tanggal Kelulusan', en: 'Graduation Date', de: 'Abschlussdatum', es: 'Fecha de graduación', fr: 'Date d\'Obtention', ar: 'تاريخ التخرج' },
    'IPK': { id: 'IPK', en: 'GPA', de: 'Notendurchschnitt (GPA)', es: 'Promedio (GPA)', fr: 'Moyenne (GPA)', ar: 'المعدل التراكمي (GPA)' },
    'IPK / Nilai Akhir': { id: 'IPK / Nilai Akhir', en: 'GPA / Final Grade', de: 'Notendurchschnitt / Abschlussnote', es: 'Promedio / Calificación final', fr: 'Moyenne / Note Finale', ar: 'المعدل التراكمي / الدرجة النهائية' },

    'Jenis Perubahan': { id: 'Jenis Perubahan', en: 'Change Type', de: 'Änderungstyp', es: 'Tipo de cambio', fr: 'Type de Changement', ar: 'نوع التغيير' },
    'Jenis Perubahan Karir *': { id: 'Jenis Perubahan Karir *', en: 'Career Change Type *', de: 'Art des Karriereschritts *', es: 'Tipo de cambio profesional *', fr: 'Type d\'Évolution de Carrière *', ar: 'نوع التغيير الوظيفي *' },
    'Tgl Efektif': { id: 'Tgl Efektif', en: 'Effective Date', de: 'Gültig ab', es: 'Fecha efectiva', fr: 'Date d\'Effet', ar: 'تاريخ السريان' },
    'Tanggal Efektif *': { id: 'Tanggal Efektif *', en: 'Effective Date *', de: 'Gültigkeitsdatum *', es: 'Fecha efectiva *', fr: 'Date d\'Effet *', ar: 'تاريخ السريان *' },
    'Jabatan Baru': { id: 'Jabatan Baru', en: 'New Job Title', de: 'Neue Position', es: 'Nuevo cargo', fr: 'Nouveau Poste', ar: 'المسمى الوظيفي الجديد' },
    'Departemen Baru': { id: 'Departemen Baru', en: 'New Department', de: 'Neue Abteilung', es: 'Nuevo departamento', fr: 'Nouveau Département', ar: 'القسم الجديد' },
    'Gaji Baru': { id: 'Gaji Baru', en: 'New Salary', de: 'Neues Gehalt', es: 'Nuevo salario', fr: 'Nouveau Salaire', ar: 'الراتب الجديد' },
    'Nomor SK': { id: 'Nomor SK', en: 'Decree Number', de: 'Erlaßnummer / Beschlussnummer', es: 'Número de decreto', fr: 'Numéro de Décision', ar: 'رقم القرار الإداري' },
    'Nomor SK / Dokumen Referensi': { id: 'Nomor SK / Dokumen Referensi', en: 'Decree / Reference Document', de: 'Beschluss / Referenzdokument', es: 'Decreto / Documento de referencia', fr: 'Document de Référence / Décision', ar: 'القرار / الوثيقة المرجعية' },
    'Catatan': { id: 'Catatan', en: 'Notes', de: 'Notizen', es: 'Notas', fr: 'Notes', ar: 'ملاحظات' },
    'Catatan / Alasan Perubahan': { id: 'Catatan / Alasan Perubahan', en: 'Notes / Reason for Change', de: 'Notizen / Grund der Änderung', es: 'Notas / Motivo del cambio', fr: 'Notes / Motif du Changement', ar: 'ملاحظات / سبب التغيير' },

    'Nama Anggota Keluarga': { id: 'Nama Anggota Keluarga', en: 'Family Member Name', de: 'Name des Familienmitglieds', es: 'Nombre del familiar', fr: 'Nom du Membre de la Famille', ar: 'اسم فرد العائلة' },
    'Nama Anggota Keluarga *': { id: 'Nama Anggota Keluarga *', en: 'Family Member Name *', de: 'Name des Familienmitglieds *', es: 'Nombre del familiar *', fr: 'Nom du Membre de la Famille *', ar: 'اسم فرد العائلة *' },
    'Hubungan Keluarga *': { id: 'Hubungan Keluarga *', en: 'Family Relationship *', de: 'Verwandtschaftsverhältnis *', es: 'Parentesco familiar *', fr: 'Lien de Parenté *', ar: 'صلة القرابة العائلية *' },
    'Nomor Kontak': { id: 'Nomor Kontak', en: 'Contact Number', de: 'Kontaktnummer', es: 'Número de contacto', fr: 'Numéro de Contact', ar: 'رقم الاتصال' }
  };

  class WiseI18n {
    static currentLanguage = 'id';
    static currentCurrency = 'IDR';

    static getLanguages() {
      return Object.values(LANGUAGES);
    }

    static setLanguage(lang) {
      if (LANGUAGES[lang]) {
        this.currentLanguage = lang;
      }
    }

    static getLanguage() {
      return this.currentLanguage || 'id';
    }

    static setCurrency(curr) {
      if (CURRENCIES[curr]) {
        this.currentCurrency = curr;
      }
    }

    static getCurrency(currCode = null) {
      const code = currCode || this.currentCurrency || 'IDR';
      return CURRENCIES[code] || CURRENCIES.IDR;
    }

    static getCurrencyList() {
      return Object.values(CURRENCIES);
    }

    static getCurrencySymbol(currCode = null) {
      return this.getCurrency(currCode).symbol;
    }

    static getCurrencyPrefix(currCode = null) {
      return this.getCurrency(currCode).prefix;
    }

    // Translates a given text/key based on active language or specified language
    static t(text, lang = null) {
      if (typeof text !== 'string' || !text.trim()) return text;
      const targetLang = lang || this.currentLanguage || 'id';
      const clean = text.trim();

      // Direct dictionary match
      if (DICTIONARY[clean]) {
        const trans = DICTIONARY[clean][targetLang];
        if (trans) {
          // Preserve leading/trailing whitespaces if any
          return text.replace(clean, trans);
        }
      }

      // Handle strings with currency suffix/prefix like "Gaji Pokok - Rp" -> "Gaji Pokok - Rp" or "Basic Salary - $"
      const currencyPattern = /^(.*?)\s*-\s*(Rp|\$|€|£|¥|A\$|C\$|CHF|HK\$|S\$|NZ\$|₩|₹|R\$|₽|R|Mex\$|₺|SAR|AED|RM|฿|₱|₫|NT\$|B\$|៛|₭|K|MOP\$|₮|PKR|৳|Rs|NPR|Rf|Nu|؋|QR|KD|BD|OMR|JD|₪|IQD|IRR|LBP|SYP|YR|₸|soʻm|SM|TMT|с|₼|₾|֏|kr|zł|Kč|Ft|lei|лв|din|KM|ден|L|₴|Br|S\/\.|\$U|₲|Bs\.|₡|RD\$|Q|C\$|B\/\.|J\$|TT\$|Bds\$|BZ\$|G\$|Sr\$|G|EC\$|Afl\.|NAƒ|CI\$|BD\$|E£|₦|KSh|GH₵|MAD|DA|DT|LD|Br|TSh|USh|RF|P|N\$|ZK|MT|Kz|FC|₨|SR|MK|E|S|SDG|SSP|Fdj|Nfk|D|FG|Le|L\$|Esc|Db|CF|Ar|FBu|CFA|FCFA|FJ\$|SI\$|VT|WS\$|T\$)\s*$/i;
      const match = clean.match(currencyPattern);
      if (match) {
        const baseLabel = match[1];
        const transBase = DICTIONARY[baseLabel] ? (DICTIONARY[baseLabel][targetLang] || baseLabel) : baseLabel;
        const currPrefix = this.getCurrency().symbol;
        return `${transBase} - ${currPrefix}`;
      }

      return text;
    }

    // Formats a number to currency string, e.g. 15000000 -> "Rp 15.000.000" or "$15,000.00"
    static formatCurrency(amount, currCode = null) {
      if (amount === undefined || amount === null || isNaN(amount)) {
        const curr = this.getCurrency(currCode);
        return `${curr.prefix}0`;
      }
      const curr = this.getCurrency(currCode);
      const num = Number(amount);
      const hasDecimal = num % 1 !== 0;
      const formattedNumber = num.toLocaleString(curr.locale, {
        minimumFractionDigits: hasDecimal ? 2 : 0,
        maximumFractionDigits: 2
      });
      return `${curr.prefix}${formattedNumber}`;
    }
  }

  if (isBrowser) {
    window.WiseI18n = WiseI18n;
  } else {
    module.exports = WiseI18n;
  }
})();
