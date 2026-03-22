import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

type AnimationType = "none" | "fadeIn" | "slideUp" | "slideLeft" | "scale" | "bounce";

type ImageOverlayProps = {
  /** Caminho da imagem (relativo à pasta public/) */
  src: string;
  /** Largura da imagem */
  width?: number | string;
  /** Altura da imagem */
  height?: number | string;
  /** Posição horizontal */
  x?: number | string;
  /** Posição vertical */
  y?: number | string;
  /** Opacidade (0 a 1) */
  opacity?: number;
  /** Tipo de animação de entrada */
  animation?: AnimationType;
  /** Duração da animação em frames */
  animationDuration?: number;
  /** Estilo CSS adicional */
  style?: React.CSSProperties;
};

/**
 * Componente para adicionar imagens sobre o vídeo.
 *
 * Uso básico:
 *   <ImageOverlay src="images/logo.png" x={50} y={50} width={200} />
 *
 * Com animação:
 *   <ImageOverlay src="images/logo.png" animation="fadeIn" x="50%" y="50%" />
 */
export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  src,
  width = "auto",
  height = "auto",
  x = 0,
  y = 0,
  opacity = 1,
  animation = "none",
  animationDuration = 20,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isStaticFile = !src.startsWith("http");
  const imgSrc = isStaticFile ? staticFile(src) : src;

  let animatedStyle: React.CSSProperties = {};

  switch (animation) {
    case "fadeIn":
      animatedStyle = {
        opacity: interpolate(frame, [0, animationDuration], [0, opacity], {
          extrapolateRight: "clamp",
        }),
      };
      break;
    case "slideUp":
      animatedStyle = {
        transform: `translateY(${interpolate(frame, [0, animationDuration], [50, 0], { extrapolateRight: "clamp" })}px)`,
        opacity: interpolate(frame, [0, animationDuration], [0, opacity], {
          extrapolateRight: "clamp",
        }),
      };
      break;
    case "slideLeft":
      animatedStyle = {
        transform: `translateX(${interpolate(frame, [0, animationDuration], [50, 0], { extrapolateRight: "clamp" })}px)`,
        opacity: interpolate(frame, [0, animationDuration], [0, opacity], {
          extrapolateRight: "clamp",
        }),
      };
      break;
    case "scale": {
      const scaleValue = spring({ frame, fps, durationInFrames: animationDuration });
      animatedStyle = {
        transform: `scale(${scaleValue})`,
      };
      break;
    }
    case "bounce": {
      const bounceValue = spring({
        frame,
        fps,
        config: { damping: 6, stiffness: 200 },
        durationInFrames: animationDuration,
      });
      animatedStyle = {
        transform: `scale(${bounceValue})`,
      };
      break;
    }
    default:
      animatedStyle = { opacity };
  }

  return (
    <Img
      src={imgSrc}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        ...animatedStyle,
        ...style,
      }}
    />
  );
};
