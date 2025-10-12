export interface PopularCategory {
  id: string;
  label: string;
  query: string;
  icon: string;
  iconColor: string;
  description: string;
}

export const popularCategories: PopularCategory[] = [
  {
    id: "whey",
    label: "Whey protéine",
    query: "whey protein",
    icon: "💪",
    iconColor: "text-primary/70",
    description: "Les best-sellers pour optimiser la récupération musculaire.",
  },
  {
    id: "creatine",
    label: "Créatine monohydrate",
    query: "creatine",
    icon: "⚡",
    iconColor: "text-cyan-300",
    description: "Booster d'explosivité pour franchir vos paliers à l'entraînement.",
  },
  {
    id: "bcaa",
    label: "BCAA & EAA",
    query: "bcaa",
    icon: "🍃",
    iconColor: "text-lime-300",
    description: "Acides aminés essentiels pour soutenir la récupération.",
  },
  {
    id: "preworkout",
    label: "Pré-workout",
    query: "pre workout",
    icon: "🔥",
    iconColor: "text-red-300",
    description: "Formules énergisantes pour des séances plus intenses.",
  },
  {
    id: "accessories",
    label: "Accessoires de gym",
    query: "accessoires musculation fitness",
    icon: "🏋️‍♂️",
    iconColor: "text-purple-300",
    description: "Ceintures, sangles et équipements indispensables.",
  },
  {
    id: "apparel",
    label: "Tenues techniques",
    query: "vêtements sport running fitness homme femme",
    icon: "👕",
    iconColor: "text-sky-300",
    description: "Vêtements respirants et confortables pour performer.",
  },
];

const categoryCounts: Record<string, number> = {
  whey: 168,
  creatine: 94,
  bcaa: 76,
  preworkout: 58,
  accessories: 132,
  apparel: 87,
};

export async function fetchPopularCategoryCounts(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(categoryCounts);
    }, 250);
  });
}
