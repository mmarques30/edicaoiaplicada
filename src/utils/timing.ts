import { DEFAULT_FPS } from "../config";

/**
 * Converte segundos para frames
 */
export function secondsToFrames(seconds: number, fps = DEFAULT_FPS): number {
  return Math.round(seconds * fps);
}

/**
 * Converte frames para segundos
 */
export function framesToSeconds(frames: number, fps = DEFAULT_FPS): number {
  return frames / fps;
}

/**
 * Converte timestamp "mm:ss" ou "hh:mm:ss" para frames
 */
export function timestampToFrames(
  timestamp: string,
  fps = DEFAULT_FPS,
): number {
  const parts = timestamp.split(":").map(Number);
  let totalSeconds: number;

  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    totalSeconds = parts[0];
  }

  return secondsToFrames(totalSeconds, fps);
}

/**
 * Calcula a duração em frames entre dois pontos no tempo (em segundos)
 */
export function durationBetween(
  startSeconds: number,
  endSeconds: number,
  fps = DEFAULT_FPS,
): number {
  return secondsToFrames(endSeconds - startSeconds, fps);
}
