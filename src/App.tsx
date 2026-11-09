import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Bookmarks } from './pages/Bookmarks';
import { Explore } from './pages/Explore';
import { Home } from './pages/Home';
import { Notifications } from './pages/Notifications';
import { PostDetail } from './pages/PostDetail';
import { Profile } from './pages/Profile';
import { Welcome } from './pages/Welcome';
import { useRoute } from './router';
import { useStore } from './store';

export default function App() {
  const { segments, params } = useRoute();
  const { me, signedIn } = useStore();
  const [first = 'home', second] = segments;

  if (!signedIn) return <Auth mode={first === 'login' ? 'login' : 'signup'} />;
  if (first === 'welcome') return <Welcome />;

  let page;
  let active = '';
  switch (first) {
    case 'home':
    case 'login':
    case 'signup':
      page = <Home />;
      active = 'home';
      break;
    case 'explore':
      page = <Explore query={params.get('q') ?? ''} />;
      active = 'explore';
      break;
    case 'notifications':
      page = <Notifications />;
      active = 'notifications';
      break;
    case 'bookmarks':
      page = <Bookmarks />;
      active = 'bookmarks';
      break;
    case 'post':
      page = <PostDetail key={second} id={second ?? ''} />;
      break;
    default:
      page = <Profile key={first} handle={first} />;
      active = first.toLowerCase() === me.handle.toLowerCase() ? 'profile' : '';
  }

  return <Layout active={active}>{page}</Layout>;
}
