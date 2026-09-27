import { tokenStorage } from '../api/tokenStorage';

const ROLE_SELECTION_INDEX_KEY = 'natraRoleSelectionHistoryIndex';

export function markCustomerHistoryEntry(type) {
  const index = window.history.state?.idx;
  if (!Number.isInteger(index)) return;

  const marker = type === 'home' ? 'natraCustomerHome' : 'natraRoleSelection';
  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      [marker]: true,
    },
    '',
    window.location.href
  );

  if (type === 'role-selection') {
    sessionStorage.setItem(ROLE_SELECTION_INDEX_KEY, String(index));
  }
}

export function logoutToRoleLogin(navigate, role) {
  tokenStorage.clear();

  if (role === 'owner') {
    try {
      sessionStorage.removeItem('natraOwnerOrderBadgeCount');
    } catch {
      // Ignore storage cleanup failures; logout still proceeds.
    }
  }

  const roleSelectionIndex = Number(sessionStorage.getItem(ROLE_SELECTION_INDEX_KEY));
  const currentIndex = window.history.state?.idx;
  const loginPath = role === 'admin' ? '/admin/login' : '/owner/login';

  if (
    Number.isInteger(currentIndex) &&
    Number.isInteger(roleSelectionIndex) &&
    roleSelectionIndex < currentIndex
  ) {
    const delta = roleSelectionIndex - currentIndex;

    const handleReturnToRoleSelection = () => {
      navigate(loginPath, {
        state: { fromLogout: true },
      });
    };

    window.addEventListener('popstate', handleReturnToRoleSelection, { once: true });
    window.history.go(delta);
    return;
  }

  navigate(loginPath);
}
