"use client";

import { useEffect, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

type Props = {
  streamUrl: string; // HLS URL
};

// Workaround for TypeScript: get Player type from instance
type VideoJsPlayerType = ReturnType<typeof videojs>;

export default function LivePlayer({ streamUrl }: Props) {
  const [player, setPlayer] = useState<VideoJsPlayerType | null>(null);

  useEffect(() => {
    const vjsPlayer = videojs("live-video", {
      controls: true,
      autoplay: true,
      fluid: true,
      sources: [{ src: streamUrl, type: "application/x-mpegURL" }],
    });

    setPlayer(vjsPlayer);

    return () => {
      vjsPlayer.dispose();
    };
  }, [streamUrl]);

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <video
        id="live-video"
        className="video-js vjs-default-skin w-full rounded-lg shadow-lg"
      />
    </div>
  );
}
