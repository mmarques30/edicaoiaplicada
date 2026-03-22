import type { Caption } from "@remotion/captions";

/**
 * Filtra captions dentro de um intervalo de tempo (em milissegundos)
 */
export function filterCaptionsByTime(
  captions: Caption[],
  startMs: number,
  endMs: number,
): Caption[] {
  return captions.filter(
    (caption) => caption.startMs >= startMs && caption.startMs < endMs,
  );
}

/**
 * Agrupa captions em linhas de N palavras
 */
export function groupCaptionsIntoLines(
  captions: Caption[],
  wordsPerLine: number = 5,
): Caption[][] {
  const lines: Caption[][] = [];
  for (let i = 0; i < captions.length; i += wordsPerLine) {
    lines.push(captions.slice(i, i + wordsPerLine));
  }
  return lines;
}

/**
 * Retorna o texto concatenado de um grupo de captions
 */
export function getCaptionText(captions: Caption[]): string {
  return captions.map((c) => c.text).join(" ");
}

/**
 * Encontra a caption ativa para um dado timestamp em ms
 */
export function getActiveCaptionAtTime(
  captions: Caption[],
  timeMs: number,
): Caption | null {
  return (
    captions.find(
      (c) => timeMs >= c.startMs && timeMs < c.startMs + (c.endMs - c.startMs),
    ) ?? null
  );
}
