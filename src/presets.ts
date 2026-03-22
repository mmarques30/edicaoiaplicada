// Presets de resolução para diferentes formatos de vídeo

export type Preset = {
  name: string;
  width: number;
  height: number;
  fps: number;
};

export const PRESETS = {
  landscape1080: {
    name: "Landscape 1080p",
    width: 1920,
    height: 1080,
    fps: 30,
  },
  landscape720: {
    name: "Landscape 720p",
    width: 1280,
    height: 720,
    fps: 30,
  },
  portrait: {
    name: "Portrait (Reels/Stories)",
    width: 1080,
    height: 1920,
    fps: 30,
  },
  square: {
    name: "Square (Instagram)",
    width: 1080,
    height: 1080,
    fps: 30,
  },
} satisfies Record<string, Preset>;

export type PresetKey = keyof typeof PRESETS;
