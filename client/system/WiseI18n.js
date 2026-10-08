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
    'Organization Management': { id: 'Manajemen Organisasi', en: 'Organization Management', de: 'Organisationsverwaltung', es: 'Gestión de Organización', fr: 'Gestion de l\'Organisation', ar: 'إدارة الهيكل التنظيمي' },
    'Manajemen Organisasi': { id: 'Manajemen Organisasi', en: 'Organization Management', de: 'Organisationsverwaltung', es: 'Gestión de Organización', fr: 'Gestion de l\'Organisation', ar: 'إدارة الهيكل التنظيمي' },
    'Master Data Management': { id: 'Manajemen Master Data', en: 'Master Data Management', de: 'Stammdatenverwaltung', es: 'Gestión de Datos Maestros', fr: 'Gestion des Données de Référence', ar: 'إدارة البيانات الرئيسية' },
    'Manajemen Master Data': { id: 'Manajemen Master Data', en: 'Master Data Management', de: 'Stammdatenverwaltung', es: 'Gestión de Datos Maestros', fr: 'Gestion des Données de Référence', ar: 'إدارة البيانات الرئيسية' },
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
    'Tetap (PKWTT)': { id: 'Tetap (PKWTT)', en: 'Permanent (PKWTT)', de: 'Festangestellt (PKWTT)', es: 'Permanente (PKWTT)', fr: 'Permanent (PKWTT)', ar: 'دائم (PKWTT)' },
    'Kontrak (PKWT)': { id: 'Kontrak (PKWT)', en: 'Contract (PKWT)', de: 'Befristet (PKWT)', es: 'Contrato (PKWT)', fr: 'Contrat (PKWT)', ar: 'محدد المدة (PKWT)' },
    'Probation / Masa Percobaan': { id: 'Probation / Masa Percobaan', en: 'Probation', de: 'Probezeit', es: 'Periodo de prueba', fr: 'Période d\'Essai', ar: 'فترة التجربة' },
    'Magang (Internship)': { id: 'Magang (Internship)', en: 'Internship', de: 'Praktikum', es: 'Pasantía', fr: 'Stage', ar: 'تدريب مهني' },
    'Freelance / Mitra': { id: 'Freelance / Mitra', en: 'Freelance / Partner', de: 'Freiberuflich / Partner', es: 'Freelance / Socio', fr: 'Freelance / Partenaire', ar: 'عمل حر / شريك' },
    'Konsultan': { id: 'Konsultan', en: 'Consultant', de: 'Berater', es: 'Consultor', fr: 'Consultant', ar: 'استشاري' },
    '(Pilih Status Kepegawaian)': { id: '(Pilih Status Kepegawaian)', en: '(Select Employment Status)', de: '(Beschäftigungsstatus wählen)', es: '(Seleccionar estado laboral)', fr: '(Sélectionner le statut d\'emploi)', ar: '(اختر الحالة الوظيفية)' },
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
    'Nomor Kontak': { id: 'Nomor Kontak', en: 'Contact Number', de: 'Kontaktnummer', es: 'Número de contacto', fr: 'Numéro de Contact', ar: 'رقم الاتصال' },

    // ── Master Data Management ────────────────────────────────────
    'Master Data Management — Wise HRIS': { id: 'Manajemen Data Master — Wise HRIS', en: 'Master Data Management — Wise HRIS', de: 'Stammdatenverwaltung — Wise HRIS', es: 'Gestión de Datos Maestros — Wise HRIS', fr: 'Gestion des Données de Référence — Wise HRIS', ar: 'إدارة البيانات الرئيسية — Wise HRIS' },
    'Tambah Data Master — Wise HRIS': { id: 'Tambah Data Master — Wise HRIS', en: 'Add Master Data — Wise HRIS', de: 'Stammdatum hinzufügen — Wise HRIS', es: 'Agregar dato maestro — Wise HRIS', fr: 'Ajouter une Donnée de Référence — Wise HRIS', ar: 'إضافة بيانات رئيسية — Wise HRIS' },
    'Edit Data Master — Wise HRIS': { id: 'Edit Data Master — Wise HRIS', en: 'Edit Master Data — Wise HRIS', de: 'Stammdatum bearbeiten — Wise HRIS', es: 'Editar dato maestro — Wise HRIS', fr: 'Modifier la Donnée de Référence — Wise HRIS', ar: 'تعديل البيانات الرئيسية — Wise HRIS' },
    'Tambah Data Master': { id: 'Tambah Data Master', en: 'Add Master Data', de: 'Stammdatum hinzufügen', es: 'Agregar dato maestro', fr: 'Ajouter une Donnée de Référence', ar: 'إضافة بيانات رئيسية' },
    'Edit Data Master': { id: 'Edit Data Master', en: 'Edit Master Data', de: 'Stammdatum bearbeiten', es: 'Editar dato maestro', fr: 'Modifier la Donnée de Référence', ar: 'تعديل البيانات الرئيسية' },
    'Simpan Data': { id: 'Simpan Data', en: 'Save Data', de: 'Daten speichern', es: 'Guardar datos', fr: 'Enregistrer les données', ar: 'حفظ البيانات' },
    '💾 Simpan Data': { id: '💾 Simpan Data', en: '💾 Save Data', de: '💾 Daten speichern', es: '💾 Guardar datos', fr: '💾 Enregistrer les données', ar: '💾 حفظ البيانات' },
    'Kategori Master': { id: 'Kategori Master', en: 'Master Category', de: 'Stammdatenkategorie', es: 'Categoría maestra', fr: 'Catégorie de Référence', ar: 'فئة البيانات الرئيسية' },
    'Kategori Master *': { id: 'Kategori Master *', en: 'Master Category *', de: 'Stammdatenkategorie *', es: 'Categoría maestra *', fr: 'Catégorie de Référence *', ar: 'فئة البيانات الرئيسية *' },
    '📁 Semua Kategori': { id: '📁 Semua Kategori', en: '📁 All Categories', de: '📁 Alle Kategorien', es: '📁 Todas las categorías', fr: '📁 Toutes les Catégories', ar: '📁 كل الفئات' },
    'Semua Kategori': { id: 'Semua Kategori', en: 'All Categories', de: 'Alle Kategorien', es: 'Todas las categorías', fr: 'Toutes les Catégories', ar: 'كل الفئات' },
    '👨‍👩‍👧‍👦 Hubungan Keluarga (Relationship)': { id: '👨‍👩‍👧‍👦 Hubungan Keluarga (Relationship)', en: '👨‍👩‍👧‍👦 Family Relationship', de: '👨‍👩‍👧‍👦 Verwandtschaftsverhältnis', es: '👨‍👩‍👧‍👦 Relación familiar', fr: '👨‍👩‍👧‍👦 Lien de Parenté', ar: '👨‍👩‍👧‍👦 صلة القرابة' },
    '🕊️ Agama (Religion)': { id: '🕊️ Agama (Religion)', en: '🕊️ Religion', de: '🕊️ Religion', es: '🕊️ Religión', fr: '🕊️ Religion', ar: '🕊️ الديانة' },
    '📋 Status Kepegawaian (Employment Status)': { id: '📋 Status Kepegawaian (Employment Status)', en: '📋 Employment Status', de: '📋 Beschäftigungsstatus', es: '📋 Estado laboral', fr: '📋 Statut d\'Emploi', ar: '📋 الحالة الوظيفية' },
    '📍 Lokasi Kerja (Work Location)': { id: '📍 Lokasi Kerja (Work Location)', en: '📍 Work Location', de: '📍 Arbeitsort', es: '📍 Ubicación de trabajo', fr: '📍 Lieu de Travail', ar: '📍 موقع العمل' },
    '🏦 Bank Payroll (Bank)': { id: '🏦 Bank Payroll (Bank)', en: '🏦 Payroll Bank', de: '🏦 Gehaltsbank', es: '🏦 Banco de nómina', fr: '🏦 Banque de Paie', ar: '🏦 بنك الرواتب' },
    '📄 Jenis Dokumen (Document Type)': { id: '📄 Jenis Dokumen (Document Type)', en: '📄 Document Type', de: '📄 Dokumententyp', es: '📄 Tipo de documento', fr: '📄 Type de Document', ar: '📄 نوع الوثيقة' },
    '🎓 Jenjang Pendidikan (Degree Level)': { id: '🎓 Jenjang Pendidikan (Degree Level)', en: '🎓 Education Degree Level', de: '🎓 Bildungsabschluss', es: '🎓 Nivel de educación', fr: '🎓 Niveau d\'Études', ar: '🎓 درجة التعليم' },
    'Edit': { id: 'Edit', en: 'Edit', de: 'Bearbeiten', es: 'Editar', fr: 'Modifier', ar: 'تعديل' },
    'Toggle Status': { id: 'Toggle Status', en: 'Toggle Status', de: 'Status umschalten', es: 'Cambiar estado', fr: 'Basculer le Statut', ar: 'تبديل الحالة' },
    '🔄 Toggle Status': { id: '🔄 Toggle Status', en: '🔄 Toggle Status', de: '🔄 Status umschalten', es: '🔄 Cambiar estado', fr: '🔄 Basculer le Statut', ar: '🔄 تبديل الحالة' },
    'Toggle Aktif/Nonaktif': { id: 'Toggle Aktif/Nonaktif', en: 'Toggle Active/Inactive', de: 'Status umschalten', es: 'Alternar Activo/Inactivo', fr: 'Basculer Actif/Inactif', ar: 'تبديل نشط/غير نشط' },
    '🔄 Toggle Aktif/Nonaktif': { id: '🔄 Toggle Aktif/Nonaktif', en: '🔄 Toggle Active/Inactive', de: '🔄 Status umschalten', es: '🔄 Alternar Activo/Inactivo', fr: '🔄 Basculer Actif/Inactif', ar: '🔄 تبديل نشط/غير نشط' },
    'Hapus': { id: 'Hapus', en: 'Delete', de: 'Löschen', es: 'Eliminar', fr: 'Supprimer', ar: 'حذف' },
    '🗑️ Hapus': { id: '🗑️ Hapus', en: '🗑️ Delete', de: '🗑️ Löschen', es: '🗑️ Eliminar', fr: '🗑️ Supprimer', ar: '🗑️ حذف' },
    'Segarkan': { id: 'Segarkan', en: 'Refresh', de: 'Aktualisieren', es: 'Actualizar', fr: 'Actualiser', ar: 'تحديث' },
    'Refresh': { id: 'Segarkan', en: 'Refresh', de: 'Aktualisieren', es: 'Actualizar', fr: 'Actualiser', ar: 'تحديث' },
    'Segarkan (Refresh)': { id: 'Segarkan (Refresh)', en: 'Refresh', de: 'Aktualisieren', es: 'Actualizar', fr: 'Actualiser', ar: 'تحديث' },
    '🔄 Segarkan (Refresh)': { id: '🔄 Segarkan (Refresh)', en: '🔄 Refresh', de: '🔄 Aktualisieren', es: '🔄 Actualizar', fr: '🔄 Actualiser', ar: '🔄 تحديث' },
    'Kategori': { id: 'Kategori', en: 'Category', de: 'Kategorie', es: 'Categoría', fr: 'Catégorie', ar: 'الفئة' },
    'Category': { id: 'Kategori', en: 'Category', de: 'Kategorie', es: 'Categoría', fr: 'Catégorie', ar: 'الفئة' },
    'Nama Master Data': { id: 'Nama Master Data', en: 'Master Data Name', de: 'Stammdatenname', es: 'Nombre de datos maestros', fr: 'Nom de la Donnée de Référence', ar: 'اسم البيانات الرئيسية' },
    '📋 Status Pegawai': { id: '📋 Status Pegawai', en: '📋 Employment Status', de: '📋 Beschäftigungsstatus', es: '📋 Estado del empleado', fr: '📋 Statut d\'Emploi', ar: '📋 حالة الموظف' },
    'Status Pegawai': { id: 'Status Pegawai', en: 'Employment Status', de: 'Beschäftigungsstatus', es: 'Estado del empleado', fr: 'Statut d\'Emploi', ar: 'حالة الموظف' },
    'Hubungan Keluarga': { id: 'Hubungan Keluarga', en: 'Family Relationship', de: 'Verwandtschaftsverhältnis', es: 'Relación familiar', fr: 'Lien de Parenté', ar: 'صلة القرابة' },

    // ── Organization & Position Management ────────────────────────
    'Organization & Position Management — Wise HRIS': { id: 'Manajemen Organisasi & Jabatan — Wise HRIS', en: 'Organization & Position Management — Wise HRIS', de: 'Organisations- & Stellenverwaltung — Wise HRIS', es: 'Gestión de Organización y Puestos — Wise HRIS', fr: 'Gestion de l\'Organisation et des Postes — Wise HRIS', ar: 'إدارة الهيكل التنظيمي والوظائف — Wise HRIS' },
    '🏛️ Unit Organisasi (Divisi & Dept)': { id: '🏛️ Unit Organisasi (Divisi & Dept)', en: '🏛️ Organizational Units (Divisions & Depts)', de: '🏛️ Organisationseinheiten (Bereiche & Abteilungen)', es: '🏛️ Unidades Organizativas (Divisiones y Dptos)', fr: '🏛️ Unités Organisationnelles (Divisions & Départements)', ar: '🏛️ الوحدات التنظيمية (الأقسام والإدارات)' },
    '🎖️ Jenjang Jabatan (Job Levels)': { id: '🎖️ Jenjang Jabatan (Job Levels)', en: '🎖️ Job Levels / Grades', de: '🎖️ Positionsebenen / Grade', es: '🎖️ Niveles de Puesto / Grados', fr: '🎖️ Niveaux de Poste / Grades', ar: '🎖️ المستويات الوظيفية / الدرجات' },
    '💼 Master Jabatan (Positions)': { id: '💼 Master Jabatan (Positions)', en: '💼 Master Positions', de: '💼 Stellenverzeichnis', es: '💼 Puestos Maestros', fr: '💼 Répertoire des Postes', ar: '💼 الوظائف والمسميات' },
    'Tambah Unit Organisasi — Wise HRIS': { id: 'Tambah Unit Organisasi — Wise HRIS', en: 'Add Organizational Unit — Wise HRIS', de: 'Organisationseinheit hinzufügen — Wise HRIS', es: 'Agregar unidad organizativa — Wise HRIS', fr: 'Ajouter une Unité Organisationnelle — Wise HRIS', ar: 'إضافة وحدة تنظيمية — Wise HRIS' },
    'Edit Unit Organisasi — Wise HRIS': { id: 'Edit Unit Organisasi — Wise HRIS', en: 'Edit Organizational Unit — Wise HRIS', de: 'Organisationseinheit bearbeiten — Wise HRIS', es: 'Editar unidad organizativa — Wise HRIS', fr: 'Modifier l\'Unité Organisationnelle — Wise HRIS', ar: 'تعديل الوحدة التنظيمية — Wise HRIS' },
    'Tipe': { id: 'Tipe', en: 'Type', de: 'Typ', es: 'Tipo', fr: 'Type', ar: 'النوع' },
    'Tipe Struktur *': { id: 'Tipe Struktur *', en: 'Structure Type *', de: 'Strukturtyp *', es: 'Tipo de estructura *', fr: 'Type de Structure *', ar: 'نوع الهيكل *' },
    'Nama Unit Organisasi': { id: 'Nama Unit Organisasi', en: 'Organizational Unit Name', de: 'Name der Organisationseinheit', es: 'Nombre de la unidad organizativa', fr: 'Nom de l\'Unité Organisationnelle', ar: 'اسم الوحدة التنظيمية' },
    'Induk Organisasi': { id: 'Induk Organisasi', en: 'Parent Organization', de: 'Übergeordnete Organisation', es: 'Organización matriz', fr: 'Organisation Parente', ar: 'الجهة التابعة لها' },
    '(Tidak Ada / Unit Tingkat Atas)': { id: '(Tidak Ada / Unit Tingkat Atas)', en: '(None / Top Level Unit)', de: '(Keine / Oberste Ebene)', es: '(Ninguna / Nivel superior)', fr: '(Aucune / Niveau Supérieur)', ar: '(لا يوجد / المستوى الأعلى)' },
    'Kode Organisasi *': { id: 'Kode Organisasi *', en: 'Organization Code *', de: 'Organisationscode *', es: 'Código de organización *', fr: 'Code Organisationnel *', ar: 'رمز المنظمة *' },
    'Nama Organisasi *': { id: 'Nama Organisasi *', en: 'Organization Name *', de: 'Organisationsname *', es: 'Nombre de la organización *', fr: 'Nom de l\'Organisation *', ar: 'اسم المنظمة *' },
    'Deskripsi': { id: 'Deskripsi', en: 'Description', de: 'Beschreibung', es: 'Descripción', fr: 'Description', ar: 'الوصف' },
    'Deskripsi Fungsi': { id: 'Deskripsi Fungsi', en: 'Functional Description', de: 'Funktionsbeschreibung', es: 'Descripción funcional', fr: 'Description Fonctionnelle', ar: 'الوصف الوظيفي' },
    '💾 Simpan Organisasi': { id: '💾 Simpan Organisasi', en: '💾 Save Organization', de: '💾 Organisation speichern', es: '💾 Guardar organización', fr: '💾 Enregistrer l\'Organisation', ar: '💾 حفظ المنظمة' },
    'Memuat data organisasi...': { id: 'Memuat data organisasi...', en: 'Loading organization data...', de: 'Organisationsdaten werden geladen...', es: 'Cargando datos de organización...', fr: 'Chargement des données de l\'organisation...', ar: 'جاري تحميل بيانات المنظمة...' },

    // Job Levels
    'Tambah Jenjang Jabatan — Wise HRIS': { id: 'Tambah Jenjang Jabatan — Wise HRIS', en: 'Add Job Level — Wise HRIS', de: 'Positionsebene hinzufügen — Wise HRIS', es: 'Agregar nivel de puesto — Wise HRIS', fr: 'Ajouter un Niveau de Poste — Wise HRIS', ar: 'إضافة مستوى وظيفي — Wise HRIS' },
    'Edit Jenjang Jabatan — Wise HRIS': { id: 'Edit Jenjang Jabatan — Wise HRIS', en: 'Edit Job Level — Wise HRIS', de: 'Positionsebene bearbeiten — Wise HRIS', es: 'Editar nivel de puesto — Wise HRIS', fr: 'Modifier le Niveau de Poste — Wise HRIS', ar: 'تعديل المستوى الوظيفI — Wise HRIS' },
    'Nama Jenjang / Grade': { id: 'Nama Jenjang / Grade', en: 'Level / Grade Name', de: 'Stufen- / Gradbezeichnung', es: 'Nombre de nivel / grado', fr: 'Nom du Niveau / Grade', ar: 'اسم المستوى / الدرجة' },
    'Nama Jenjang / Grade *': { id: 'Nama Jenjang / Grade *', en: 'Level / Grade Name *', de: 'Stufen- / Gradbezeichnung *', es: 'Nombre de nivel / grado *', fr: 'Nom du Niveau / Grade *', ar: 'اسم المستوى / الدرجة *' },
    'Kode Jenjang *': { id: 'Kode Jenjang *', en: 'Level Code *', de: 'Stufencode *', es: 'Código de nivel *', fr: 'Code de Niveau *', ar: 'رمز المستوى *' },
    'Tingkat Level': { id: 'Tingkat Level', en: 'Level Rank', de: 'Stufenrang', es: 'Rango de nivel', fr: 'Rang du Niveau', ar: 'الرتبة / المستوى' },
    'Tingkat Level (1-9) *': { id: 'Tingkat Level (1-9) *', en: 'Level Rank (1-9) *', de: 'Stufenrang (1-9) *', es: 'Rango de nivel (1-9) *', fr: 'Rang du Niveau (1-9) *', ar: 'الرتبة / المستوى (1-9) *' },
    'Cakupan Tanggung Jawab': { id: 'Cakupan Tanggung Jawab', en: 'Scope of Responsibility', de: 'Verantwortungsbereich', es: 'Alcance de responsabilidades', fr: 'Périmètre de Responsabilité', ar: 'نطاق المسؤوليات' },
    'Deskripsi Tanggung Jawab': { id: 'Deskripsi Tanggung Jawab', en: 'Responsibility Description', de: 'Beschreibung der Verantwortung', es: 'Descripción de responsabilidades', fr: 'Description des Responsabilités', ar: 'وصف المسؤوليات' },
    '💾 Simpan Jenjang': { id: '💾 Simpan Jenjang', en: '💾 Save Job Level', de: '💾 Positionsebene speichern', es: '💾 Guardar nivel de puesto', fr: '💾 Enregistrer le Niveau', ar: '💾 حفظ المستوى الوظيفي' },

    // Job Positions
    'Tambah Master Jabatan — Wise HRIS': { id: 'Tambah Master Jabatan — Wise HRIS', en: 'Add Position — Wise HRIS', de: 'Stelle hinzufügen — Wise HRIS', es: 'Agregar puesto — Wise HRIS', fr: 'Ajouter un Poste — Wise HRIS', ar: 'إضافة وظيفة جديدة — Wise HRIS' },
    'Edit Master Jabatan — Wise HRIS': { id: 'Edit Master Jabatan — Wise HRIS', en: 'Edit Position — Wise HRIS', de: 'Stelle bearbeiten — Wise HRIS', es: 'Editar puesto — Wise HRIS', fr: 'Modifier le Poste — Wise HRIS', ar: 'تعديل الوظيفة — Wise HRIS' },
    'Judul / Nama Jabatan': { id: 'Judul / Nama Jabatan', en: 'Position Title / Name', de: 'Stellentitel / Name', es: 'Título / Nombre del puesto', fr: 'Titre / Intitulé du Poste', ar: 'المسمى الوظيفي' },
    'Judul / Nama Jabatan *': { id: 'Judul / Nama Jabatan *', en: 'Position Title / Name *', de: 'Stellentitel / Name *', es: 'Título / Nombre del puesto *', fr: 'Titre / Intitulé du Poste *', ar: 'المسمى الوظيفي *' },
    'Kode Posisi / Jabatan *': { id: 'Kode Posisi / Jabatan *', en: 'Position Code *', de: 'Stellencode *', es: 'Código del puesto *', fr: 'Code du Poste *', ar: 'رمز الوظيفة *' },
    'Unit / Departemen': { id: 'Unit / Departemen', en: 'Unit / Department', de: 'Einheit / Abteilung', es: 'Unidad / Departamento', fr: 'Unité / Département', ar: 'الوحدة / القسم' },
    'Unit Organisasi / Dept': { id: 'Unit Organisasi / Dept', en: 'Organizational Unit / Dept', de: 'Organisationseinheit / Abt.', es: 'Unidad Organizativa / Dpto', fr: 'Unité Organisationnelle / Dép.', ar: 'الوحدة التنظيمية / القسم' },
    'Jenjang / Grade': { id: 'Jenjang / Grade', en: 'Level / Grade', de: 'Stufe / Grad', es: 'Nivel / Grado', fr: 'Niveau / Grade', ar: 'المستوى / الدرجة' },
    'Jenjang Jabatan / Grade': { id: 'Jenjang Jabatan / Grade', en: 'Job Level / Grade', de: 'Positionsebene / Grad', es: 'Nivel de puesto / Grado', fr: 'Niveau de Poste / Grade', ar: 'المستوى الوظيفي / الدرجة' },

    // Employee form: org / position / level comboboxes
    'Departemen': { id: 'Departemen', en: 'Department', de: 'Abteilung', es: 'Departamento', fr: 'Département', ar: 'القسم' },
    'Divisi / Sub-Departemen': { id: 'Divisi / Sub-Departemen', en: 'Division / Sub-Department', de: 'Bereich / Unterabteilung', es: 'División / Subdepartamento', fr: 'Division / Sous-département', ar: 'الشعبة / القسم الفرعي' },
    'Jabatan / Posisi *': { id: 'Jabatan / Posisi *', en: 'Job Title / Position *', de: 'Stellenbezeichnung / Position *', es: 'Cargo / Puesto *', fr: 'Intitulé / Poste *', ar: 'المسمى الوظيفي / المنصب *' },
    'Tingkat Jabatan': { id: 'Tingkat Jabatan', en: 'Job Level', de: 'Positionsebene', es: 'Nivel de puesto', fr: 'Niveau de poste', ar: 'المستوى الوظيفي' },
    '(Pilih Departemen)': { id: '(Pilih Departemen)', en: '(Select Department)', de: '(Abteilung wählen)', es: '(Seleccionar departamento)', fr: '(Choisir un département)', ar: '(اختر القسم)' },
    '(Pilih Divisi / Sub-Departemen)': { id: '(Pilih Divisi / Sub-Departemen)', en: '(Select Division / Sub-Department)', de: '(Bereich / Unterabteilung wählen)', es: '(Seleccionar división / subdepartamento)', fr: '(Choisir division / sous-département)', ar: '(اختر الشعبة / القسم الفرعي)' },
    '(Pilih Jabatan)': { id: '(Pilih Jabatan)', en: '(Select Job Title)', de: '(Stelle wählen)', es: '(Seleccionar cargo)', fr: '(Choisir un poste)', ar: '(اختر المسمى الوظيفي)' },
    '(Pilih Tingkat Jabatan)': { id: '(Pilih Tingkat Jabatan)', en: '(Select Job Level)', de: '(Positionsebene wählen)', es: '(Seleccionar nivel de puesto)', fr: '(Choisir un niveau de poste)', ar: '(اختر المستوى الوظيفي)' },
    '(Tidak Terikat Organisasi Spesifik)': { id: '(Tidak Terikat Organisasi Spesifik)', en: '(Not Bound to Specific Org)', de: '(Nicht organisationsgebunden)', es: '(No vinculado a organización específica)', fr: '(Non rattaché à une org. spécifique)', ar: '(غير مرتبط بمنظمة معينة)' },
    '(Pilih Jenjang Jabatan)': { id: '(Pilih Jenjang Jabatan)', en: '(Select Job Level)', de: '(Positionsebene wählen)', es: '(Seleccionar nivel de puesto)', fr: '(Sélectionner le Niveau de Poste)', ar: '(اختر المستوى الوظيفي)' },
    'Uraian Tugas': { id: 'Uraian Tugas', en: 'Job Summary', de: 'Aufgabenbeschreibung', es: 'Resumen de tareas', fr: 'Description des Tâches', ar: 'مهام الوظيفة' },
    'Uraian Tugas Singkat': { id: 'Uraian Tugas Singkat', en: 'Brief Job Summary', de: 'Kurze Aufgabenbeschreibung', es: 'Resumen breve de tareas', fr: 'Bref Résumé des Tâches', ar: 'ملخص موجز للمهام' },
    '💾 Simpan Jabatan': { id: '💾 Simpan Jabatan', en: '💾 Save Position', de: '💾 Stelle speichern', es: '💾 Guardar puesto', fr: '💾 Enregistrer le Poste', ar: '💾 حفظ الوظيفة' },

    // Master Data Management — window titles & labels
    'Master Data Management — Wise HRIS': { id: 'Master Data Management — Wise HRIS', en: 'Master Data Management — Wise HRIS', de: 'Stammdatenverwaltung — Wise HRIS', es: 'Gestión de Datos Maestros — Wise HRIS', fr: 'Gestion des Données de Référence — Wise HRIS', ar: 'إدارة البيانات الرئيسية — Wise HRIS' },
    'Tambah Data': { id: 'Tambah Data', en: 'Add Data', de: 'Daten hinzufügen', es: 'Agregar datos', fr: 'Ajouter des données', ar: 'إضافة بيانات' },
    '➕ Tambah Data': { id: '➕ Tambah Data', en: '➕ Add Data', de: '➕ Daten hinzufügen', es: '➕ Agregar datos', fr: '➕ Ajouter des données', ar: '➕ إضافة بيانات' },
    'Edit Data': { id: 'Edit Data', en: 'Edit Data', de: 'Daten bearbeiten', es: 'Editar datos', fr: 'Modifier les données', ar: 'تعديل البيانات' },
    '✏️ Edit Data': { id: '✏️ Edit Data', en: '✏️ Edit Data', de: '✏️ Daten bearbeiten', es: '✏️ Editar datos', fr: '✏️ Modifier les données', ar: '✏️ تعديل البيانات' },
    'Kode': { id: 'Kode', en: 'Code', de: 'Code', es: 'Código', fr: 'Code', ar: 'الرمز' },
    'Urutan': { id: 'Urutan', en: 'Order', de: 'Reihenfolge', es: 'Orden', fr: 'Ordre', ar: 'الترتيب' },
    'Status': { id: 'Status', en: 'Status', de: 'Status', es: 'Estado', fr: 'Statut', ar: 'الحالة' },
    'Pencarian': { id: 'Pencarian', en: 'Search', de: 'Suche', es: 'Búsqueda', fr: 'Recherche', ar: 'بحث' },
    'Memuat data master...': { id: 'Memuat data master...', en: 'Loading master data...', de: 'Stammdaten werden geladen...', es: 'Cargando datos maestros...', fr: 'Chargement des données de référence...', ar: 'جارٍ تحميل البيانات الرئيسية...' },
    'Kode Unik *': { id: 'Kode Unik *', en: 'Unique Code *', de: 'Eindeutiger Code *', es: 'Código único *', fr: 'Code unique *', ar: 'الرمز الفريد *' },
    'Nama / Deskripsi Tampilan *': { id: 'Nama / Deskripsi Tampilan *', en: 'Display Name / Description *', de: 'Anzeigename / Beschreibung *', es: 'Nombre / Descripción de visualización *', fr: 'Nom / Description d\'affichage *', ar: 'الاسم / الوصف المعروض *' },
    'Keterangan Tambahan': { id: 'Keterangan Tambahan', en: 'Additional Notes', de: 'Zusätzliche Hinweise', es: 'Notas adicionales', fr: 'Notes supplémentaires', ar: 'ملاحظات إضافية' },
    'Urutan Tampilan': { id: 'Urutan Tampilan', en: 'Display Order', de: 'Anzeigereihenfolge', es: 'Orden de visualización', fr: 'Ordre d\'affichage', ar: 'ترتيب العرض' },
    '🟢 Aktif (Bisa Dipilih)': { id: '🟢 Aktif (Bisa Dipilih)', en: '🟢 Active (Selectable)', de: '🟢 Aktiv (Auswählbar)', es: '🟢 Activo (Seleccionable)', fr: '🟢 Actif (Sélectionnable)', ar: '🟢 نشط (قابل للاختيار)' },

    // Organization & Position Management — window titles & labels
    'Organization & Position Management — Wise HRIS': { id: 'Organization & Position Management — Wise HRIS', en: 'Organization & Position Management — Wise HRIS', de: 'Organisations- & Stellenverwaltung — Wise HRIS', es: 'Gestión de Organización y Puestos — Wise HRIS', fr: 'Gestion des Organisations & Postes — Wise HRIS', ar: 'إدارة الهيكل التنظيمي والوظائف — Wise HRIS' },
    '🏛️ Unit Organisasi (Divisi & Dept)': { id: '🏛️ Unit Organisasi (Divisi & Dept)', en: '🏛️ Org Units (Division & Dept)', de: '🏛️ Org.-Einheiten (Abt. & Dept.)', es: '🏛️ Unidades Org. (División y Dpto.)', fr: '🏛️ Unités Org. (Division & Dép.)', ar: '🏛️ الوحدات التنظيمية (الأقسام)' },
    '🎖️ Jenjang Jabatan (Job Levels)': { id: '🎖️ Jenjang Jabatan (Job Levels)', en: '🎖️ Job Levels', de: '🎖️ Stellenebenen', es: '🎖️ Niveles de puesto', fr: '🎖️ Niveaux de Poste', ar: '🎖️ مستويات الوظيفة' },
    '💼 Master Jabatan (Positions)': { id: '💼 Master Jabatan (Positions)', en: '💼 Positions', de: '💼 Stellenverzeichnis', es: '💼 Cargos', fr: '💼 Postes', ar: '💼 الوظائف' },
    'Nama Unit Organisasi': { id: 'Nama Unit Organisasi', en: 'Org. Unit Name', de: 'Name der Org.-Einheit', es: 'Nombre de la Unidad Org.', fr: 'Nom de l\'Unité Org.', ar: 'اسم الوحدة التنظيمية' },
    'Cakupan Tanggung Jawab': { id: 'Cakupan Tanggung Jawab', en: 'Scope of Responsibility', de: 'Verantwortungsbereich', es: 'Alcance de responsabilidades', fr: 'Périmètre de Responsabilité', ar: 'نطاق المسؤوليات' },
    'Judul / Nama Jabatan': { id: 'Judul / Nama Jabatan', en: 'Position Title / Name', de: 'Stellentitel / Name', es: 'Título / Nombre del puesto', fr: 'Titre / Intitulé du Poste', ar: 'المسمى الوظيفي' },
    '(Root / Tingkat Atas)': { id: '(Root / Tingkat Atas)', en: '(Root / Top Level)', de: '(Wurzel / Oberste Ebene)', es: '(Raíz / Nivel superior)', fr: '(Racine / Niveau supérieur)', ar: '(الجذر / المستوى الأعلى)' },
    '(Tidak Ada / Unit Tingkat Atas)': { id: '(Tidak Ada / Unit Tingkat Atas)', en: '(None / Top-level Unit)', de: '(Keine / Übergeordnete Einheit)', es: '(Sin padre / Unidad de nivel superior)', fr: '(Aucun / Unité de niveau supérieur)', ar: '(لا يوجد / وحدة مستوى أعلى)' },

    // Status & summary messages shared
    'Memuat data organisasi...': { id: 'Memuat data organisasi...', en: 'Loading organization data...', de: 'Organisationsdaten werden geladen...', es: 'Cargando datos de organización...', fr: 'Chargement des données de l\'organisation...', ar: 'جارٍ تحميل بيانات التنظيم...' },
    'Menampilkan': { id: 'Menampilkan', en: 'Showing', de: 'Anzeigen', es: 'Mostrando', fr: 'Affichage de', ar: 'عرض' },
    'item data': { id: 'item data', en: 'data items', de: 'Datensätze', es: 'elementos de datos', fr: 'éléments de données', ar: 'عناصر البيانات' },
    'unit organisasi': { id: 'unit organisasi', en: 'org. units', de: 'Org.-Einheiten', es: 'unidades org.', fr: 'unités org.', ar: 'وحدات تنظيمية' },
    'jenjang jabatan': { id: 'jenjang jabatan', en: 'job levels', de: 'Stellenebenen', es: 'niveles de puesto', fr: 'niveaux de poste', ar: 'مستويات وظيفية' },
    'master posisi jabatan': { id: 'master posisi jabatan', en: 'positions', de: 'Stelleneinträge', es: 'cargos', fr: 'postes', ar: 'وظائف' },
    'Aktif': { id: 'Aktif', en: 'Active', de: 'Aktiv', es: 'Activo', fr: 'Actif', ar: 'نشط' },
    'Nonaktif': { id: 'Nonaktif', en: 'Inactive', de: 'Inaktiv', es: 'Inactivo', fr: 'Inactif', ar: 'غير نشط' },
    'Dipilih': { id: 'Dipilih', en: 'Selected', de: 'Ausgewählt', es: 'Seleccionado', fr: 'Sélectionné', ar: 'محدد' },

    // Alert / validation messages
    'Pilih salah satu baris master data yang ingin diedit terlebih dahulu.': { id: 'Pilih salah satu baris master data yang ingin diedit terlebih dahulu.', en: 'Please select a master data row to edit first.', de: 'Bitte zuerst eine Stammdatenzeile zum Bearbeiten auswählen.', es: 'Seleccione primero una fila de datos maestros para editar.', fr: 'Veuillez d\'abord sélectionner une ligne de données de référence à modifier.', ar: 'يرجى تحديد صف بيانات رئيسية للتعديل أولاً.' },
    'Pilih salah satu baris master data terlebih dahulu.': { id: 'Pilih salah satu baris master data terlebih dahulu.', en: 'Please select a master data row first.', de: 'Bitte zuerst eine Stammdatenzeile auswählen.', es: 'Seleccione primero una fila de datos maestros.', fr: 'Veuillez d\'abord sélectionner une ligne de données de référence.', ar: 'يرجى تحديد صف بيانات رئيسية أولاً.' },
    'Pilih baris master data yang ingin dihapus terlebih dahulu.': { id: 'Pilih baris master data yang ingin dihapus terlebih dahulu.', en: 'Please select a master data row to delete first.', de: 'Bitte zuerst eine zu löschende Stammdatenzeile auswählen.', es: 'Seleccione primero una fila de datos maestros para eliminar.', fr: 'Veuillez d\'abord sélectionner une ligne de données de référence à supprimer.', ar: 'يرجى تحديد صف بيانات رئيسية للحذف أولاً.' },
    'Pilih salah satu baris data yang ingin diedit terlebih dahulu.': { id: 'Pilih salah satu baris data yang ingin diedit terlebih dahulu.', en: 'Please select a data row to edit first.', de: 'Bitte zuerst eine Datenzeile zum Bearbeiten auswählen.', es: 'Seleccione primero una fila de datos para editar.', fr: 'Veuillez d\'abord sélectionner une ligne de données à modifier.', ar: 'يرجى تحديد صف بيانات للتعديل أولاً.' },
    'Pilih salah satu baris data terlebih dahulu.': { id: 'Pilih salah satu baris data terlebih dahulu.', en: 'Please select a data row first.', de: 'Bitte zuerst eine Datenzeile auswählen.', es: 'Seleccione primero una fila de datos.', fr: 'Veuillez d\'abord sélectionner une ligne de données.', ar: 'يرجى تحديد صف بيانات أولاً.' },
    'Pilih baris data yang ingin dihapus terlebih dahulu.': { id: 'Pilih baris data yang ingin dihapus terlebih dahulu.', en: 'Please select a data row to delete first.', de: 'Bitte zuerst eine zu löschende Datenzeile auswählen.', es: 'Seleccione primero una fila de datos para eliminar.', fr: 'Veuillez d\'abord sélectionner une ligne de données à supprimer.', ar: 'يرجى تحديد صف بيانات للحذف أولاً.' },
    'Kode master data wajib diisi.': { id: 'Kode master data wajib diisi.', en: 'Master data code is required.', de: 'Stammdaten-Code ist erforderlich.', es: 'El código de datos maestros es obligatorio.', fr: 'Le code de données de référence est requis.', ar: 'رمز البيانات الرئيسية مطلوب.' },
    'Nama master data wajib diisi.': { id: 'Nama master data wajib diisi.', en: 'Master data name is required.', de: 'Stammdaten-Name ist erforderlich.', es: 'El nombre de datos maestros es obligatorio.', fr: 'Le nom de données de référence est requis.', ar: 'اسم البيانات الرئيسية مطلوب.' },
    'Kode organisasi wajib diisi.': { id: 'Kode organisasi wajib diisi.', en: 'Organization code is required.', de: 'Organisations-Code ist erforderlich.', es: 'El código de organización es obligatorio.', fr: 'Le code d\'organisation est requis.', ar: 'رمز المنظمة مطلوب.' },
    'Nama organisasi wajib diisi.': { id: 'Nama organisasi wajib diisi.', en: 'Organization name is required.', de: 'Organisationsname ist erforderlich.', es: 'El nombre de organización es obligatorio.', fr: 'Le nom d\'organisation est requis.', ar: 'اسم المنظمة مطلوب.' },
    'Kode jenjang jabatan wajib diisi.': { id: 'Kode jenjang jabatan wajib diisi.', en: 'Job level code is required.', de: 'Stellenebenen-Code ist erforderlich.', es: 'El código de nivel de puesto es obligatorio.', fr: 'Le code du niveau de poste est requis.', ar: 'رمز مستوى الوظيفة مطلوب.' },
    'Nama jenjang jabatan wajib diisi.': { id: 'Nama jenjang jabatan wajib diisi.', en: 'Job level name is required.', de: 'Stellenebenen-Name ist erforderlich.', es: 'El nombre de nivel de puesto es obligatorio.', fr: 'Le nom du niveau de poste est requis.', ar: 'اسم مستوى الوظيفة مطلوب.' },
    'Kode jabatan wajib diisi.': { id: 'Kode jabatan wajib diisi.', en: 'Position code is required.', de: 'Stellen-Code ist erforderlich.', es: 'El código del cargo es obligatorio.', fr: 'Le code de poste est requis.', ar: 'رمز الوظيفة مطلوب.' },
    'Judul / nama jabatan wajib diisi.': { id: 'Judul / nama jabatan wajib diisi.', en: 'Position title / name is required.', de: 'Stellentitel / Name ist erforderlich.', es: 'El título / nombre del cargo es obligatorio.', fr: 'Le titre / nom du poste est requis.', ar: 'المسمى الوظيفي مطلوب.' }
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

      // 1. Direct dictionary match
      if (DICTIONARY[clean]) {
        const trans = DICTIONARY[clean][targetLang];
        if (trans) {
          return text.replace(clean, trans);
        }
      }

      // 2. Check emoji/symbol prefix match: "🗑️ Hapus" -> emoji "🗑️ ", body "Hapus"
      const emojiMatch = clean.match(/^([\p{Emoji}\u2000-\u3300\uD800-\uDFFF\uFE00-\uFE0F\s]+)\s+(.+)$/u);
      if (emojiMatch) {
        const emojiPrefix = emojiMatch[1].trim();
        const body = emojiMatch[2].trim();
        if (DICTIONARY[body]) {
          const transBody = DICTIONARY[body][targetLang];
          if (transBody) {
            return `${emojiPrefix} ${transBody}`;
          }
        }
      }

      // 3. Handle strings with currency suffix/prefix like "Gaji Pokok - Rp" -> "Gaji Pokok - Rp" or "Basic Salary - $"
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
