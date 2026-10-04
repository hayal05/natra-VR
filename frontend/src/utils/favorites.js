const FAVORITES_STORAGE_KEY = 'natra_customer_favorites';
const FAVORITES_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();

    const valid = parsed.filter((item) => {
      if (!item || item.foodId == null || !Number.isFinite(item.savedAt)) {
        return false;
      }

      return now - item.savedAt < FAVORITES_TTL_MS;
    });

    if (valid.length !== parsed.length) {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(valid)
      );
    }

    return valid;
  } catch {
    return [];
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(favorites)
  );
}

export function getFavoriteFoodIds() {
  return readFavorites().map((item) => item.foodId);
}

export function isFavoriteFood(foodId) {
  return readFavorites().some(
    (item) => String(item.foodId) === String(foodId)
  );
}

export function addFavoriteFood(foodId) {
  const favorites = readFavorites();

  if (
    favorites.some(
      (item) => String(item.foodId) === String(foodId)
    )
  ) {
    return;
  }

  favorites.push({
    foodId,
    savedAt: Date.now(),
  });

  writeFavorites(favorites);
}

export function removeFavoriteFood(foodId) {
  const favorites = readFavorites().filter(
    (item) => String(item.foodId) !== String(foodId)
  );

  writeFavorites(favorites);
}

export function toggleFavoriteFood(foodId) {
  if (isFavoriteFood(foodId)) {
    removeFavoriteFood(foodId);
    return false;
  }

  addFavoriteFood(foodId);
  return true;
}

export function clearExpiredFavorites() {
  readFavorites();
}
