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
  Easing,
} from "remotion";

import captionsData from "../data/captions.json";

type CaptionWord = { text: string; startMs: number; endMs: number };
const captions = captionsData as CaptionWord[];

// ============================================================
// EDIÇÃO: Definir os cortes e efeitos do vídeo
// ============================================================

type CutType = {
  /** Segundo de início no vídeo fonte */
  srcStart: number;
  /** Segundo de fim no vídeo fonte */
  srcEnd: number;
  /** Zoom (1 = normal, 1.3 = zoom in) */
  zoom?: number;
  /** Posição do zoom: "center" | "top" | "bottom" | "face" */
  zoomTarget?: "center" | "top" | "bottom" | "face";
  /** B-roll: arquivo de vídeo para sobrepor */
  broll?: string;
  /** Segundo de início do b-roll dentro do corte */
  brollStart?: number;
  /** Duração do b-roll em segundos */
  brollDuration?: number;
  /** Transição de entrada: "cut" | "fade" | "zoom-in" */
  transition?: "cut" | "fade" | "zoom-in";
};

// Timeline de edição - cada entrada é uma cena
const CUTS: CutType[] = [
  // INTRO - Hook forte
  {
    srcStart: 13,
    srcEnd: 22,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "fade",
  },

  // "faz o trabalho de 10 pessoas" - zoom dramático
  {
    srcStart: 22,
    srcEnd: 30,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "zoom-in",
  },

  // "1 bilhão de dólares" + competindo com maiores
  {
    srcStart: 30,
    srcEnd: 42,
    zoom: 1.0,
    transition: "cut",
  },

  // "vou te mostrar o poder real" - zoom in
  {
    srcStart: 42,
    srcEnd: 52,
    zoom: 1.3,
    zoomTarget: "face",
    transition: "zoom-in",
  },

  // CENÁRIO 1: Lançar negócio do zero
  {
    srcStart: 52,
    srcEnd: 65,
    zoom: 1.0,
    transition: "fade",
  },

  // Cenário 1: pesquisa, referências, identidade visual
  {
    srcStart: 65,
    srcEnd: 78,
    zoom: 1.2,
    zoomTarget: "face",
  },

  // "Logo, cores, cartões"
  {
    srcStart: 78,
    srcEnd: 85,
    zoom: 1.35,
    zoomTarget: "face",
    transition: "zoom-in",
  },

  // CENÁRIO 2: Website completo
  {
    srcStart: 93,
    srcEnd: 108,
    zoom: 1.0,
    transition: "fade",
  },

  // CENÁRIO 3: Apresentação / Pitch deck
  {
    srcStart: 118,
    srcEnd: 136,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "fade",
  },

  // CENÁRIO 4: Clientes chegando, automação
  {
    srcStart: 185,
    srcEnd: 205,
    zoom: 1.0,
    transition: "fade",
  },

  // ENCERRAMENTO: workspace de IA, CTA
  {
    srcStart: 222,
    srcEnd: 245,
    zoom: 1.2,
    zoomTarget: "face",
    transition: "fade",
  },

  // CTA final - "Quer testar? Comenta"
  {
    srcStart: 245,
    srcEnd: 260,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "zoom-in",
  },
];

const FPS = 30;

// Calcular timeline final
function buildTimeline() {
  let currentFrame = 0;
  return CUTS.map((cut) => {
    const durationSec = cut.srcEnd - cut.srcStart;
    const durationFrames = Math.round(durationSec * FPS);
    const entry = {
      ...cut,
      startFrame: currentFrame,
      durationFrames,
    };
    currentFrame += durationFrames;
    return entry;
  });
}

const TIMELINE = buildTimeline();
const TOTAL_FRAMES = TIMELINE.reduce((sum, t) => sum + t.durationFrames, 0);

// ============================================================
// COMPONENTES
// ============================================================

