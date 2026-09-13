export const popularSlugs = [
  "japan",
  "vietnam",
  "thailand",
  "taiwan",
  "guam",
  "philippines",
  "usa",
  "hongkong",
  "singapore",
] as const;

export const continentGroups: { label: string; slugs: string[] }[] = [
  {
    label: "아시아",
    slugs: [
      "japan",
      "vietnam",
      "thailand",
      "taiwan",
      "philippines",
      "china",
      "hongkong",
      "macau",
      "singapore",
      "malaysia",
      "indonesia",
      "laos",
      "cambodia",
      "mongolia",
    ],
  },
  {
    label: "미주·태평양",
    slugs: ["usa", "hawaii", "guam", "saipan", "canada", "australia", "newzealand"],
  },
  {
    label: "유럽·중동",
    slugs: ["uk", "france", "italy", "spain", "germany", "czech", "switzerland", "turkey", "uae"],
  },
];
