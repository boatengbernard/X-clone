import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import { Empty } from './Home';

export function Bookmarks() {
  const { state, me } = useStore();
  const posts = [...state.bookmarks].reverse().map((id) => state.posts[id]).filter(Boolean);
  return (
    <>
      <PageHeader title="Bookmarks" subtitle={`@${me.handle}`} />
      {posts.length === 0 ? (
        <Empty title="Save posts for later" body="Bookmark posts to easily find them again in the future." />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </>
  );
}
