# Edição de Vídeo com IA - Remotion + Claude Code

Este projeto usa Remotion para criar e editar vídeos programaticamente. O usuário descreve o que quer em linguagem natural e você (Claude) cria/modifica o código.

## Comandos Essenciais

```bash
npm run dev                              # Abre o Remotion Studio (preview)
npx remotion render ExampleVideo         # Renderiza vídeo em out/ExampleVideo.mp4
npx remotion render ExampleVideo out/meu-video.mp4  # Renderiza com nome custom
npx remotion render ExampleVideoPortrait  # Renderiza formato vertical (Reels)
npx remotion render ExampleVideoSquare    # Renderiza formato quadrado (Instagram)
```

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── VideoClip.tsx    # Importar e cortar vídeos
│   ├── ImageOverlay.tsx # Adicionar imagens/logos sobre vídeo
│   ├── Caption.tsx      # Legendas animadas (word-level)
│   ├── AudioTrack.tsx   # Música/áudio com fade in/out
│   ├── TitleSlide.tsx   # Slides de título animados
│   └── TransitionWrapper.tsx  # Transições entre cenas
├── compositions/        # Composições de vídeo (cada uma é um projeto)
├── utils/
│   ├── timing.ts        # secondsToFrames(), framesToSeconds()
│   ├── transcribe.ts    # Transcrição com Whisper (legendas automáticas)
│   └── captions.ts      # Processamento de legendas
├── config.ts            # Cores e estilos globais
├── presets.ts           # Presets de resolução
├── Root.tsx             # Registry de composições
└── index.ts             # Entry point
public/
├── videos/              # Vídeos do usuário para editar
├── images/              # Imagens para overlays
├── audio/               # Arquivos de áudio/música
└── fonts/               # Fontes customizadas
```

## Como Criar uma Nova Composição

1. Crie um arquivo em `src/compositions/NomeDaComposicao.tsx`
2. Registre em `src/Root.tsx` com `<Composition>`
3. Use os componentes disponíveis

### Template de Composição

```tsx
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { VideoClip } from "../components/VideoClip";
import { ImageOverlay } from "../components/ImageOverlay";
import { Caption } from "../components/Caption";
import { AudioTrack } from "../components/AudioTrack";

export const MinhaComposicao: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Cena 1: Vídeo principal cortado (0s a 10s) */}
      <Sequence from={0} durationInFrames={300}>
        <VideoClip
          src="videos/meu-video.mp4"
          trimBefore={300}   // Começa no segundo 10 do vídeo original
          trimAfter={900}    // Termina no segundo 30
        />
        <ImageOverlay
          src="images/logo.png"
          x={50} y={50}
          width={150}
          animation="fadeIn"
        />
      </Sequence>

      {/* Música de fundo */}
      <AudioTrack
        src="audio/musica.mp3"
        volume={0.3}
        fadeInFrames={30}
        fadeOutFrames={30}
        durationInFrames={300}
      />
    </AbsoluteFill>
  );
};
```

### Registrar em Root.tsx

```tsx
import { MinhaComposicao } from "./compositions/MinhaComposicao";

<Composition
  id="MinhaComposicao"
  component={MinhaComposicao}
  durationInFrames={300}  // 10 segundos a 30fps
  fps={30}
  width={1920}
  height={1080}
/>
```

## Componentes Disponíveis

### VideoClip - Cortar e importar vídeos
```tsx
<VideoClip
  src="videos/video.mp4"     // Caminho relativo a public/
  trimBefore={300}            // Frame de início no vídeo original
  trimAfter={900}             // Frame de fim no vídeo original
  playbackRate={1}            // Velocidade (0.5 = lento, 2 = rápido)
  volume={0.8}                // Volume do áudio do vídeo
  muted={false}               // Mutar áudio
/>
```

### ImageOverlay - Adicionar imagens
```tsx
<ImageOverlay
  src="images/logo.png"      // Caminho relativo a public/
  x={50} y={50}              // Posição (px ou %)
  width={200}                // Largura
  opacity={0.9}              // Opacidade
  animation="fadeIn"         // "none" | "fadeIn" | "slideUp" | "slideLeft" | "scale" | "bounce"
  animationDuration={20}     // Duração da animação em frames
