import { useEffect, useState } from 'react';

/** Tiny hash router: routes look like #/home, #/explore?q=react, #/post/p1, #/bernard */
export function useRoute() {
  const read = () => {
    const raw = window.location.hash.replace(/^#/, '') || '/home';
    const [path, query = ''] = raw.split('?');
    return { path, segments: path.split('/').filter(Boolean), params: new URLSearchParams(query) };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(to: string) {
  window.location.hash = to;
}
