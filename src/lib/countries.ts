// Country reference data. `demonym` powers diaspora community names
// ("Spanish in Norway"). Kept intentionally broad but not exhaustive — extend
// freely; anything missing falls back to "People from {Country}".

export interface Country {
  name: string;
  code: string;
  flag: string;
  demonym: string;
}

export const COUNTRIES: Country[] = [
  { name: "Norway", code: "NO", flag: "🇳🇴", demonym: "Norwegian" },
  { name: "Sweden", code: "SE", flag: "🇸🇪", demonym: "Swedish" },
  { name: "Denmark", code: "DK", flag: "🇩🇰", demonym: "Danish" },
  { name: "Finland", code: "FI", flag: "🇫🇮", demonym: "Finnish" },
  { name: "Iceland", code: "IS", flag: "🇮🇸", demonym: "Icelandic" },
  { name: "Spain", code: "ES", flag: "🇪🇸", demonym: "Spanish" },
  { name: "Portugal", code: "PT", flag: "🇵🇹", demonym: "Portuguese" },
  { name: "France", code: "FR", flag: "🇫🇷", demonym: "French" },
  { name: "Germany", code: "DE", flag: "🇩🇪", demonym: "German" },
  { name: "Italy", code: "IT", flag: "🇮🇹", demonym: "Italian" },
  { name: "Poland", code: "PL", flag: "🇵🇱", demonym: "Polish" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", demonym: "Dutch" },
  { name: "Belgium", code: "BE", flag: "🇧🇪", demonym: "Belgian" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", demonym: "British" },
  { name: "Ireland", code: "IE", flag: "🇮🇪", demonym: "Irish" },
  { name: "Greece", code: "GR", flag: "🇬🇷", demonym: "Greek" },
  { name: "Romania", code: "RO", flag: "🇷🇴", demonym: "Romanian" },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬", demonym: "Bulgarian" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦", demonym: "Ukrainian" },
  { name: "Russia", code: "RU", flag: "🇷🇺", demonym: "Russian" },
  { name: "Lithuania", code: "LT", flag: "🇱🇹", demonym: "Lithuanian" },
  { name: "Latvia", code: "LV", flag: "🇱🇻", demonym: "Latvian" },
  { name: "Estonia", code: "EE", flag: "🇪🇪", demonym: "Estonian" },
  { name: "United States", code: "US", flag: "🇺🇸", demonym: "American" },
  { name: "Canada", code: "CA", flag: "🇨🇦", demonym: "Canadian" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", demonym: "Brazilian" },
  { name: "Mexico", code: "MX", flag: "🇲🇽", demonym: "Mexican" },
  { name: "Argentina", code: "AR", flag: "🇦🇷", demonym: "Argentine" },
  { name: "Colombia", code: "CO", flag: "🇨🇴", demonym: "Colombian" },
  { name: "Chile", code: "CL", flag: "🇨🇱", demonym: "Chilean" },
  { name: "India", code: "IN", flag: "🇮🇳", demonym: "Indian" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", demonym: "Pakistani" },
  { name: "China", code: "CN", flag: "🇨🇳", demonym: "Chinese" },
  { name: "Japan", code: "JP", flag: "🇯🇵", demonym: "Japanese" },
  { name: "South Korea", code: "KR", flag: "🇰🇷", demonym: "Korean" },
  { name: "Philippines", code: "PH", flag: "🇵🇭", demonym: "Filipino" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", demonym: "Vietnamese" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", demonym: "Thai" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", demonym: "Indonesian" },
  { name: "Turkey", code: "TR", flag: "🇹🇷", demonym: "Turkish" },
  { name: "Iran", code: "IR", flag: "🇮🇷", demonym: "Iranian" },
  { name: "Syria", code: "SY", flag: "🇸🇾", demonym: "Syrian" },
  { name: "Morocco", code: "MA", flag: "🇲🇦", demonym: "Moroccan" },
  { name: "Egypt", code: "EG", flag: "🇪🇬", demonym: "Egyptian" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", demonym: "Nigerian" },
  { name: "Kenya", code: "KE", flag: "🇰🇪", demonym: "Kenyan" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", demonym: "South African" },
  { name: "Ghana", code: "GH", flag: "🇬🇭", demonym: "Ghanaian" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹", demonym: "Ethiopian" },
  { name: "Somalia", code: "SO", flag: "🇸🇴", demonym: "Somali" },
  { name: "Australia", code: "AU", flag: "🇦🇺", demonym: "Australian" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", demonym: "New Zealander" },
];

const BY_NAME = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));

export function findCountry(name?: string | null): Country | undefined {
  if (!name) return undefined;
  return BY_NAME.get(name.trim().toLowerCase());
}

export function demonym(countryName: string): string {
  return findCountry(countryName)?.demonym ?? `People from ${countryName}`;
}

export function flagFor(countryName?: string | null): string {
  return findCountry(countryName)?.flag ?? "🌍";
}

// A curated shortlist of Norwegian cities plus a free-text fallback in the UI.
export const CITIES = [
  "Oslo",
  "Bergen",
  "Trondheim",
  "Stavanger",
  "Drammen",
  "Fredrikstad",
  "Kristiansand",
  "Tromsø",
  "Sandnes",
  "Bodø",
  "Ålesund",
  "Sandvika",
];

export const LANGUAGES = [
  "Norsk",
  "English",
  "Español",
  "Deutsch",
  "Français",
  "Italiano",
  "Português",
  "Polski",
  "Русский",
  "Українська",
  "العربية",
  "中文",
  "हिन्दी",
  "Tagalog",
  "Tiếng Việt",
  "Soomaali",
  "Türkçe",
  "فارسی",
  "Svenska",
  "Dansk",
];

export const INTERESTS = [
  "Mat & matlaging",
  "Fotball",
  "Turer & friluft",
  "Musikk",
  "Kunst",
  "Gaming",
  "Foreldre & familie",
  "Studenter",
  "Gründer & jobb",
  "Språkutveksling",
  "Trening",
  "Bøker",
  "Reise",
  "Fotografering",
  "Frivillig arbeid",
  "Teknologi",
];
