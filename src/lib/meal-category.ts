export const mealCategories = [
  "Rice",
  "Jollof",
  "Fried Rice",
  "Noodles",
  "Pasta",
  "Swallow",
  "Soup",
  "Beans",
  "Yam",
  "Potatoes",
  "Plantain",
  "Grill",
  "BBQ",
  "Chicken",
  "Seafood",
  "Shawarma",
  "Wraps",
  "Burgers",
  "Pizza",
  "Sandwiches",
  "Snacks",
  "Pastries",
  "Breakfast",
  "Salads",
  "Desserts",
  "Drinks",
  "Mocktails",
  "Smoothies",
  "Coffee",
  "Local",
  "Meals",
];

type CategoryRule = {
  category: string;
  terms: string[];
};

const categoryRules: CategoryRule[] = [
  {
    category: "Mocktails",
    terms: [
      "mocktail",
      "mojito",
      "zobo mocktail",
      "chapman",
      "virgin colada",
      "pina colada",
      "cosmopolitan",
      "margarita",
      "spritz",
    ],
  },
  {
    category: "Smoothies",
    terms: ["smoothie", "milkshake", "shake", "yoghurt", "yogurt", "parfait"],
  },
  {
    category: "Coffee",
    terms: ["coffee", "latte", "cappuccino", "espresso", "americano", "mocha", "frappe"],
  },
  {
    category: "Drinks",
    terms: [
      "drink",
      "juice",
      "soda",
      "coke",
      "fanta",
      "sprite",
      "pepsi",
      "malt",
      "water",
      "zobo",
      "kunun",
      "kunu",
      "tea",
      "lemonade",
      "iced tea",
      "cocktail",
    ],
  },
  {
    category: "Pasta",
    terms: [
      "spaghetti",
      "spag",
      "sphag",
      "sphagetti",
      "spagetti",
      "pasta",
      "macaroni",
      "mac n cheese",
      "mac and cheese",
      "lasagna",
      "lasagne",
      "alfredo",
      "penne",
      "fusilli",
      "carbonara",
    ],
  },
  {
    category: "Noodles",
    terms: ["indomie", "noodle", "noodles", "ramen", "instant noodle", "chow mein"],
  },
  {
    category: "Fried Rice",
    terms: ["fried rice", "special fried rice", "chinese rice", "egg fried rice"],
  },
  {
    category: "Jollof",
    terms: ["jollof", "party rice", "smoky jollof", "jellof", "jolof"],
  },
  {
    category: "Rice",
    terms: [
      "rice",
      "biryani",
      "basmati",
      "ofada",
      "concoction rice",
      "coconut rice",
      "native rice",
      "white rice",
      "rice and stew",
      "waakye",
    ],
  },
  {
    category: "Swallow",
    terms: [
      "amala",
      "eba",
      "garri",
      "fufu",
      "pounded yam",
      "semo",
      "semovita",
      "wheat",
      "tuwo",
      "lafun",
      "swallow",
    ],
  },
  {
    category: "Soup",
    terms: [
      "egusi",
      "efo",
      "ewedu",
      "gbegiri",
      "okra",
      "okro",
      "ogbono",
      "oha",
      "bitterleaf",
      "afang",
      "edikaikong",
      "nsala",
      "pepper soup",
      "banga",
      "stew",
      "soup",
    ],
  },
  {
    category: "Beans",
    terms: ["beans", "ewa", "ewa agoyin", "akara", "moi moi", "moin moin", "adalu", "gbegiri"],
  },
  {
    category: "Yam",
    terms: ["yam", "puna yam", "yam porridge", "asaro", "fried yam", "boiled yam", "yamarita"],
  },
  {
    category: "Potatoes",
    terms: ["potato", "potatoes", "fries", "chips", "wedges", "sweet potato"],
  },
  {
    category: "Plantain",
    terms: ["plantain", "dodo", "bole", "boli"],
  },
  {
    category: "Shawarma",
    terms: ["shawarma", "sharwama", "shwarma"],
  },
  {
    category: "Wraps",
    terms: ["wrap", "wraps", "tortilla", "burrito", "taco", "quesadilla", "gyro", "roll"],
  },
  {
    category: "Burgers",
    terms: ["burger", "cheeseburger", "hamburger", "slider"],
  },
  {
    category: "Pizza",
    terms: ["pizza", "pepperoni", "margherita"],
  },
  {
    category: "Sandwiches",
    terms: ["sandwich", "toast", "toastie", "panini", "sub", "hot dog"],
  },
  {
    category: "Grill",
    terms: [
      "grill",
      "grilled",
      "suya",
      "asun",
      "kebab",
      "barbecue",
      "bbq",
      "peppered",
      "roasted",
      "roast",
      "smoked",
    ],
  },
  {
    category: "Chicken",
    terms: ["chicken", "wings", "drumstick", "turkey", "nuggets"],
  },
  {
    category: "Seafood",
    terms: ["fish", "catfish", "tilapia", "croaker", "prawn", "shrimp", "seafood", "crab", "calamari"],
  },
  {
    category: "Snacks",
    terms: [
      "small chops",
      "spring roll",
      "samosa",
      "puff puff",
      "puff-puff",
      "meat pie",
      "sausage roll",
      "scotch egg",
      "chin chin",
      "popcorn",
      "snack",
    ],
  },
  {
    category: "Pastries",
    terms: ["cake", "cupcake", "doughnut", "donut", "croissant", "bread", "pie", "pastry"],
  },
  {
    category: "Breakfast",
    terms: ["breakfast", "pancake", "waffle", "omelette", "omelet", "egg sauce", "cereal", "oats"],
  },
  {
    category: "Salads",
    terms: ["salad", "coleslaw", "slaw", "veggie bowl", "vegetable bowl"],
  },
  {
    category: "Desserts",
    terms: ["dessert", "ice cream", "icecream", "sundae", "brownie", "cookie", "pudding"],
  },
  {
    category: "Local",
    terms: [
      "abacha",
      "nkwobi",
      "isi ewu",
      "masa",
      "kilishi",
      "ekpang",
      "ekuru",
      "peppered ponmo",
      "ponmo",
      "local",
    ],
  },
];

const normalizeMealText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesTerm = (text: string, term: string) => {
  const normalizedTerm = normalizeMealText(term);
  return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(
    text,
  );
};

export function inferMealCategory(name: string, description = "") {
  const text = normalizeMealText(`${name} ${description}`);
  if (!text) return "Meals";

  const rule = categoryRules.find((entry) =>
    entry.terms.some((term) => includesTerm(text, term)),
  );
  return rule?.category ?? "Meals";
}
