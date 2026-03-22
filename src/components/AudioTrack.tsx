import React from "react";
import { Audio, staticFile, interpolate, useCurrentFrame } from "remotion";

type AudioTrackProps = {
  /** Caminho do áudio (relativo à pasta public/) */
  src: string;
  /** Volume (0 a 1) */
  volume?: number;
  /** Duração do fade in em frames */
  fadeInFrames?: number;
  /** Duração do fade out em frames */
  fadeOutFrames?: number;
  /** Duração total do áudio em frames (necessário para fade out) */
  durationInFrames?: number;
  /** Se true, o áudio fica em loop */
  loop?: boolean;
  /** Frame onde o áudio começa no arquivo fonte */
  startFrom?: number;
  /** Velocidade de reprodução */
  playbackRate?: number;
};

/**
 * Componente para adicionar faixas de áudio com controle de volume e fade.
 *
 * Uso básico:
 *   <AudioTrack src="audio/musica.mp3" volume={0.3} />
 *
 * Com fade in/out:
 *   <AudioTrack
 *     src="audio/musica.mp3"
 *     volume={0.5}
 *     fadeInFrames={30}
 *     fadeOutFrames={30}
 *     durationInFrames={300}
 *   />
 */
export const AudioTrack: React.FC<AudioTrackProps> = ({
  src,
  volume = 1,
  fadeInFrames = 0,
  fadeOutFrames = 0,
  durationInFrames,
  loop = false,
  startFrom,
  playbackRate,
}) => {
  const frame = useCurrentFrame();
  const isStaticFile = !src.startsWith("http");
  const audioSrc = isStaticFile ? staticFile(src) : src;

  const getVolume = (f: number): number => {
    let vol = volume;

    // Fade in
    if (fadeInFrames > 0 && f < fadeInFrames) {
      vol *= interpolate(f, [0, fadeInFrames], [0, 1], {
        extrapolateRight: "clamp",
      });
    }

    // Fade out
    if (fadeOutFrames > 0 && durationInFrames) {
      const fadeOutStart = durationInFrames - fadeOutFrames;
      if (f > fadeOutStart) {
        vol *= interpolate(f, [fadeOutStart, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
      }
    }

    return vol;
  };

  return (
    <Audio
      src={audioSrc}
      volume={getVolume}
      loop={loop}
      {...(startFrom !== undefined ? { startFrom } : {})}
      {...(playbackRate !== undefined ? { playbackRate } : {})}
    />
  );
};
