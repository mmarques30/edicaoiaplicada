import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

type TransitionType = "fade" | "slideLeft" | "slideRight" | "slideUp" | "wipe";

type TransitionWrapperProps = {
  children: React.ReactNode;
  /** Tipo de transição de entrada */
  enterTransition?: TransitionType;
  /** Tipo de transição de saída */
  exitTransition?: TransitionType;
  /** Duração da transição de entrada em frames */
  enterDuration?: number;
  /** Duração da transição de saída em frames */
  exitDuration?: number;
  /** Duração total do componente em frames */
  durationInFrames: number;
};

function getTransitionStyle(
  type: TransitionType,
  progress: number,
): React.CSSProperties {
  switch (type) {
    case "fade":
      return { opacity: progress };
    case "slideLeft":
      return {
        transform: `translateX(${(1 - progress) * 100}%)`,
        opacity: progress,
      };
    case "slideRight":
      return {
        transform: `translateX(${(progress - 1) * 100}%)`,
        opacity: progress,
      };
    case "slideUp":
      return {
        transform: `translateY(${(1 - progress) * 100}%)`,
        opacity: progress,
      };
    case "wipe":
      return {
        clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
      };
    default:
      return {};
  }
}

/**
 * Wrapper para adicionar transições de entrada e saída a qualquer componente.
 *
 * Uso:
 *   <Sequence from={0} durationInFrames={150}>
 *     <TransitionWrapper enterTransition="fade" exitTransition="fade" durationInFrames={150}>
 *       <VideoClip src="videos/clip1.mp4" />
 *     </TransitionWrapper>
 *   </Sequence>
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  enterTransition = "fade",
  exitTransition = "fade",
  enterDuration = 15,
  exitDuration = 15,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // Progresso de entrada (0 → 1)
  const enterProgress = interpolate(frame, [0, enterDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progresso de saída (1 → 0)
  const exitStart = durationInFrames - exitDuration;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const isEntering = frame < enterDuration;
  const isExiting = frame > exitStart;

  let style: React.CSSProperties = {};
  if (isEntering) {
    style = getTransitionStyle(enterTransition, enterProgress);
  } else if (isExiting) {
    style = getTransitionStyle(exitTransition, exitProgress);
  }

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
