import { useSyncExternalStore } from 'react';

export type Route =
  | 'home'
  | 'tasks'
  | 'projects'
  | 'arc'
  | 'money'
  | 'fitness'
  | 'learning'
  | 'habits'
  | 'reviews'
  | 'seed'
  | 'calendar'
  | 'notes'
  | 'settings';

const ROUTES: Route[] = ['home', 'tasks', 'projects', 'arc', 'money', 'fitness', 'learning', 'habits', 'reviews', 'seed', 'calendar', 'notes', 'settings'];

function parseHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'home';
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, parseHash);
}

export function navigate(route: Route): void {
  location.hash = `/${route}`;
}

export function goHome(): void {
  navigate('home');
}
