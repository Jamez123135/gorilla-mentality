export const resourceReviewDate = "2026-10-12";

// Owner-approved resources only; link to the original work with attribution.
export const resources = [
  {
    id: "R02",
    category: "Training",
    title: "Strength, warm-up and cool-down",
    publisher: "NHS",
    url: "https://www.nhs.uk/live-well/exercise/strength-and-resistance/",
    description:
      "Movement videos for arms, legs, glutes, abs, warming up and cooling down.",
  },
  {
    id: "R03",
    category: "Training",
    title: "Home workouts",
    publisher: "NHS",
    url: "https://www.nhs.uk/better-health/get-active/home-workout-videos/",
    description:
      "Short home cardio, strengthening and stretching sessions for days away from the gym.",
  },
  {
    id: "R05",
    category: "Training",
    title: "Whole-body activity",
    publisher: "CDC",
    url: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    description:
      "Adult aerobic and strengthening guidance, including work for all major muscle groups.",
  },
  {
    id: "R06",
    category: "Nutrition",
    title: "Food and portion data",
    publisher: "USDA FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    description:
      "Look up food composition and compare nutrition values. Preparation state and portions matter.",
  },
  {
    id: "R07",
    category: "Nutrition",
    title: "Healthy recipes",
    publisher: "Canada's Food Guide",
    url: "https://food-guide.canada.ca/en/recipes/",
    description:
      "Search meal ideas by ingredients, cooking method and recipe collection.",
  },
  {
    id: "R09",
    category: "Nutrition",
    title: "Meal-prep safety",
    publisher: "FoodSafety.gov",
    url: "https://www.foodsafety.gov/food-safety-charts",
    description:
      "Cooking-temperature and cold-storage charts for preparing and keeping food safely.",
  },
  {
    id: "R10",
    category: "Recovery",
    title: "Sleep and recovery",
    publisher: "CDC",
    url: "https://www.cdc.gov/sleep/about/index.html",
    description:
      "Age-specific sleep guidance, sleep quality and habits that support recovery.",
  },
  {
    id: "R12",
    category: "Consistency",
    title: "Habits that last",
    publisher: "NIDDK",
    url: "https://www.niddk.nih.gov/health-information/diet-nutrition/changing-habits-better-health",
    description:
      "Build realistic goals, plan around barriers and keep healthy routines going.",
  },
] as const;
