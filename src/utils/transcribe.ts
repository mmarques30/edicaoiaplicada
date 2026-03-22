import path from "path";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe as whisperTranscribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import type { Caption } from "@remotion/captions";

type WhisperModel =
  | "tiny" | "tiny.en" | "base" | "base.en"
  | "small" | "small.en" | "medium" | "medium.en"
  | "large-v1" | "large-v2" | "large-v3" | "large-v3-turbo";

const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");
const WHISPER_VERSION = "1.5.5";
const DEFAULT_MODEL: WhisperModel = "medium";

/**
 * Instala o Whisper.cpp e baixa o modelo (executa apenas uma vez)
 */
export async function setupWhisper(
  model: WhisperModel = DEFAULT_MODEL,
): Promise<void> {
  console.log("Instalando Whisper.cpp...");
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });

  console.log(`Baixando modelo ${model}...`);
  await downloadWhisperModel({ model, folder: WHISPER_DIR });

  console.log("Whisper.cpp pronto!");
}

/**
 * Transcreve um arquivo de áudio e retorna captions com timestamps
 */
export async function transcribeAudio(
  inputPath: string,
  model: WhisperModel = DEFAULT_MODEL,
): Promise<Caption[]> {
  const whisperCppOutput = await whisperTranscribe({
    model,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    inputPath,
    tokenLevelTimestamps: true,
  });

  const { captions } = toCaptions({ whisperCppOutput });
  return captions;
}

/**
 * Transcreve e salva o resultado como JSON
 */
export async function transcribeAndSave(
  inputPath: string,
  outputPath: string,
  model: WhisperModel = DEFAULT_MODEL,
): Promise<Caption[]> {
  const captions = await transcribeAudio(inputPath, model);

  const fs = await import("fs");
  fs.writeFileSync(outputPath, JSON.stringify(captions, null, 2));
  console.log(`Captions salvas em: ${outputPath}`);

  return captions;
}
