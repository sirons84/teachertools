export const SUPPORTED_LANGUAGES = [
  { code: "ko",    name: "한국어",       nativeName: "한국어",         flag: "🇰🇷" },
  { code: "vi",    name: "베트남어",     nativeName: "Tiếng Việt",     flag: "🇻🇳" },
  { code: "zh-CN", name: "중국어(간체)", nativeName: "简体中文",        flag: "🇨🇳" },
  { code: "tl",    name: "필리핀어",     nativeName: "Filipino",       flag: "🇵🇭" },
  { code: "ja",    name: "일본어",       nativeName: "日本語",          flag: "🇯🇵" },
  { code: "km",    name: "크메르어",     nativeName: "ភាសាខ្មែរ",     flag: "🇰🇭" },
  { code: "th",    name: "태국어",       nativeName: "ภาษาไทย",       flag: "🇹🇭" },
  { code: "uz",    name: "우즈베크어",   nativeName: "Oʻzbekcha",      flag: "🇺🇿" },
  { code: "mn",    name: "몽골어",       nativeName: "Монгол хэл",     flag: "🇲🇳" },
  { code: "ru",    name: "러시아어",     nativeName: "Русский",         flag: "🇷🇺" },
  { code: "en",    name: "영어",         nativeName: "English",        flag: "🇺🇸" },
] as const;

export type LangCode = typeof SUPPORTED_LANGUAGES[number]["code"];