/** Clip de vídeo com zoom dinâmico */
const ZoomVideo: React.FC<{
  src: string;
  startFrom: number;
  zoom: number;
  zoomTarget: string;
  durationFrames: number;
  transition: string;
}> = ({ src, startFrom, zoom, zoomTarget, durationFrames, transition }) => {
  const frame = useCurrentFrame();

  // Zoom animado com spring
  const zoomProgress = spring({
    frame,
    fps: FPS,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 20,
  });

  const currentZoom = interpolate(zoomProgress, [0, 1], [1, zoom]);

  // Posição do zoom
  let transformOrigin = "center center";
  if (zoomTarget === "face") transformOrigin = "center 30%";
  else if (zoomTarget === "top") transformOrigin = "center 20%";
  else if (zoomTarget === "bottom") transformOrigin = "center 80%";

  // Transição de entrada
  let opacity = 1;
  if (transition === "fade") {
    opacity = interpolate(frame, [0, 8], [0, 1], {
      extrapolateRight: "clamp",
    });
  }

  // Zoom-in entrance effect
  let entranceScale = 1;
  if (transition === "zoom-in") {
    entranceScale = interpolate(frame, [0, 10], [1.1, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }

  // Slow Ken Burns drift
  const drift = interpolate(frame, [0, durationFrames], [0, 2], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={Math.round(startFrom * FPS)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${currentZoom * entranceScale}) translateY(${drift}px)`,
          transformOrigin,
        }}
      />
    </AbsoluteFill>
  );
};

/** Overlay de B-roll com entrada/saída */
const BRollOverlay: React.FC<{
  src: string;
  startSec: number;
  durationSec: number;
  parentDurationFrames: number;
}> = ({ src, startSec, durationSec, parentDurationFrames }) => {
  const frame = useCurrentFrame();
  const startFrame = Math.round(startSec * FPS);
  const durationFrames = Math.round(durationSec * FPS);
  const endFrame = startFrame + durationFrames;

  // Só mostra no intervalo correto
  if (frame < startFrame || frame > endFrame) return null;

  const localFrame = frame - startFrame;

  // Animação de entrada (scale + fade)
  const enterProgress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
    durationInFrames: 12,
  });

  // Fade out nos últimos 8 frames
  const fadeOut = interpolate(
    localFrame,
    [durationFrames - 8, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const scale = interpolate(enterProgress, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity: enterProgress * fadeOut,
        transform: `scale(${scale})`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Borda decorativa */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "3px solid rgba(255,255,255,0.15)",
          borderRadius: 16,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <OffthreadVideo
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

/** Flash branco entre cortes para efeito dinâmico */
const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 3], [0.6, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#fff",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

/** Barra de progresso no topo (estilo Reels) */
const ProgressBar: React.FC<{
  totalFrames: number;
  segments: number;
}> = ({ totalFrames, segments }) => {
  const frame = useCurrentFrame();
  const segmentWidth = 100 / segments;
  const currentSegment = Math.floor((frame / totalFrames) * segments);
  const segmentProgress =
    ((frame / totalFrames) * segments - currentSegment) * 100;

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 24,
        right: 24,
        display: "flex",
        gap: 4,
        zIndex: 10,
      }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width:
                i < currentSegment
                  ? "100%"
                  : i === currentSegment
                    ? `${segmentProgress}%`
                    : "0%",
              height: "100%",
              backgroundColor: "#fff",
              borderRadius: 2,
            }}
          />
        </div>
      ))}
    </div>
  );
};

/** Legendas estilo Reels com highlight */
const ReelsCaption: React.FC<{
  words: CaptionWord[];
  currentTimeMs: number;
  wordsPerGroup?: number;
}> = ({ words, currentTimeMs, wordsPerGroup = 4 }) => {
  const frame = useCurrentFrame();

  const groups: CaptionWord[][] = [];
  for (let i = 0; i < words.length; i += wordsPerGroup) {
    groups.push(words.slice(i, i + wordsPerGroup));
  }

  const activeGroup = groups.find((group) => {
    const groupStart = group[0].startMs;
    const groupEnd = group[group.length - 1].endMs;
    return currentTimeMs >= groupStart - 100 && currentTimeMs <= groupEnd + 200;
  });

  if (!activeGroup) return null;

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
                fontSize: 58,
                fontWeight: 800,
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: isActive
                  ? "#FFFFFF"
                  : isPast
                    ? "#FFFFFF"
                    : "rgba(255,255,255,0.45)",
                textShadow: isActive
                  ? "0 0 20px rgba(59,130,246,0.6), 0 2px 10px rgba(0,0,0,0.9)"
                  : "0 2px 8px rgba(0,0,0,0.9)",
                transform: isActive ? "scale(1.12)" : "scale(1)",
                transition: "all 0.12s ease-out",
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

// ============================================================
// COMPOSIÇÃO PRINCIPAL
// ============================================================

export const VideoEditado: React.FC = () => {
  const frame = useCurrentFrame();

  // Encontrar o corte ativo baseado no frame atual
  let activeTimeline = TIMELINE[0];
  for (const t of TIMELINE) {
    if (frame >= t.startFrame && frame < t.startFrame + t.durationFrames) {
      activeTimeline = t;
      break;
    }
  }

  // Calcular o tempo no vídeo original para as legendas
  const localFrame = frame - activeTimeline.startFrame;
  const currentSrcTime = activeTimeline.srcStart + localFrame / FPS;
  const currentTimeMs = currentSrcTime * 1000;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Renderizar cada corte como uma Sequence */}
      {TIMELINE.map((cut, i) => (
        <Sequence
          key={i}
          from={cut.startFrame}
          durationInFrames={cut.durationFrames}
          name={`Cena ${i + 1} (${cut.srcStart}s-${cut.srcEnd}s)`}
        >
          {/* Vídeo principal com zoom */}
          <ZoomVideo
            src="videos/video-original.mp4"
            startFrom={cut.srcStart}
            zoom={cut.zoom ?? 1}
            zoomTarget={cut.zoomTarget ?? "center"}
            durationFrames={cut.durationFrames}
            transition={cut.transition ?? "cut"}
          />

          {/* B-roll overlay */}
          {cut.broll && (
            <BRollOverlay
              src={cut.broll}
              startSec={cut.brollStart ?? 0}
              durationSec={cut.brollDuration ?? 3}
              parentDurationFrames={cut.durationFrames}
            />
          )}

          {/* Flash de corte */}
          {cut.transition === "zoom-in" && <CutFlash />}
        </Sequence>
      ))}

      {/* Legendas - sempre por cima */}
      <ReelsCaption
        words={captions}
        currentTimeMs={currentTimeMs}
        wordsPerGroup={4}
      />

      {/* Barra de progresso no topo */}
      <ProgressBar totalFrames={TOTAL_FRAMES} segments={TIMELINE.length} />

      {/* Vinheta escura nas bordas */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
