import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  OffthreadVideo,
  Img,
  staticFile,
  Easing,
} from "remotion";

import captionsData from "../data/captions.json";

type CaptionWord = { text: string; startMs: number; endMs: number };
const captions = captionsData as CaptionWord[];

// ============================================================
// TIMELINE DE EDIÇÃO
// ============================================================

type CutType = {
  srcStart: number;
  srcEnd: number;
  zoom?: number;
  zoomTarget?: "center" | "top" | "bottom" | "face";
  /** Imagem para split-screen */
  image?: string;
  /** Segundo onde a imagem aparece dentro do corte */
  imageStart?: number;
  /** Duração da imagem em segundos */
  imageDuration?: number;
  transition?: "cut" | "fade" | "zoom-in";
};

const CUTS: CutType[] = [
  // === INTRO ===
  // "Essa ferramenta faz o trabalho de 10 pessoas..."
  {
    srcStart: 13.5,
    srcEnd: 22,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "fade",
  },

  // "O nome é Gens Park... 1 bilhão de dólares"
  {
    srcStart: 22,
    srcEnd: 32,
    zoom: 1.35,
    zoomTarget: "face",
    transition: "zoom-in",
    image: "images/genspark.jpg",
    imageStart: 3,
    imageDuration: 4,
  },

  // "Já está competindo... vou te mostrar o poder real"
  {
    srcStart: 34,
    srcEnd: 43,
    zoom: 1.0,
    transition: "fade",
    image: "images/ai-tool.jpg",
    imageStart: 3,
    imageDuration: 4,
  },

  // === CENÁRIO 1: Negócio do zero ===
  // "Imagina que vai lançar um negócio do zero..."
  {
    srcStart: 51,
    srcEnd: 63,
    zoom: 1.1,
    zoomTarget: "face",
    transition: "zoom-in",
  },

  // "Ela faz a pesquisa, busca referências..."
  {
    srcStart: 63,
    srcEnd: 71,
    zoom: 1.25,
    zoomTarget: "face",
    image: "images/branding-mockup.jpg",
    imageStart: 1,
    imageDuration: 3.5,
  },

  // "Logo, cores, cartões... Tudo feito automaticamente"
  {
    srcStart: 71,
    srcEnd: 77,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "zoom-in",
    image: "images/design-tools.jpg",
    imageStart: 0.5,
    imageDuration: 3,
  },

  // === CENÁRIO 2: Website ===
  {
    srcStart: 92,
    srcEnd: 103,
    zoom: 1.0,
    transition: "fade",
    image: "images/website-mockup.jpg",
    imageStart: 2,
    imageDuration: 4,
  },

  // === CENÁRIO 3: Pitch deck ===
  {
    srcStart: 118,
    srcEnd: 130,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "zoom-in",
    image: "images/pitch-deck.jpg",
    imageStart: 2,
    imageDuration: 4,
  },

  // === CENÁRIO 4: Automação clientes ===
  {
    srcStart: 185,
    srcEnd: 200,
    zoom: 1.0,
    transition: "fade",
    image: "images/email-dashboard.jpg",
    imageStart: 1,
    imageDuration: 5,
  },

  // === ENCERRAMENTO ===
  // "Gens Park, ela cria imagens, vídeos, design, Excel..."
  // (pula a repetição "E não acaba aí" em 205-207, começa em 207)
  {
    srcStart: 207,
    srcEnd: 220,
    zoom: 1.2,
    zoomTarget: "face",
    transition: "fade",
    image: "images/ai-workspace.jpg",
    imageStart: 2,
    imageDuration: 5,
  },

  // "100% gratuito para você começar"
  {
    srcStart: 239,
    srcEnd: 252,
    zoom: 1.1,
    transition: "zoom-in",
  },

  // CTA final: "Quer testar? Comenta aí que eu te envio o link por DM"
  {
    srcStart: 252,
    srcEnd: 255,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "zoom-in",
  },
];

const FPS = 30;

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

