import { useSyncExternalStore } from "react";

/**
 * Returns `false` during SSR and the first client render, then `true` after the
 * component has mounted on the client.
 *
 * This is the hydration-safe replacement for the `useState(false)` +
 * `useEffect(() => setMounted(true), [])` mount-guard idiom. It avoids the
 * `react-hooks/set-state-in-effect` lint error (no setState in an effect) while
 * producing the IDENTICAL render sequence: the server snapshot is `false`, the
 * client hydrates with `false` (matching the server HTML — no mismatch), then
 * React swaps to the client snapshot `true` after mount.
 *
 * Use it to defer rendering values that only exist client-side (e.g. a Zustand
 * `persist` store rehydrated from localStorage) so the SSR/empty value renders
 * first and the real value only after mount.
 */
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