/>
```

### Caption - Legendas animadas
```tsx
// Com word-level timing (gerado pelo Whisper)
<Caption
  words={[
    { text: "Olá", startMs: 0, endMs: 500 },
    { text: "mundo", startMs: 500, endMs: 1000 },
  ]}
  wordsPerLine={5}
  fontSize={48}
  activeColor="#3b82f6"      // Cor da palavra atual
/>

// Legenda estática simples
<StaticCaption
  text="Texto da legenda"
  animation="fadeIn"          // "none" | "fadeIn" | "typewriter"
  fontSize={36}
/>
```

### AudioTrack - Música e áudio
```tsx
<AudioTrack
  src="audio/musica.mp3"     // Caminho relativo a public/
  volume={0.5}               // Volume (0 a 1)
  fadeInFrames={30}           // Fade in (1 segundo a 30fps)
  fadeOutFrames={30}          // Fade out
  durationInFrames={300}     // Duração total (necessário para fade out)
  loop={false}               // Repetir em loop
/>
```

### TitleSlide - Slides de título
```tsx
<TitleSlide
  title="Meu Título"
  subtitle="Subtítulo opcional"
  backgroundColor="#000"
  titleColor="#fff"
  titleFontSize={72}
  animation="fadeUp"          // "none" | "fadeUp" | "scale" | "typewriter"
/>
```

### TransitionWrapper - Transições
```tsx
<Sequence from={0} durationInFrames={150}>
  <TransitionWrapper
    enterTransition="fade"    // "fade" | "slideLeft" | "slideRight" | "slideUp" | "wipe"
    exitTransition="fade"
    enterDuration={15}
    exitDuration={15}
    durationInFrames={150}
  >
    <VideoClip src="videos/clip.mp4" />
  </TransitionWrapper>
</Sequence>
```

## Utilitários de Timing

```tsx
import { secondsToFrames, framesToSeconds, timestampToFrames, durationBetween } from "../utils/timing";

secondsToFrames(10)          // 300 (a 30fps)
framesToSeconds(300)         // 10
timestampToFrames("1:30")   // 2700
durationBetween(10, 30)     // 600 frames (20 segundos)
```

## Transcrição com Whisper (Legendas Automáticas)

```typescript
import { setupWhisper, transcribeAudio, transcribeAndSave } from "../utils/transcribe";

// Primeira vez: instalar Whisper (demora)
await setupWhisper("medium");

// Transcrever áudio
const captions = await transcribeAudio("caminho/para/audio.wav");

// Transcrever e salvar JSON
await transcribeAndSave("audio.wav", "captions.json");
```

O áudio deve estar em formato WAV 16kHz. Para converter:
```bash
ffmpeg -i video.mp4 -ar 16000 -ac 1 audio.wav
```

## Presets de Resolução

| Preset | Dimensões | FPS | Uso |
|--------|-----------|-----|-----|
| landscape1080 | 1920x1080 | 30 | YouTube |
| landscape720 | 1280x720 | 30 | YouTube (menor) |
| portrait | 1080x1920 | 30 | Reels, Stories, TikTok |
| square | 1080x1080 | 30 | Instagram |

## Regras Importantes

1. **Timing**: Tudo em Remotion é baseado em frames. Use `secondsToFrames()` para converter.
2. **Arquivos**: Todos os arquivos de mídia vão em `public/`. Referenciar com caminho relativo.
3. **Composições**: Sempre registrar novas composições em `Root.tsx`.
4. **Sequence**: Use `<Sequence from={frame} durationInFrames={frames}>` para posicionar elementos no tempo.
5. **Sobreposição**: Componentes dentro do mesmo `<Sequence>` se sobrepõem (como camadas).
6. **FPS padrão**: 30fps. Use `secondsToFrames(segundos, 30)` para conversões.

## Workflow Típico

```
1. Usuário coloca vídeo em public/videos/
2. Pede: "corte o vídeo X dos segundos 10 aos 30 e adicione uma legenda"
3. Claude cria composição em src/compositions/
4. Registra em Root.tsx
5. Usuário faz preview: npm run dev
6. Renderiza: npx remotion render NomeDaComposicao
```