/** Vídeo principal com zoom */
const ZoomVideo: React.FC<{
  src: string;
  startFrom: number;
  zoom: number;
  zoomTarget: string;
  durationFrames: number;
  transition: string;
  /** Se true, ocupa só metade superior (split-screen) */
  splitMode?: boolean;
}> = ({ src, startFrom, zoom, zoomTarget, durationFrames, transition, splitMode }) => {
  const frame = useCurrentFrame();

  const zoomProgress = spring({
    frame,
    fps: FPS,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 20,
  });
  const currentZoom = interpolate(zoomProgress, [0, 1], [1, zoom]);

  let transformOrigin = "center center";
  if (zoomTarget === "face") transformOrigin = "center 30%";
  else if (zoomTarget === "top") transformOrigin = "center 20%";
  else if (zoomTarget === "bottom") transformOrigin = "center 80%";

  let opacity = 1;
  if (transition === "fade") {
    opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  }

  let entranceScale = 1;
  if (transition === "zoom-in") {
    entranceScale = interpolate(frame, [0, 10], [1.08, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }

  const drift = interpolate(frame, [0, durationFrames], [0, 1.5], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: splitMode ? "55%" : "100%",
        overflow: "hidden",
        opacity,
        borderRadius: splitMode ? "0 0 20px 20px" : 0,
      }}
    >
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
    </div>
  );
};

/** Imagem explicativa em split-screen (metade inferior) */
const SplitImage: React.FC<{
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

  // Slide up entrance
  const enterProgress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 15,
  });

  // Fade out
  const fadeOut = interpolate(
    localFrame,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const slideY = interpolate(enterProgress, [0, 1], [80, 0]);

  // Slow zoom (Ken Burns) on image
  const imgZoom = interpolate(localFrame, [0, durationFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "48%",
        overflow: "hidden",
        borderRadius: "20px 20px 0 0",
        opacity: enterProgress * fadeOut,
        transform: `translateY(${slideY}px)`,
      }}
    >
      {/* Borda branca decorativa */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "3px solid rgba(255,255,255,0.25)",
          borderRadius: "20px 20px 0 0",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      {/* Sombra no topo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${imgZoom})`,
        }}
      />
    </div>
  );
};

/** Flash branco */
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

/** Barra de progresso */
const ProgressBar: React.FC<{
  totalFrames: number;
  segments: number;
}> = ({ totalFrames, segments }) => {
  const frame = useCurrentFrame();
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

/** Legendas - 3 palavras por grupo, mais espaçado */
const ReelsCaption: React.FC<{
  words: CaptionWord[];
  currentTimeMs: number;
}> = ({ words, currentTimeMs }) => {
  const groups: CaptionWord[][] = [];
  for (let i = 0; i < words.length; i += 3) {
    groups.push(words.slice(i, i + 3));
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
                fontSize: 52,
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

  const localFrame = frame - activeTimeline.startFrame;
  const currentSrcTime = activeTimeline.srcStart + localFrame / FPS;
  const currentTimeMs = currentSrcTime * 1000;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {TIMELINE.map((cut, i) => {
        const hasImage = !!cut.image;

        return (
          <Sequence
            key={i}
            from={cut.startFrame}
            durationInFrames={cut.durationFrames}
            name={`Cena ${i + 1}`}
          >
            {/* Vídeo principal - full ou split */}
            <ZoomVideo
              src="videos/video-original.mp4"
              startFrom={cut.srcStart}
              zoom={cut.zoom ?? 1}
              zoomTarget={cut.zoomTarget ?? "center"}
              durationFrames={cut.durationFrames}
              transition={cut.transition ?? "cut"}
              splitMode={hasImage}
            />

            {/* Imagem split-screen na metade inferior */}
            {cut.image && (
              <SplitImage
                src={cut.image}
                startSec={cut.imageStart ?? 0}
                durationSec={cut.imageDuration ?? 3}
              />
            )}

            {cut.transition === "zoom-in" && <CutFlash />}
          </Sequence>
        );
      })}

      {/* Legendas */}
      <ReelsCaption words={captions} currentTimeMs={currentTimeMs} />

      {/* Barra de progresso */}
      <ProgressBar totalFrames={TOTAL_FRAMES} segments={TIMELINE.length} />

      {/* Vinheta */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
