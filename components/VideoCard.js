// components/VideoCard.js
import Link from 'next/link';

export default function VideoCard({ video }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/videos/${video._id}`}>
        <a>
          <div className="relative">
            <img 
              src={video.thumbnailUrl} 
              alt={video.title}
              className="w-full h-48 object-cover"
            />
            <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
              {formatDuration(video.duration)}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{video.title}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{video.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-indigo-600 text-sm">{video.trainer}</span>
              <span className="text-gray-500 text-sm">{video.views} views</span>
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
}