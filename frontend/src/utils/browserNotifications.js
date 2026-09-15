// browserNotifications — Task 7.5c
//
// Small shared utility split out of `OwnerDashboard.jsx`'s own Task
// 5.20b work: both that screen's "Enable notifications" opt-in card and
// `useOwnerNewOrderAlerts.js`'s new RoleShell-level polling (see that
// file's own header comment) need to read the browser's current
// `Notification` permission the same way, so this is factored out
// rather than duplicated a second time now that two call sites need it.
//
// `Notification` isn't present in every runtime (older browsers, some
// in-app webviews, and this project's own scratch/hand-verification
// harnesses, which don't stub a `window`) — every touch point checks for
// it explicitly via this helper rather than assuming it exists the way
// the rest of this codebase assumes `fetch`/`localStorage` do.
export const NOTIFICATION_UNSUPPORTED = 'unsupported';

export function getNotificationPermission() {
  return typeof Notification === 'undefined' ? NOTIFICATION_UNSUPPORTED : Notification.permission;
}
