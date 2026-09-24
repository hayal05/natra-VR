// Fixture data in the exact shapes the backend returns (see
// backend/src/services/popularFoods.js, search.js, restaurantMenu.js).
// Photos are inline SVGs in three shapes (portrait / landscape / square) so
// a check can prove box sizes don't depend on the photo's own aspect ratio.
const svg = (w, h, fill, label) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
      `<rect width="100%" height="100%" fill="${fill}"/>` +
      `<text x="50%" y="50%" font-size="${Math.round(Math.min(w, h) / 6)}" fill="#fff" ` +
      `text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${label}</text></svg>`
  );

export const PHOTO_SHAPES = [
  (i) => svg(600, 900, '#c47f4a', `P${i}`), // portrait
  (i) => svg(900, 600, '#4a7fc4', `L${i}`), // landscape
  (i) => svg(700, 700, '#7fa64a', `S${i}`), // square
];
const photo = (i) => PHOTO_SHAPES[i % 3](i);

const RESTAURANT_NAMES = [
  ['Habesha Home Kitchen', 'Bole, behind Edna Mall'],
  ["Selamawit's Traditional Ethiopian Home Restaurant", 'Kazanchis, near the Ethiopian Insurance building'],
  ['Abe', 'Piassa'],
  ['Mama Tsehay Kitchen', 'CMC, Michael'],
  ['Gursha House', 'Sarbet'],
  ['Kitfo Bet', 'Merkato'],
  ['Injera Corner', 'Gerji'],
  ['Zenebech Foods', 'Lideta'],
  ['Tikur Abay Grill', 'Megenagna'],
  ['Enat Restaurant', 'Ayat'],
  ['Genet Home Cooking', 'Summit'],
  ['Wro Kitchen', 'Lebu'],
];
export const RESTAURANTS = RESTAURANT_NAMES.map(([name, location_text], i) => ({
  id: i + 1,
  name,
  cover_url: photo(i),
  cover_thumbnail_url: null,
  logo_url: svg(200, 200, ['#d65c08', '#2a7f62', '#7a4fb5'][i % 3], name[0]),
  logo_thumbnail_url: null,
  location_text,
  is_open: i % 4 !== 3,
}));

const FOOD_NAMES = [
  ['Doro Wat', 'Habesha Home Kitchen', 450],
  ['Extra Large Special Mixed Meat Tibs with Injera and Awaze', "Selamawit's Traditional Ethiopian Home Restaurant", 1250],
  ['Firfir', 'Abe', 95],
  ['Kitfo', 'Kitfo Bet', 130.5],
  ['Shiro', 'Mama Tsehay Kitchen', 120],
  ['Special Tibs', 'Gursha House', 380],
  ['Beyaynetu', 'Injera Corner', 210],
  ['Dulet', 'Zenebech Foods', 175],
  ['Tere Siga', 'Tikur Abay Grill', 520],
  ['Genfo', 'Enat Restaurant', 85],
  ['Kikil', 'Genet Home Cooking', 160],
  ['Atkilt Wat', 'Wro Kitchen', 12500.5],
];
export const FOODS = FOOD_NAMES.map(([name, restaurant_name, price], i) => ({
  id: i + 1,
  name,
  price,
  image_url: photo(i),
  image_thumbnail_url: null,
  restaurant_id: (i % 12) + 1,
  restaurant_name,
}));

export const CATEGORIES = ['Traditional', 'Fasting', 'Breakfast', 'Fast Food', 'Drinks', 'Desserts', 'Bakery'].map(
  (name, i) => ({ id: i + 1, name })
);
