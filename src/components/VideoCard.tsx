import { useState } from 'react';
import type { VideoLink } from '../utils';
import { PlayIcon } from './Icons';

/** Sermon/video link. Nothing from the other site loads until the viewer taps Play. */
export function VideoCard({ video }: { video: VideoLink }) {
  const [playing, setPlaying] = useState(false);
  const host = (() => {
    try {
      return new URL(video.url).hostname.replace(/^www\./, '');
    } catch {
      return video.platform;
    }
  })();
  return (
    <div className="video" onClick={(e) => e.stopPropagation()}>
      {playing && video.embedUrl ? (
        <div className="video-frame">
          <iframe
            src={video.embedUrl}
            title={`${video.platform} video`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <div className="video-idle">
          <span className="video-platform">{video.platform}</span>
          <span className="muted small">{host} · nothing loads until you tap play</span>
        </div>
      )}
      <div className="video-actions">
        {video.embedUrl && !playing && (
          <button className="btn btn-primary btn-sm" onClick={() => setPlaying(true)}>
            <PlayIcon /> Play here
          </button>
        )}
        <a className="btn btn-outline btn-sm" href={video.url} target="_blank" rel="noreferrer noopener">
          Open on {video.platform} ↗
        </a>
      </div>
    </div>
  );
}
