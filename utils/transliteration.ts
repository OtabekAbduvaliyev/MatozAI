
export type Script = 'lat' | 'cyr';

const latToCyrMap: Record<string, string> = {
  "Yo'": "Йў", "yo'": "йў", "Ya": "Я", "ya": "я", "Yo": "Ё", "yo": "ё", "Yu": "Ю", "yu": "ю",
  "O'": "Ў", "o'": "ў", "G'": "Ғ", "g'": "ғ",
  "Sh": "Ш", "sh": "ш", "Ch": "Ч", "ch": "ч", "Ng": "Нг", "ng": "нг",
  "Ye": "Е", "ye": "е", // Context dependent, handled separately ideally, but mapping mostly works
  "A": "А", "a": "а", "B": "Б", "b": "б", "D": "Д", "d": "д",
  "E": "Э", "e": "э", // Context dependent
  "F": "Ф", "f": "ф", "G": "Г", "g": "г", "H": "Ҳ", "h": "ҳ",
  "I": "И", "i": "и", "J": "Ж", "j": "ж", "K": "К", "k": "к",
  "L": "Л", "l": "л", "M": "М", "m": "м", "N": "Н", "n": "н",
  "O": "О", "o": "о", "P": "П", "p": "п", "Q": "Қ", "q": "қ",
  "R": "Р", "r": "р", "S": "С", "s": "с", "T": "Т", "t": "т",
  "U": "У", "u": "у", "V": "В", "v": "в", "X": "Х", "x": "х",
  "Y": "Й", "y": "й", "Z": "З", "z": "з", "'": "ъ"
};

const cyrToLatMap: Record<string, string> = {
  "Я": "Ya", "я": "ya", "Ё": "Yo", "ё": "yo", "Ю": "Yu", "ю": "yu",
  "Ў": "O'", "ў": "o'", "Ғ": "G'", "ғ": "g'",
  "Ш": "Sh", "ш": "sh", "Ч": "Ch", "ч": "ch", "Нг": "Ng", "нг": "ng",
  "А": "A", "а": "a", "Б": "B", "б": "b", "Д": "D", "д": "d",
  "Э": "E", "э": "e", "Е": "Ye", "е": "ye", 
  "Ф": "F", "ф": "f", "Г": "G", "г": "g", "Ҳ": "H", "ҳ": "h",
  "И": "I", "и": "i", "Ж": "J", "ж": "j", "К": "K", "к": "k",
  "Л": "L", "л": "l", "М": "M", "м": "m", "Н": "N", "н": "n",
  "О": "O", "о": "o", "П": "P", "п": "p", "Қ": "Q", "қ": "q",
  "Р": "R", "р": "r", "С": "S", "с": "s", "Т": "T", "т": "t",
  "У": "U", "u": "u", "В": "V", "v": "v", "Х": "X", "х": "x",
  "Й": "Y", "y": "y", "З": "Z", "з": "z", "ъ": "'" 
};

export const toCyrillic = (text: string): string => {
  let result = text;
  
  // Specific multi-character replacements first
  result = result.replace(/Yo'/g, "Йў").replace(/yo'/g, "йў");
  result = result.replace(/Ye/g, "Е").replace(/ye/g, "е"); // Simplified rule
  result = result.replace(/Ya/g, "Я").replace(/ya/g, "я");
  result = result.replace(/Yo/g, "Ё").replace(/yo/g, "ё");
  result = result.replace(/Yu/g, "Ю").replace(/yu/g, "ю");
  result = result.replace(/O'/g, "Ў").replace(/o'/g, "ў");
  result = result.replace(/G'/g, "Ғ").replace(/g'/g, "ғ");
  result = result.replace(/Sh/g, "Ш").replace(/sh/g, "ш");
  result = result.replace(/Ch/g, "Ч").replace(/ch/g, "ч");
  result = result.replace(/Ng/g, "Нг").replace(/ng/g, "нг");

  // Contextual 'E' -> 'Э' (Start of word or after non-consonant mostly, but simplified here)
  // Simple heuristic: E at start of string or after space is Э, otherwise Е? 
  // Standard Uzbek Latin 'e' usually maps to 'э' at start, 'е' after consonant is 'e' in Latin? 
  // Actually: 'Ekran' -> 'Экран'. 'Mening' -> 'Менинг'.
  // So Latin 'E' is 'Э' if start of word, 'Е' if after vowel? 
  // Let's stick to a simpler mapping for 'E' -> 'Э' generally if hard, or 'Е' if simplistic.
  // Correct simple logic: E/e at start of word -> Э/э. Middle of word -> Е/е.
  result = result.replace(/\bE/g, "Э").replace(/\be/g, "э");
  
  // Single char replacement
  return result.split('').map(char => latToCyrMap[char] || char).join('');
};

export const toLatin = (text: string): string => {
  let result = text;
  // Multi-char cyrillic to latin is mostly 1-to-many, so we just iterate map
  // However, 'Е' maps to 'Ye' at start of word, 'e' otherwise.
  
  result = result.replace(/\bЕ/g, "Ye").replace(/\bе/g, "ye");
  // Remaining Е/е are just e
  result = result.replace(/Е/g, "E").replace(/е/g, "e");

  // Standard replacements
  Object.keys(cyrToLatMap).forEach(key => {
    // Escape special regex chars if any (none in this set really)
    if (key !== 'Е' && key !== 'е') {
        const val = cyrToLatMap[key];
        result = result.split(key).join(val);
    }
  });
  
  return result;
};
