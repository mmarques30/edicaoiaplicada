import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { CAPTION_STYLES, COLORS } from "../config";

type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
};

type CaptionProps = {
  /** Array de palavras com timestamps */
  words: CaptionWord[];
  /** Número de palavras por linha */
  wordsPerLine?: number;
  /** Tamanho da fonte */
  fontSize?: number;
  /** Cor do texto */
  color?: string;
  /** Cor do texto ativo (palavra atual) */
  activeColor?: string;
  /** Cor de fundo */
  backgroundColor?: string;
  /** Posição vertical a partir do fundo (px) */
  bottom?: number;
  /** Estilo CSS adicional */
  style?: React.CSSProperties;
};

/**
 * Componente de legendas animadas com highlight palavra por palavra.
 *
 * Uso:
 *   <Caption words={captionData} wordsPerLine={5} />
 *
 * Os dados de caption podem ser gerados com o utilitário transcribe.ts
 */
export const Caption: React.FC<CaptionProps> = ({
  words,
  wordsPerLine = 5,
  fontSize = CAPTION_STYLES.fontSize,
  color = COLORS.captionText,
  activeColor = COLORS.accent,
  backgroundColor = COLORS.captionBg,
  bottom = CAPTION_STYLES.bottom,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Agrupa palavras em linhas
  const lines: CaptionWord[][] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine));
  }

  // Encontra a linha ativa
  const activeLine = lines.find((line) => {
    const lineStart = line[0].startMs;
    const lineEnd = line[line.length - 1].endMs;
    return currentTimeMs >= lineStart && currentTimeMs <= lineEnd;
  });

  if (!activeLine) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: bottom,
      }}
    >
      <div
        style={{
          backgroundColor,
          padding: CAPTION_STYLES.padding,
          borderRadius: CAPTION_STYLES.borderRadius,
          maxWidth: "80%",
          textAlign: "center",
          ...style,
        }}
      >
        {activeLine.map((word, i) => {
          const isActive =
            currentTimeMs >= word.startMs && currentTimeMs < word.endMs;
          const isPast = currentTimeMs >= word.endMs;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontSize,
                fontWeight: "bold",
                color: isActive ? activeColor : isPast ? color : `${color}99`,
                transition: "color 0.1s",
                marginRight: 8,
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

type StaticCaptionProps = {
  /** Texto da legenda */
  text: string;
  /** Tamanho da fonte */
  fontSize?: number;
  /** Cor do texto */
  color?: string;
  /** Cor de fundo */
  backgroundColor?: string;
  /** Posição vertical a partir do fundo (px) */
  bottom?: number;
  /** Tipo de animação */
  animation?: "none" | "fadeIn" | "typewriter";
  /** Estilo CSS adicional */
  style?: React.CSSProperties;
};

/**
 * Legenda estática simples (sem word-level timing)
 */
export const StaticCaption: React.FC<StaticCaptionProps> = ({
  text,
  fontSize = CAPTION_STYLES.fontSize,
  color = COLORS.captionText,
  backgroundColor = COLORS.captionBg,
  bottom = CAPTION_STYLES.bottom,
  animation = "fadeIn",
  style,
}) => {
  const frame = useCurrentFrame();

  let animatedOpacity = 1;
  if (animation === "fadeIn") {
    animatedOpacity = interpolate(frame, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    });
  }

  const displayText =
    animation === "typewriter"
      ? text.slice(0, Math.floor(interpolate(frame, [0, 60], [0, text.length], { extrapolateRight: "clamp" })))
      : text;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: bottom,
        opacity: animatedOpacity,
      }}
    >
      <div
        style={{
          backgroundColor,
          padding: CAPTION_STYLES.padding,
          borderRadius: CAPTION_STYLES.borderRadius,
          maxWidth: "80%",
          textAlign: "center",
          ...style,
        }}
      >
        <span style={{ fontSize, fontWeight: "bold", color }}>{displayText}</span>
      </div>
    </AbsoluteFill>
  );
};
