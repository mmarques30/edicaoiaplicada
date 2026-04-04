#!/bin/bash
# Script de edição completa - Estilo Reels com legendas + B-roll
# Inspirado no vídeo do @martimsilvaI

set -e
cd /home/user/edicaoiaplicada

VIDEO="public/videos/video-1080.mp4"
BROLL_DIR="public/videos/broll"
SRT="public/audio/video.srt"
OUTPUT="out/video-editado.mp4"

# Estilo das legendas: branco bold, contorno preto, parte inferior
SUB_STYLE="FontName=Arial,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=80,Bold=1"

mkdir -p out

echo "=== Renderizando vídeo editado ==="
echo "Estilo: Reels com legendas + B-roll intercalado"
echo ""

echo "Passo 1: Criando segmentos..."

# Segmento 1: Intro + Talking Head (0-22s)
ffmpeg -y -i "$VIDEO" -ss 0 -t 22 \
  -vf "subtitles=$SRT:force_style='$SUB_STYLE'" \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k \
  out/seg01.mp4 2>/dev/null
echo "  Seg 1/8 (0-22s talking head) done"

# Segmento 2: B-roll equipe (22-28s) com áudio original
ffmpeg -y -i "$VIDEO" -i "$BROLL_DIR/broll-01-equipe.mp4" -ss 22 -t 5 \
  -filter_complex "[1:v]setpts=PTS-STARTPTS,scale=1080:1920[broll];[broll]subtitles=$SRT:force_style='$SUB_STYLE'[vsub]" \
  -map "[vsub]" -map 0:a \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k -shortest \
  out/seg02.mp4 2>/dev/null
echo "  Seg 2/8 (22-27s B-roll equipe) done"

# Segmento 3: Talking Head (27-35s)
ffmpeg -y -i "$VIDEO" -ss 27 -t 8 \
  -vf "subtitles=$SRT:force_style='$SUB_STYLE'" \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k \
  out/seg03.mp4 2>/dev/null
echo "  Seg 3/8 (27-35s talking head) done"

# Segmento 4: B-roll interface (35-43s) com áudio original
ffmpeg -y -i "$VIDEO" -i "$BROLL_DIR/broll-02-interface.mp4" -ss 35 -t 8 \
  -filter_complex "[1:v]setpts=PTS-STARTPTS,scale=1080:1920[broll];[broll]subtitles=$SRT:force_style='$SUB_STYLE'[vsub]" \
  -map "[vsub]" -map 0:a \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k -shortest \
  out/seg04.mp4 2>/dev/null
echo "  Seg 4/8 (35-43s B-roll interface) done"

# Segmento 5: Talking Head (43-62s)
ffmpeg -y -i "$VIDEO" -ss 43 -t 19 \
  -vf "subtitles=$SRT:force_style='$SUB_STYLE'" \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k \
  out/seg05.mp4 2>/dev/null
echo "  Seg 5/8 (43-62s talking head) done"

# Segmento 6: B-roll demo (62-70s) com áudio original
ffmpeg -y -i "$VIDEO" -i "$BROLL_DIR/broll-03-demo.mp4" -ss 62 -t 8 \
  -filter_complex "[1:v]setpts=PTS-STARTPTS,scale=1080:1920[broll];[broll]subtitles=$SRT:force_style='$SUB_STYLE'[vsub]" \
  -map "[vsub]" -map 0:a \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k -shortest \
  out/seg06.mp4 2>/dev/null
echo "  Seg 6/8 (62-70s B-roll demo) done"

# Segmento 7: Talking Head (70-180s)
ffmpeg -y -i "$VIDEO" -ss 70 -t 110 \
  -vf "subtitles=$SRT:force_style='$SUB_STYLE'" \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k \
  out/seg07.mp4 2>/dev/null
echo "  Seg 7/8 (70-180s talking head) done"

# Segmento 8: Final (180-260s)
ffmpeg -y -i "$VIDEO" -ss 180 \
  -vf "subtitles=$SRT:force_style='$SUB_STYLE'" \
  -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 128k \
  out/seg08.mp4 2>/dev/null
echo "  Seg 8/8 (180-260s talking head) done"

echo ""
echo "Passo 2: Concatenando segmentos..."

cat > out/concat.txt << 'CONCAT'
file 'seg01.mp4'
file 'seg02.mp4'
file 'seg03.mp4'
file 'seg04.mp4'
file 'seg05.mp4'
file 'seg06.mp4'
file 'seg07.mp4'
file 'seg08.mp4'
CONCAT

ffmpeg -y -f concat -safe 0 -i out/concat.txt -c copy "$OUTPUT" 2>/dev/null

# Limpar segmentos temporários
rm -f out/seg0*.mp4 out/concat.txt

echo ""
echo "=== PRONTO! ==="
echo "Arquivo: $OUTPUT"
ls -lh "$OUTPUT"
