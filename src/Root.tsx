import React from "react";
import { Composition } from "remotion";
import { ExampleVideo } from "./compositions/ExampleVideo";
import { VideoEditado } from "./compositions/VideoEditado";
import { PRESETS } from "./presets";
import { secondsToFrames } from "./utils/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Composição de exemplo - landscape 1080p */}
      <Composition
        id="ExampleVideo"
        component={ExampleVideo}
        durationInFrames={420}
        fps={PRESETS.landscape1080.fps}
        width={PRESETS.landscape1080.width}
        height={PRESETS.landscape1080.height}
      />

      {/* Composição de exemplo - portrait (Reels/Stories) */}
      <Composition
        id="ExampleVideoPortrait"
        component={ExampleVideo}
        durationInFrames={420}
        fps={PRESETS.portrait.fps}
        width={PRESETS.portrait.width}
        height={PRESETS.portrait.height}
      />

      {/* Composição de exemplo - square (Instagram) */}
      <Composition
        id="ExampleVideoSquare"
        component={ExampleVideo}
        durationInFrames={420}
        fps={PRESETS.square.fps}
        width={PRESETS.square.width}
        height={PRESETS.square.height}
      />

      {/* Vídeo editado estilo Reels - cortes dinâmicos + zoom + b-roll */}
      <Composition
        id="VideoEditado"
        component={VideoEditado}
        durationInFrames={3825}
        fps={PRESETS.portrait.fps}
        width={PRESETS.portrait.width}
        height={PRESETS.portrait.height}
      />

      {/*
        Para adicionar novas composições:

        import { MinhaComposicao } from "./compositions/MinhaComposicao";

        <Composition
          id="MinhaComposicao"
          component={MinhaComposicao}
          durationInFrames={secondsToFrames(60)}
          fps={30}
          width={1920}
          height={1080}
        />
      */}
    </>
  );
};
