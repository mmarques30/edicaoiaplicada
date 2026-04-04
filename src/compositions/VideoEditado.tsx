import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  OffthreadVideo,
  staticFile,
} from "remotion";

// Captions data - word-level timestamps from Whisper
import captionsData from "../data/captions.json";

type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
};

const captions = captionsData as CaptionWord[];

/**
 * Componente de legenda estilo Reels - texto branco limpo na parte inferior,
 * com highlight da palavra atual. Inspirado no vídeo do @martimsilvaI
 */
const ReelsCaption: React.FC<{
  words: CaptionWord[];
  wordsPerGroup?: number;
}> = ({ words, wordsPerGroup = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Agrupa palavras em grupos de N
  const groups: CaptionWord[][] = [];
  for (let i = 0; i < words.length; i += wordsPerGroup) {
    groups.push(words.slice(i, i + wordsPerGroup));
  }

  // Encontra o grupo ativo
  const activeGroup = groups.find((group) => {
    const groupStart = group[0].startMs;
    const groupEnd = group[group.length - 1].endMs;
    return currentTimeMs >= groupStart - 100 && currentTimeMs <= groupEnd + 200;
  });

  if (!activeGroup) return null;

  // Animação de entrada do grupo
  const groupStart = activeGroup[0].startMs;
  const entryProgress = interpolate(
    currentTimeMs,
    [groupStart - 100, groupStart + 100],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 180,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          maxWidth: "85%",
          opacity: entryProgress,
          transform: `translateY(${(1 - entryProgress) * 15}px)`,
        }}
      >
        {activeGroup.map((word, i) => {
          const isActive =
            currentTimeMs >= word.startMs && currentTimeMs < word.endMs;
          const isPast = currentTimeMs >= word.endMs;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontSize: 62,
                fontWeight: 800,
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: isActive ? "#FFFFFF" : isPast ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                textShadow: isActive
                  ? "0 0 20px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.8)"
                  : "0 2px 8px rgba(0,0,0,0.8)",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                transition: "all 0.15s ease-out",
                textTransform: "lowercase",
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Composição principal - Vídeo editado estilo Reels com legendas animadas
 */
export const VideoEditado: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Vídeo principal */}
      <OffthreadVideo
        src={staticFile("videos/video-1080.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Legendas estilo Reels */}
      <ReelsCaption words={captions} wordsPerGroup={4} />
    </AbsoluteFill>
  );
};
