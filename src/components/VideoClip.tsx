import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
} from "remotion";

type VideoClipProps = {
  /** Caminho do vídeo (relativo à pasta public/) */
  src: string;
  /** Frame onde começa o corte no vídeo fonte */
  trimBefore?: number;
  /** Frame onde termina o corte no vídeo fonte */
  trimAfter?: number;
  /** Velocidade de reprodução (1 = normal, 0.5 = lento, 2 = rápido) */
  playbackRate?: number;
  /** Volume (0 a 1) ou função dinâmica por frame */
  volume?: number | ((frame: number) => number);
  /** Se true, o vídeo fica mudo */
  muted?: boolean;
  /** Estilo CSS adicional para o vídeo */
  style?: React.CSSProperties;
};

/**
 * Componente para importar e cortar vídeos.
 *
 * Uso básico:
 *   <VideoClip src="videos/meu-video.mp4" />
 *
 * Com corte (segundos 10 a 30, a 30fps):
 *   <VideoClip src="videos/meu-video.mp4" trimBefore={300} trimAfter={900} />
 */
export const VideoClip: React.FC<VideoClipProps> = ({
  src,
  trimBefore,
  trimAfter,
  playbackRate = 1,
  volume = 1,
  muted = false,
  style,
}) => {
  const isStaticFile = !src.startsWith("http");
  const videoSrc = isStaticFile ? staticFile(src) : src;

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={videoSrc}
        playbackRate={playbackRate}
        volume={muted ? 0 : volume}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...style,
        }}
        {...(trimBefore !== undefined ? { startFrom: trimBefore } : {})}
        {...(trimAfter !== undefined ? { endAt: trimAfter } : {})}
      />
    </AbsoluteFill>
  );
};

type VideoWithFadeProps = VideoClipProps & {
  /** Duração do fade in em frames */
  fadeInFrames?: number;
  /** Duração do fade out em frames */
  fadeOutFrames?: number;
  /** Duração total da composição em frames */
  durationInFrames: number;
};

/**
 * VideoClip com fade in/out
 */
export const VideoWithFade: React.FC<VideoWithFadeProps> = ({
  fadeInFrames = 15,
  fadeOutFrames = 15,
  durationInFrames,
  ...videoProps
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <VideoClip {...videoProps} />
    </AbsoluteFill>
  );
};
