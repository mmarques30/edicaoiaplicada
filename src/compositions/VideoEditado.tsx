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
  /** Imagens para split-screen (alternam automaticamente) */
  images?: string[];
  /** Segundo onde as imagens começam dentro do corte */
  imageStart?: number;
  /** Título de cenário (ex: "Cenário 1") */
  scenarioTitle?: string;
  /** Subtítulo do cenário */
  scenarioSubtitle?: string;
  transition?: "cut" | "fade" | "zoom-in";
};

const CUTS: CutType[] = [
  // === INTRO ===
  // "Essa ferramenta faz o trabalho de 10 pessoas..."
  {
    srcStart: 13.5,
    srcEnd: 22.8,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "fade",
  },

  // "Gens Park... equipe de 30 pessoas... 1 bilhão de dólares"
  // (pula "O nome da ferramenta se chama" para evitar repetir "ferramenta")
  {
    srcStart: 24.3,
    srcEnd: 32,
    zoom: 1.35,
    zoomTarget: "face",
    transition: "fade",
    images: ["images/genspark.jpg", "images/genspark-team.jpg"],
    imageStart: 0,
  },

  // "Já está competindo... vou te mostrar o poder real"
  {
    srcStart: 34,
    srcEnd: 42.5,
    zoom: 1.0,
    transition: "fade",
    images: ["images/ai-tool.jpg", "images/genspark-dashboard.jpg"],
    imageStart: 0,
  },

  // === CENÁRIO 1: Negócio do zero ===
  // "vai lançar um negócio do zero..." (pula pausa/silêncio de 51-54.5s)
  {
    srcStart: 54.5,
    srcEnd: 62,
    zoom: 1.1,
    zoomTarget: "face",
    transition: "fade",
    scenarioTitle: "Cenário 1",
    scenarioSubtitle: "Negócio do Zero",
    images: ["images/genspark-branding.jpg", "images/genspark-design2.jpg"],
    imageStart: 0,
  },

  // "faz a pesquisa, busca referências..." (pula "Ela" do início)
  {
    srcStart: 63.2,
    srcEnd: 71,
    zoom: 1.25,
    zoomTarget: "face",
    transition: "fade",
    images: ["images/genspark-tshirt.jpg", "images/design-tools.jpg", "images/genspark-design4.jpg"],
    imageStart: 0,
  },

  // "Logo, cores, cartões... Tudo feito"
  {
    srcStart: 71,
    srcEnd: 77,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "fade",
    images: ["images/branding-mockup.jpg", "images/genspark-design2.jpg"],
    imageStart: 0,
  },

  // === CENÁRIO 2: Website ===
  {
    srcStart: 92,
    srcEnd: 103,
    zoom: 1.0,
    transition: "fade",
    scenarioTitle: "Cenário 2",
    scenarioSubtitle: "Website Profissional",
    images: ["images/genspark-site.jpg", "images/website-mockup.jpg", "images/genspark-dashboard.jpg"],
    imageStart: 0,
  },

  // === CENÁRIO 3: Pitch deck ===
  {
    srcStart: 118,
    srcEnd: 130,
    zoom: 1.15,
    zoomTarget: "face",
    transition: "fade",
    scenarioTitle: "Cenário 3",
    scenarioSubtitle: "Pitch Deck",
    images: ["images/genspark-pitch.jpg", "images/pitch-deck.jpg", "images/genspark-slides-compare.jpg"],
    imageStart: 0,
  },

  // === CENÁRIO 4: Automação clientes ===
  {
    srcStart: 185,
    srcEnd: 200,
    zoom: 1.0,
    transition: "fade",
    scenarioTitle: "Cenário 4",
    scenarioSubtitle: "Automação de Clientes",
    images: ["images/genspark-email.jpg", "images/email-dashboard.jpg", "images/ai-tool.jpg"],
    imageStart: 0,
  },

  // === ENCERRAMENTO ===
  // "Gens Park, ela cria imagens, vídeos, design, Excel... tudo ligado"
  {
    srcStart: 207,
    srcEnd: 214.2,
    zoom: 1.2,
    zoomTarget: "face",
    transition: "fade",
    images: [
      "images/genspark-design2.jpg",
      "images/genspark.jpg",
      "images/ai-workspace.jpg",
    ],
    imageStart: 0,
  },

  // "Onde você pode usar todas as coisas em um só lugar... 100% gratuito"
  {
    srcStart: 243.5,
    srcEnd: 252,
    zoom: 1.1,
    transition: "fade",
    images: ["images/genspark-dashboard.jpg", "images/genspark.jpg"],
    imageStart: 0,
  },

  // CTA final: "Quer testar? Comenta aí que eu te envio o link por DM"
  {
    srcStart: 252,
    srcEnd: 256,
    zoom: 1.4,
    zoomTarget: "face",
    transition: "fade",
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
    opacity = interpolate(frame, [0, 12], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }

  let entranceScale = 1;
  if (transition === "zoom-in") {
    entranceScale = interpolate(frame, [0, 12], [1.06, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
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

/** Imagens alternantes em split-screen (metade inferior) */
const SplitImages: React.FC<{
  images: string[];
  startSec: number;
  totalDurationFrames: number;
}> = ({ images, startSec, totalDurationFrames }) => {
  const frame = useCurrentFrame();
  const startFrame = Math.round(startSec * FPS);
  const endFrame = totalDurationFrames;

  if (frame < startFrame || frame > endFrame) return null;

  const localFrame = frame - startFrame;
  const availableFrames = endFrame - startFrame;

  // Divide available time equally among images
  const framesPerImage = Math.floor(availableFrames / images.length);
  const currentImageIndex = Math.min(
    Math.floor(localFrame / framesPerImage),
    images.length - 1,
  );
  const imageLocalFrame = localFrame - currentImageIndex * framesPerImage;

  // Slide up entrance (first image) or crossfade (subsequent)
  const isFirst = currentImageIndex === 0 && localFrame < 15;
  const enterProgress = spring({
    frame: isFirst ? localFrame : imageLocalFrame,
    fps: FPS,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 12,
  });

  // Fade out at the very end
  const fadeOut = interpolate(
    localFrame,
    [availableFrames - 10, availableFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const slideY = isFirst ? interpolate(enterProgress, [0, 1], [80, 0]) : 0;

  // Ken Burns slow zoom per image
  const imgZoom = interpolate(imageLocalFrame, [0, framesPerImage], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  // Crossfade between images
  const crossfadeIn =
    currentImageIndex > 0
      ? interpolate(imageLocalFrame, [0, 8], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

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
        opacity: (isFirst ? enterProgress : crossfadeIn) * fadeOut,
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
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <Img
        src={staticFile(images[currentImageIndex])}
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

/** Título de cenário com animação */
const ScenarioTitle: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();

  // Aparece por ~2 segundos (60 frames)
  if (frame > 60) return null;

  const enterScale = spring({
    frame,
    fps: FPS,
    config: { damping: 12, stiffness: 150 },
    durationInFrames: 15,
  });

  const fadeOut = interpolate(frame, [45, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numberScale = interpolate(enterScale, [0, 1], [0.5, 1]);
  const subtitleSlide = interpolate(
    spring({
      frame: Math.max(0, frame - 8),
      fps: FPS,
      config: { damping: 14, stiffness: 100 },
      durationInFrames: 12,
    }),
    [0, 1],
    [30, 0],
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
        opacity: fadeOut,
      }}
    >
      {/* Background overlay escuro */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          transform: `scale(${numberScale})`,
          zIndex: 21,
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#fff",
            textShadow: "0 0 40px rgba(59,130,246,0.6), 0 4px 20px rgba(0,0,0,0.8)",
            letterSpacing: "-2px",
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              fontFamily: "system-ui, -apple-system, sans-serif",
              color: "rgba(255,255,255,0.85)",
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
              transform: `translateY(${subtitleSlide}px)`,
              opacity: frame > 8 ? 1 : 0,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </AbsoluteFill>
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
        const hasImages = cut.images && cut.images.length > 0;

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
              splitMode={hasImages}
            />

            {/* Imagens alternantes em split-screen */}
            {hasImages && (
              <SplitImages
                images={cut.images!}
                startSec={cut.imageStart ?? 0}
                totalDurationFrames={cut.durationFrames}
              />
            )}

            {/* Título de cenário */}
            {cut.scenarioTitle && (
              <ScenarioTitle
                title={cut.scenarioTitle}
                subtitle={cut.scenarioSubtitle}
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
