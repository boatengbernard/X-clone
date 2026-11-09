import { Layout } from './components/Layout';
import { Bookmarks } from './pages/Bookmarks';
import { Explore } from './pages/Explore';
import { Home } from './pages/Home';
import { Notifications } from './pages/Notifications';
import { PostDetail } from './pages/PostDetail';
import { Profile } from './pages/Profile';
import { useRoute } from './router';
import { useStore } from './store';

export default function App() {
  const { segments, params } = useRoute();
  const { me } = useStore();
  const [first = 'home', second] = segments;

  let page;
  let active = '';
  switch (first) {
    case 'home':
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
      page = <PostDetail id={second ?? ''} />;
      break;
    default:
      page = <Profile key={first} handle={first} />;
      active = first.toLowerCase() === me.handle.toLowerCase() ? 'profile' : '';
  }

  return <Layout active={active}>{page}</Layout>;
}
