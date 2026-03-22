import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { TitleSlide } from "../components/TitleSlide";
import { StaticCaption } from "../components/Caption";

/**
 * Composição de exemplo demonstrando os componentes disponíveis.
 *
 * Para usar com seus próprios vídeos, coloque-os na pasta public/videos/
 * e substitua os componentes de exemplo pelos seus clips.
 *
 * Exemplo com vídeo real:
 *
 *   import { VideoClip } from "../components/VideoClip";
 *   import { ImageOverlay } from "../components/ImageOverlay";
 *   import { Caption } from "../components/Caption";
 *   import { AudioTrack } from "../components/AudioTrack";
 *
 *   <Sequence from={0} durationInFrames={300}>
 *     <VideoClip src="videos/meu-video.mp4" trimBefore={300} trimAfter={600} />
 *     <ImageOverlay src="images/logo.png" x={50} y={50} width={150} animation="fadeIn" />
 *     <Caption words={captionData} />
 *     <AudioTrack src="audio/musica.mp3" volume={0.3} fadeInFrames={30} fadeOutFrames={30} />
 *   </Sequence>
 */
export const ExampleVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Cena 1: Título de abertura (0s - 3s) */}
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="Edição com IA"
          subtitle="Remotion + Claude Code"
          animation="fadeUp"
          backgroundColor="#1a1a2e"
          titleColor="#ffffff"
          subtitleColor="#3b82f6"
        />
      </Sequence>

      {/* Cena 2: Conteúdo com legenda (3s - 7s) */}
      <Sequence from={90} durationInFrames={120}>
        <AbsoluteFill
          style={{
            backgroundColor: "#16213e",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              color: "#ffffff",
              textAlign: "center",
              maxWidth: "80%",
              lineHeight: 1.5,
            }}
          >
            Coloque seus vídeos na pasta{"\n"}
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>
              public/videos/
            </span>
          </div>
          <StaticCaption
            text="Use o Claude Code para editar seus vídeos"
            animation="fadeIn"
            fontSize={36}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Cena 3: Instruções (7s - 11s) */}
      <Sequence from={210} durationInFrames={120}>
        <AbsoluteFill
          style={{
            backgroundColor: "#0f3460",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 30,
          }}
        >
          <div style={{ fontSize: 36, color: "#ffffff", textAlign: "center" }}>
            Comandos disponíveis:
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#e2e8f0",
              textAlign: "left",
              lineHeight: 2,
            }}
          >
            <div>npm run dev → Preview no Studio</div>
            <div>npx remotion render → Renderizar MP4</div>
          </div>
          <StaticCaption
            text="Tudo controlado por IA!"
            animation="typewriter"
            fontSize={32}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Cena 4: Encerramento (11s - 14s) */}
      <Sequence from={330} durationInFrames={90}>
        <TitleSlide
          title="Comece agora!"
          subtitle="Descreva o que quer editar"
          animation="scale"
          backgroundColor="#1a1a2e"
          titleColor="#3b82f6"
          subtitleColor="#ffffff"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
