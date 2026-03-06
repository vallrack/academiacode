
'use client';

import ReactPlayer from 'react-player';

interface LessonVideoPlayerProps {
  videoUrl?: string;
  title: string;
}

export function LessonVideoPlayer({ videoUrl, title }: LessonVideoPlayerProps) {

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-muted/50 border rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No hay vídeo para esta lección.</p>
      </div>
    );
  }

  return (
    <div className="aspect-video relative">
      <ReactPlayer 
        url={videoUrl}
        width="100%"
        height="100%"
        controls={true}
        light={true} // Muestra una miniatura hasta que se le da al play
        playing={false} // No auto-play
        config={{
          youtube: {
            playerVars: { showinfo: 0, modestbranding: 1, rel: 0 }
          },
          vimeo: {
            playerOptions: { byline: false, portrait: false }
          }
        }}
      />
    </div>
  );
}
