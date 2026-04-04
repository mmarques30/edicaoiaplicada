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
// EDIÇÃO: Timeline com cortes limpos (sem repetições)
// ============================================================

type CutType = {
  srcStart: number;
  srcEnd: number;
  zoom?: number;
  zoomTarget?: "center" | "top" | "bottom" | "face";
  broll?: string;
  brollStart?: number;
  brollDuration?: number;
  transition?: "cut" | "fade" | "zoom-in";
};

// CORTES LIMPOS - apenas os melhores takes, sem repetições
const CUTS: CutType[] = [
  // === INTRO: Hook ===
  // "Essa ferramenta faz o trabalho de 10 pessoas..."
  {
    srcStart: 13.5,
    srcEnd: 22,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "fade",
  },

  // "O nome da ferramenta se chama Gens Park..." - zoom dramático
  {
    srcStart: 22,
    srcEnd: 32,
    zoom: 1.35,
    zoomTarget: "face",
    transition: "zoom-in",
    broll: "videos/broll/broll-02-interface.mp4",
    brollStart: 2,
    brollDuration: 4,
  },

  // "E ela já está competindo... vou te mostrar o poder real"
  {
    srcStart: 34,
    srcEnd: 43,
    zoom: 1.0,
    transition: "fade",
  },

  // === CENÁRIO 1: Negócio do zero ===
  // "Imagina que você vai lançar um negócio do zero..."
  {
    srcStart: 51,
    srcEnd: 63,
    zoom: 1.1,
    zoomTarget: "face",
    transition: "zoom-in",
  },

  // "Ela faz a pesquisa, vai buscar referências..."
  {
    srcStart: 63,
    srcEnd: 71,
    zoom: 1.25,
    zoomTarget: "face",
    broll: "videos/broll/broll-01-equipe.mp4",
    brollStart: 0.5,
    brollDuration: 3.5,
  },

  // "Logo, cores, cartões de visita... Tudo feito automaticamente"
  {
    srcStart: 71,
    srcEnd: 77,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "zoom-in",
    broll: "videos/broll/broll-04-app.mp4",
    brollStart: 0.5,
    brollDuration: 3,
  },

  // === CENÁRIO 2: Website ===
  // "Cenário 2. Eu peço para ela criar um website completo"
  // (pula a repetição 85-92s que é take repetido do intro)
  {
    srcStart: 92,
    srcEnd: 103,
    zoom: 1.0,
    transition: "fade",
    broll: "videos/broll/broll-03-demo.mp4",
    brollStart: 1,
    brollDuration: 4,
  },

  // === CENÁRIO 3: Pitch deck ===
  // Melhor take: "E o cenário 3... fazer a apresentação para investidores"
  // (pula takes repetidos em 108-117 e 135-152)
  {
    srcStart: 118,
    srcEnd: 130,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "zoom-in",
    broll: "videos/broll/broll-05-demos.mp4",
    brollStart: 1,
    brollDuration: 4,
  },

  // === CENÁRIO 4: Automação de clientes ===
  // Melhor take: "Imagina que estão chegando muitos clientes..."
  // (pula todos os takes repetidos de 153-184)
  {
    srcStart: 185,
    srcEnd: 200,
    zoom: 1.0,
    transition: "fade",
    broll: "videos/broll/broll-06-features.mp4",
    brollStart: 0.5,
    brollDuration: 5,
  },

  // === ENCERRAMENTO ===
  // "E não acaba aí... ela cria imagens, vídeos, design..."
  // (melhor take, pula repetições 221-238)
  {
    srcStart: 204,
    srcEnd: 220,
    zoom: 1.2,
    zoomTarget: "face",
    transition: "fade",
  },

  // "Isso sim é um workspace de IA sério... 100% gratuito"
  {
    srcStart: 239,
    srcEnd: 252,
    zoom: 1.1,
    transition: "zoom-in",
  },

  // CTA final: "Quer testar? Comenta aí"
  {
    srcStart: 252,
    srcEnd: 259,
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
    const entry = { ...cut, startFrame: currentFrame, durationFrames };
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

  // Zoom animado
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
    opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  }

  // Zoom-in entrance
  let entranceScale = 1;
  if (transition === "zoom-in") {
    entranceScale = interpolate(frame, [0, 10], [1.08, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }

  // Ken Burns drift sutil
  const drift = interpolate(frame, [0, durationFrames], [0, 1.5], {
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

/** B-roll overlay com animação de PiP (picture-in-picture) */
const BRollOverlay: React.FC<{
  src: string;
  startSec: number;
  durationSec: number;
}> = ({ src, startSec, durationSec }) => {
  const frame = useCurrentFrame();
  const startFrame = Math.round(startSec * FPS);
  const durationFrames = Math.round(durationSec * FPS);
  const endFrame = startFrame + durationFrames;

  if (frame < startFrame || frame > endFrame) return null;

  const localFrame = frame - startFrame;

  // Entrada suave
  const enterProgress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
    durationInFrames: 15,
  });

  // Saída suave
  const fadeOut = interpolate(
    localFrame,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const scale = interpolate(enterProgress, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity: enterProgress * fadeOut,
        transform: `scale(${scale})`,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "3px solid rgba(255,255,255,0.2)",
          borderRadius: 20,
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

/** Flash branco entre cortes */
const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4], [0.5, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ backgroundColor: "#fff", opacity, pointerEvents: "none" }}
    />
  );
};

/** Barra de progresso estilo Stories */
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
        top: 50,
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

/** Legendas estilo Reels - melhor espaçamento */
const ReelsCaption: React.FC<{
  words: CaptionWord[];
  currentTimeMs: number;
}> = ({ words, currentTimeMs }) => {
  const frame = useCurrentFrame();

  // Agrupa em grupos de 3 palavras (mais espaçado)
  const wordsPerGroup = 3;
  const groups: CaptionWord[][] = [];
  for (let i = 0; i < words.length; i += wordsPerGroup) {
    groups.push(words.slice(i, i + wordsPerGroup));
  }

  const activeGroup = groups.find((group) => {
    const groupStart = group[0].startMs;
    const groupEnd = group[group.length - 1].endMs;
    return currentTimeMs >= groupStart - 50 && currentTimeMs <= groupEnd + 150;
  });

  if (!activeGroup) return null;

  const groupStart = activeGroup[0].startMs;
  const entryProgress = interpolate(
    currentTimeMs,
    [groupStart - 50, groupStart + 150],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          maxWidth: "80%",
          opacity: entryProgress,
          transform: `translateY(${(1 - entryProgress) * 12}px)`,
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
                fontSize: 54,
                fontWeight: 800,
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: isActive
                  ? "#FFFFFF"
                  : isPast
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.4)",
                textShadow: isActive
                  ? "0 0 25px rgba(59,130,246,0.5), 0 2px 10px rgba(0,0,0,0.9)"
                  : "0 2px 8px rgba(0,0,0,0.9)",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                transition: "all 0.1s ease-out",
                textTransform: "lowercase",
                letterSpacing: "0.5px",
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

  // Encontrar corte ativo
  let activeTimeline = TIMELINE[0];
  for (const t of TIMELINE) {
    if (frame >= t.startFrame && frame < t.startFrame + t.durationFrames) {
      activeTimeline = t;
      break;
    }
  }

  // Tempo no vídeo original para sincronizar legendas
  const localFrame = frame - activeTimeline.startFrame;
  const currentSrcTime = activeTimeline.srcStart + localFrame / FPS;
  const currentTimeMs = currentSrcTime * 1000;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Renderizar cada corte */}
      {TIMELINE.map((cut, i) => (
        <Sequence
          key={i}
          from={cut.startFrame}
          durationInFrames={cut.durationFrames}
          name={`Cena ${i + 1}`}
        >
          <ZoomVideo
            src="videos/video-original.mp4"
            startFrom={cut.srcStart}
            zoom={cut.zoom ?? 1}
            zoomTarget={cut.zoomTarget ?? "center"}
            durationFrames={cut.durationFrames}
            transition={cut.transition ?? "cut"}
          />

          {cut.broll && (
            <BRollOverlay
              src={cut.broll}
              startSec={cut.brollStart ?? 0}
              durationSec={cut.brollDuration ?? 3}
            />
          )}

          {cut.transition === "zoom-in" && <CutFlash />}
        </Sequence>
      ))}

      {/* Legendas */}
      <ReelsCaption words={captions} currentTimeMs={currentTimeMs} />

      {/* Barra de progresso */}
      <ProgressBar totalFrames={TOTAL_FRAMES} segments={TIMELINE.length} />

      {/* Vinheta */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
