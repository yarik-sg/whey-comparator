export type ProductType = 'whey' | 'creatine';

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  price: number; // €
  sizeGrams: number;
  proteinPerServing: number; // g
  creatinePerServing?: number; // g
  servings: number;
  flavor: string;
  rating: number; // 0-5
  link?: string;
}

export const products: Product[] = [
  {
    id: 'iso-elite-vanilla',
    name: 'Iso Elite Vanilla',
    brand: 'NutriFuel',
    type: 'whey',
    price: 39.9,
    sizeGrams: 900,
    proteinPerServing: 27,
    servings: 30,
    flavor: 'Vanille',
    rating: 4.6,
    link: '#',
  },
  {
    id: 'power-whey-choco',
    name: 'Power Whey Choco',
    brand: 'PureForce',
    type: 'whey',
    price: 54.9,
    sizeGrams: 2000,
    proteinPerServing: 24,
    servings: 66,
    flavor: 'Chocolat',
    rating: 4.8,
    link: '#',
  },
  {
    id: 'grass-fed-strawberry',
    name: 'Grass-Fed Strawberry',
    brand: 'Alpine Nutrition',
    type: 'whey',
    price: 44.5,
    sizeGrams: 1500,
    proteinPerServing: 25,
    servings: 50,
    flavor: 'Fraise',
    rating: 4.7,
    link: '#',
  },
  {
    id: 'creapure-performance',
    name: 'Creapure Performance',
    brand: 'PureForce',
    type: 'creatine',
    price: 24.9,
    sizeGrams: 500,
    proteinPerServing: 0,
    creatinePerServing: 5,
    servings: 100,
    flavor: 'Neutre',
    rating: 4.9,
    link: '#',
  },
  {
    id: 'micronized-creatine',
    name: 'Micronized Creatine',
    brand: 'NutriFuel',
    type: 'creatine',
    price: 18.5,
    sizeGrams: 300,
    proteinPerServing: 0,
    creatinePerServing: 5,
    servings: 60,
    flavor: 'Neutre',
    rating: 4.5,
    link: '#',
  },
  {
    id: 'vegan-whey-mix',
    name: 'Vegan Whey Mix',
    brand: 'GreenLab',
    type: 'whey',
    price: 32.0,
    sizeGrams: 1000,
    proteinPerServing: 23,
    servings: 33,
    flavor: 'Cookies',
    rating: 4.2,
    link: '#',
  },
];
