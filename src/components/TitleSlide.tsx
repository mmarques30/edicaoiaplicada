import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type TitleSlideProps = {
  /** Título principal */
  title: string;
  /** Subtítulo (opcional) */
  subtitle?: string;
  /** Cor de fundo */
  backgroundColor?: string;
  /** Cor do título */
  titleColor?: string;
  /** Cor do subtítulo */
  subtitleColor?: string;
  /** Tamanho da fonte do título */
  titleFontSize?: number;
  /** Tamanho da fonte do subtítulo */
  subtitleFontSize?: number;
  /** Animação de entrada */
  animation?: "none" | "fadeUp" | "scale" | "typewriter";
};

/**
 * Slide de título com animações.
 *
 * Uso:
 *   <TitleSlide title="Meu Vídeo" subtitle="Editado com IA" animation="fadeUp" />
 */
export const TitleSlide: React.FC<TitleSlideProps> = ({
  title,
  subtitle,
  backgroundColor = "#000000",
  titleColor = "#ffffff",
  subtitleColor = "#cccccc",
  titleFontSize = 72,
  subtitleFontSize = 36,
  animation = "fadeUp",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let titleStyle: React.CSSProperties = {};
  let subtitleStyle: React.CSSProperties = {};

  switch (animation) {
    case "fadeUp":
      titleStyle = {
        opacity: interpolate(frame, [0, 20], [0, 1], {
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" })}px)`,
      };
      subtitleStyle = {
        opacity: interpolate(frame, [10, 30], [0, 1], {
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(frame, [10, 30], [20, 0], { extrapolateRight: "clamp" })}px)`,
      };
      break;
    case "scale": {
      const titleScale = spring({ frame, fps, durationInFrames: 30 });
      const subtitleScale = spring({
        frame: Math.max(0, frame - 10),
        fps,
        durationInFrames: 30,
      });
      titleStyle = { transform: `scale(${titleScale})` };
      subtitleStyle = { transform: `scale(${subtitleScale})` };
      break;
    }
    case "typewriter": {
      const visibleChars = Math.floor(
        interpolate(frame, [0, 40], [0, title.length], {
          extrapolateRight: "clamp",
        }),
      );
      titleStyle = {};
      // Handled in render
      break;
    }
    default:
      break;
  }

  const displayTitle =
    animation === "typewriter"
      ? title.slice(
          0,
          Math.floor(
            interpolate(frame, [0, 40], [0, title.length], {
              extrapolateRight: "clamp",
            }),
          ),
        )
      : title;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          fontSize: titleFontSize,
          fontWeight: "bold",
          color: titleColor,
          textAlign: "center",
          maxWidth: "80%",
          ...titleStyle,
        }}
      >
        {displayTitle}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: subtitleFontSize,
            color: subtitleColor,
            textAlign: "center",
            maxWidth: "70%",
            ...subtitleStyle,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
