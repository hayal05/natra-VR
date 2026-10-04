import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import EntityCard from '../../components/EntityCard';
import ResponsiveGrid from '../../components/ResponsiveGrid';
import RoleShell from '../../components/RoleShell';
import {
  getFavoriteFoodIds,
  toggleFavoriteFood,
} from '../../utils/favorites';
import styles from './Favorites.module.css';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">' +
      '<rect width="100%" height="100%" fill="#e6e9ed"/>' +
      '</svg>'
  );

const FAVORITES_GRID_COLUMNS = {
  base: 2,
  md: 3,
  lg: 4,
  xl: 5,
};

function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

function buildImageSrcSet(imageUrl, thumbnailUrl) {
  if (!imageUrl && !thumbnailUrl) return undefined;

  const entries = [];
  if (thumbnailUrl) entries.push(`${thumbnailUrl} 480w`);
  if (imageUrl && imageUrl !== thumbnailUrl) entries.push(`${imageUrl} 960w`);

  return entries.join(', ') || undefined;
}

export default function Favorites() {
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteFoodIds());
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    const ids = getFavoriteFoodIds();
    setFavoriteIds(ids);

    if (ids.length === 0) {
      setFoods([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const results = await Promise.all(
      ids.map(async (foodId) => {
        try {
          const data = await api.get(`/foods/detail/${foodId}`, {
            auth: false,
          });
          return data.food;
        } catch {
          return null;
        }
      })
    );

    const availableFoods = results.filter(Boolean);
    setFoods(availableFoods);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavorite = (foodId) => {
    toggleFavoriteFood(foodId);

    setFavoriteIds(getFavoriteFoodIds());
    setFoods((current) =>
      current.filter((food) => String(food.id) !== String(foodId))
    );
  };

  const goToFood = (foodId) => {
    navigate(`/food/${foodId}`);
  };

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Favorites</h1>
          <p className={styles.subtitle}>
            Your saved foods
          </p>
        </div>

        {loading ? (
          <p className={styles.status}>Loading favorites…</p>
        ) : foods.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            description="Tap the heart on any food you like and it will appear here."
            action={
              <button
                type="button"
                className={styles.browseButton}
                onClick={() => navigate('/')}
              >
                Browse foods
              </button>
            }
          />
        ) : (
          <ResponsiveGrid
            ariaLabel="Favorite Foods"
            className={styles.foodsGrid}
            columns={FAVORITES_GRID_COLUMNS}
          >
            {foods.map((food) => (
              <EntityCard
                key={food.id}
                image={food.image_url || FALLBACK_IMAGE}
                imageAlt={food.name}
                imageSrcSet={buildImageSrcSet(
                  food.image_url,
                  food.image_thumbnail_url
                )}
                className={styles.foodCard}
                title={food.name}
                subtitle={food.restaurant_name}
                metaLine={formatPrice(food.price)}
                favoriteButton={
                  <button
                    type="button"
                    className={styles.favoriteButton}
                    aria-label={`Remove ${food.name} from favorites`}
                    aria-pressed="true"
                    onClick={() => handleToggleFavorite(food.id)}
                  >
                    ♥
                  </button>
                }
                onClick={() => goToFood(food.id)}
              />
            ))}
          </ResponsiveGrid>
        )}
      </div>
    </RoleShell>
  );
}
