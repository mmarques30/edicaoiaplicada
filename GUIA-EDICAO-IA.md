# Guia de Edição de Vídeo com IA
## Remotion + Claude Code - Manual Completo

---

## 1. Como o Sistema Funciona (Visão Geral)

```
VIDEO BRUTO (mp4)
     │
     ▼
TRANSCRIÇÃO (Whisper) ──► captions.json (palavras + timestamps)
     │
     ▼
COMPOSIÇÃO (VideoEditado.tsx)
     │
     ├── CUTS[] ──► Define quais trechos do vídeo usar
     ├── Imagens ──► Split-screen com screenshots/mockups
     ├── Legendas ──► Sincronizadas com a fala
     ├── Transições ──► fade, zoom-in, cut
     └── Zoom ──► Ken Burns dinâmico
     │
     ▼
RENDER (Remotion) ──► video-final.mp4
```

### O Conceito Central: CUTS (Cortes)

O coração da edição é o array `CUTS`. Cada cut define:

```
┌────────────���────────────────────────────────────┐
│ CUT = {                                         │
│   srcStart: 13.5,    ← Segundo inicial no bruto │
│   srcEnd: 22.8,      ← Segundo final no bruto   │
│   zoom: 1.15,        ← Nível de zoom (1 = sem)  │
│   zoomTarget: "face", ← Para onde o zoom aponta │
│   transition: "fade", ← Como entra esse trecho  │
│   images: ["img1.jpg", "img2.jpg"],  ← B-roll   │
│   scenarioTitle: "Cenário 1",  ← Título overlay │
│ }                                                │
└─────────────────────────────────────────────────┘
```

Os cuts são colocados **em sequência** na timeline. O sistema calcula automaticamente a duração de cada um e posiciona no tempo.

### Fluxo Visual de um Cut com Imagens

```
┌──────────────────────────┐
│   VÍDEO (topo 55%)       │  ← Zoom + transição
│   [pessoa falando]       │
├──────────────────────────┤
│   IMAGENS (base 48%)     │  ← Alternam automaticamente
│   [screenshot/mockup]    │     com crossfade + Ken Burns
└──────────────────────────┘
│  LEGENDA  │               ← Palavras destacadas em azul
│  BARRA DE PROGRESSO  │    ← 12 segmentos no topo
```

---

## 2. Anatomia de uma Edição

### 2.1 Preparação

| Etapa | O que fazer | Onde colocar |
|-------|------------|--------------|
| Vídeo bruto | Copiar o mp4 | `public/videos/video-original.mp4` |
| Imagens B-roll | Screenshots, mockups, logos | `public/images/` |
| Áudio extra | Música, efeitos | `public/audio/` |

### 2.2 Transcrição

O Whisper gera um JSON com cada palavra e seu timestamp:
```json
[
  { "text": "Essa", "startMs": 13620, "endMs": 14180 },
  { "text": "ferramenta", "startMs": 14180, "endMs": 14740 }
]
```

Isso permite:
- Legendas sincronizadas com destaque por palavra
- Identificar onde cortar (encontrar início/fim de frases)
- Remover repetições e silêncios

### 2.3 Definição dos Cortes

Cada trecho que você quer manter do vídeo original vira um `CUT`:

```
Vídeo original (4:20):
|████░░░████░░████░░░░░████░░████░░░░████░░░░░░████░░░████|
 cut1    cut2   cut3     cut4   cut5    cut6      cut7  cut8

░ = removido (repetição, silêncio, "hum", erro)
█ = mantido no vídeo final
```

### 2.4 Componentes Disponíveis

| Componente | Para quê | Parâmetros principais |
|-----------|---------|----------------------|
| **VideoClip** | Exibir trecho do vídeo | `src`, `trimBefore`, `trimAfter`, `playbackRate` |
| **ImageOverlay** | Imagem sobre o vídeo | `src`, `x`, `y`, `width`, `animation` |
| **Caption** | Legendas com destaque | `words`, `activeColor`, `fontSize` |
| **AudioTrack** | Música/áudio de fundo | `src`, `volume`, `fadeInFrames`, `fadeOutFrames` |
| **TitleSlide** | Tela de título | `title`, `subtitle`, `animation` |
| **TransitionWrapper** | Transição genérica | `enterTransition`, `exitTransition` |

### 2.5 Transições Disponíveis

| Transição | Efeito | Quando usar |
|-----------|--------|------------|
| `fade` | Dissolve suave | Entre a maioria dos cortes |
| `zoom-in` | Zoom + flash branco | Momentos de impacto |
| `cut` | Corte seco | Ritmo rápido, urgência |
| `slideLeft` | Desliza da direita | Mudança de tópico |
| `slideUp` | Desliza de baixo | Revelação |
| `wipe` | Cortina lateral | Antes/depois |

### 2.6 Animações de Imagem

| Animação | Efeito |
|----------|--------|
| `fadeIn` | Aparece gradualmente |
| `slideUp` | Sobe de baixo |
| `slideLeft` | Entra pela direita |
| `scale` | Cresce do centro |
| `bounce` | Pula ao aparecer |

### 2.7 Presets de Formato

| Formato | Resolução | Uso |
|---------|-----------|-----|
| `portrait` | 1080x1920 | **Reels, Stories, TikTok** |
| `landscape1080` | 1920x1080 | YouTube |
| `landscape720` | 1280x720 | YouTube (leve) |
| `square` | 1080x1080 | Feed Instagram |

---

## 3. Prompt Master - Como Dar Comandos ao Claude

### 3.1 Estrutura do Prompt Ideal

```
FORMATO:
[Formato do vídeo] + [Objetivo] + [Estilo] + [Detalhes específicos]

EXEMPLO:
"Edite o vídeo public/videos/review-app.mp4 em formato Reels (vertical).
É um review de produto. Estilo dinâmico com cortes rápidos.
- Remova todas as pausas e 'hums'
- Adicione screenshots do app quando eu falar das funcionalidades
- Legendas com destaque em azul
- Transições suaves entre cortes"
```

### 3.2 Níveis de Comando

#### Nível 1: Comando Rápido (mínimo)
```
"Edite o vídeo video-original.mp4 em formato Reels.
Corte as partes ruins e adicione legendas."
```
→ Claude vai analisar o áudio, encontrar pausas/repetições, criar cortes automáticos.

#### Nível 2: Comando Direcionado
```
"Edite o vídeo em formato Reels:
- Use os trechos: 0:10-0:30, 0:45-1:20, 2:00-2:45
- Adicione as imagens da pasta public/images/ quando eu falar do produto
- Legendas com destaque em amarelo
- Transição fade entre todos os cortes
- Zoom no rosto quando eu estiver falando direto pra câmera"
```

#### Nível 3: Comando Técnico Completo
```
"Crie uma composição VideoReview em formato portrait (1080x1920):

Cortes:
1. 0:10-0:22 - Intro, zoom 1.15 no rosto, transição fade
2. 0:25-0:40 - Feature 1, split-screen com [screenshot1.jpg, screenshot2.jpg]
3. 0:45-1:10 - Feature 2, split-screen com [screenshot3.jpg], cenário 'Feature 2'
4. 1:15-1:30 - CTA final, zoom 1.2 no rosto, sem imagens

Legendas: palavras em destaque #f59e0b (amarelo), 3 palavras por grupo
Transições: fade em todos, zoom-in no corte 3
Barra de progresso: sim"
```

### 3.3 Vocabulário de Comando

Use estas palavras-chave nos seus prompts:

| O que você quer | Como pedir |
|----------------|-----------|
| Remover trecho | "corte de X a Y", "remova a parte onde..." |
| Manter trecho | "use o trecho de X a Y", "mantenha quando..." |
| Adicionar imagem | "mostre [imagem] quando eu falar de..." |
| Split-screen | "divida a tela com o vídeo em cima e imagem embaixo" |
| Zoom | "zoom no rosto", "zoom 1.2 no centro" |
| Transição | "transição suave/fade/zoom entre cortes" |
| Legenda | "legendas com destaque em [cor]" |
| Título | "mostre o título 'X' antes de cada cenário" |
| Velocidade | "acelere o trecho de X a Y" |
| Música | "adicione música de fundo com volume baixo" |
| Formato | "formato Reels/vertical/quadrado/landscape" |

### 3.4 Referências de Estilo

Ao descrever o estilo, use referências claras:

```
"Estilo Reels educativo":
→ Cortes a cada 5-8 segundos, legendas grandes, zoom dinâmico

"Estilo YouTube review":
→ Cortes mais longos (10-20s), split-screen com produto, transições suaves

"Estilo TikTok rápido":
→ Cortes de 2-4 segundos, transições zoom-in, flash branco, ritmo acelerado

"Estilo podcast/talking head":
→ Cortes longos, zoom alternando entre close e médio, legendas discretas
```

---

## 4. Skills - Templates Prontos para Copiar e Adaptar

### Skill 1: Reels de Review de Produto/App

```
PROMPT:
"Edite [video.mp4] como Reels (vertical) de review de produto.

VÍDEO: public/videos/[nome].mp4
IMAGENS: public/images/ (screenshots do produto)
FORMATO: portrait (1080x1920)

INSTRUÇÕES:
1. Analise o áudio e identifique os tópicos principais
2. Corte repetições, "hums", pausas longas (>1.5s) e erros
3. Crie cortes de 5-10 segundos por tópico
4. Quando eu falar de funcionalidades, mostre screenshots em split-screen
5. Alterne 2-3 imagens por corte para manter dinâmico
6. Zoom 1.12-1.18 no rosto nos momentos de fala direta
7. Transição fade entre todos os cortes
8. Legendas: 3 palavras por grupo, destaque azul (#3b82f6)
9. Barra de progresso no topo

CORTES (se já souber os tempos):
- Intro: [inicio]-[fim]
- Feature 1: [inicio]-[fim], imagens: [img1, img2]
- Feature 2: [inicio]-[fim], imagens: [img3, img4]
- CTA: [inicio]-[fim]"
```

### Skill 2: Corte Simples (Limpar Vídeo)

```
PROMPT:
"Limpe o vídeo [video.mp4]:

1. Transcreva o áudio
2. Identifique e remova:
   - Pausas > 1.5 segundos
   - Palavras repetidas consecutivas
   - 'Hum', 'é...', 'tipo', 'então' no início de frases
   - Trechos onde erro e recomeço a frase
3. Mantenha o formato original (landscape/portrait)
4. Transições fade suaves entre cortes
5. NÃO adicione imagens, títulos ou legendas
6. Mantenha o áudio original intacto nos trechos mantidos"
```

### Skill 3: Vídeo Educativo com Cenários

```
PROMPT:
"Edite [video.mp4] como vídeo educativo com cenários:

FORMATO: portrait (Reels)

ESTRUTURA:
- Intro (primeiros X segundos)
- Cenário 1: [título] - trecho de [X] a [Y], imagens: [lista]
- Cenário 2: [título] - trecho de [X] a [Y], imagens: [lista]
- Cenário 3: [título] - trecho de [X] a [Y], imagens: [lista]
- Encerramento + CTA

ESTILO:
- Mostre título 'Cenário N: [nome]' antes de cada seção (2 segundos)
- Split-screen: vídeo em cima, imagens embaixo
- 2-3 imagens por cenário, alternando com crossfade
- Zoom no rosto na intro e CTA
- Legendas com destaque
- Transições fade"
```

### Skill 4: Usando Vídeo de Referência

```
PROMPT:
"Edite [meu-video.mp4] usando [video-referencia.mp4] como referência de estilo.

1. Analise o vídeo de referência e identifique:
   - Ritmo dos cortes (duração média)
   - Tipo de transições usadas
   - Posicionamento de texto/legendas
   - Uso de zoom e movimento
   - Estilo visual geral

2. Aplique o mesmo estilo ao meu vídeo:
   - VÍDEO: public/videos/[nome].mp4
   - IMAGENS: public/images/
   - FORMATO: [portrait/landscape/square]

3. Mantenha meu conteúdo, mas adapte:
   - Ritmo de cortes similar
   - Transições no mesmo estilo
   - Posicionamento de elementos similar"
```

### Skill 5: Adicionar B-Roll e Imagens a Vídeo Existente

```
PROMPT:
"Ao vídeo já editado, adicione imagens de apoio:

COMPOSIÇÃO EXISTENTE: [NomeDaComposicao]

ADIÇÕES:
- No corte [N] (trecho sobre [assunto]): mostrar [img1.jpg, img2.jpg]
- No corte [N] (trecho sobre [assunto]): mostrar [img3.jpg]
- Quando eu mencionar [palavra/frase]: mostrar [img4.jpg]

FORMATO: Split-screen (vídeo em cima, imagens embaixo)
ALTERNÂNCIA: 2-3 imagens por trecho, com crossfade entre elas"
```

### Skill 6: Ajuste Fino (Pós-Primeira Edição)

```
PROMPT:
"Ajuste a edição do [NomeDaComposicao]:

PROBLEMAS:
- [ ] Corte N está cortando o final da frase 'X' - estenda até completar
- [ ] Repetição da palavra 'X' entre cortes N e N+1 - remova
- [ ] Silêncio de Xs entre cortes N e N+1 - reduza
- [ ] Imagem X não combina com o assunto - troque por [outra]
- [ ] Transição no corte N está abrupta - use fade
- [ ] Falta mostrar [imagem] quando falo de [assunto]
- [ ] O CTA foi cortado - inclua até o segundo X"
```

---

## 5. Workflow Completo: Do Zero ao Vídeo Final

### Passo 1: Preparar os Arquivos

```bash
# Colocar vídeo bruto
cp meu-video.mp4 public/videos/video-original.mp4

# Colocar imagens de apoio
cp screenshots/*.jpg public/images/
```

### Passo 2: Primeiro Comando

```
"Edite public/videos/video-original.mp4 em formato Reels.
[descreva o que quer - use uma das Skills acima como base]"
```

### Passo 3: Preview

```bash
npm run dev    # Abre o Remotion Studio no navegador
```

Navegue até a composição no Studio e assista frame a frame.

### Passo 4: Ajustes

```
"No VideoEditado:
- O corte 3 está cortando 'automaticamente', estenda 1 segundo
- Adicione imagem X no corte 5
- A transição do corte 2 está brusca, mude para fade"
```

### Passo 5: Render Final

```bash
npx remotion render VideoEditado out/meu-video-final.mp4
```

### Passo 6: Comprimir (se necessário)

```bash
# Comprimir para upload (reduz ~75% do tamanho)
ffmpeg -i out/meu-video-final.mp4 -crf 28 -preset fast out/video-compressed.mp4
```

---

## 6. Dicas Avançadas

### 6.1 Como Encontrar os Tempos Certos para Cortar

Peça ao Claude:
```
"Analise o áudio de video-original.mp4:
1. Transcreva tudo
2. Liste cada frase com timestamp
3. Marque pausas > 1.5s
4. Marque palavras repetidas
5. Sugira os cortes ideais"
```

O Claude usará `ffmpeg silencedetect` para encontrar silêncios e o Whisper para transcrever.

### 6.2 Como Usar Vídeo de Referência

```
1. Coloque o vídeo de referência em public/videos/video-referencia.mp4
2. Peça: "Analise o estilo de edição de video-referencia.mp4"
3. Claude vai identificar: ritmo, transições, zoom, texto
4. Peça: "Aplique esse estilo ao meu video-original.mp4"
```

### 6.3 Múltiplas Versões

```
"Crie 3 versões do vídeo:
1. VideoReels - formato vertical para Reels (cortes rápidos)
2. VideoYouTube - formato landscape para YouTube (mais completo)
3. VideoStories - versão curta (30s) para Stories"
```

Cada versão fica como composição separada no Root.tsx.

### 6.4 Legendas Customizadas

```
"Legendas estilo:
- Cor do destaque: amarelo (#f59e0b)
- Tamanho: 56px
- 4 palavras por grupo
- Posição: mais acima (bottom: 200px)
- Fonte: bold, com sombra"
```

### 6.5 Música de Fundo

```
"Adicione public/audio/musica.mp3 como background:
- Volume: 20% (0.2)
- Fade in: 1 segundo
- Fade out: 2 segundos
- Abaixar para 10% quando eu estiver falando"
```

---

## 7. Checklist Rápido

Antes de pedir a edição, tenha:

- [ ] Vídeo bruto em `public/videos/`
- [ ] Imagens/screenshots em `public/images/`
- [ ] Formato definido (Reels? YouTube? Stories?)
- [ ] Estilo definido (rápido? educativo? review?)
- [ ] Saber aproximadamente quais trechos manter
- [ ] Ter as imagens nomeadas de forma descritiva

---

## 8. Comandos do Terminal

```bash
# Preview no navegador
npm run dev

# Renderizar vídeo
npx remotion render [NomeDaComposicao] out/[nome].mp4

# Renderizar formato específico
npx remotion render VideoReels out/reels.mp4
npx remotion render VideoYouTube out/youtube.mp4

# Comprimir para upload
ffmpeg -i out/video.mp4 -crf 28 -preset fast out/video-leve.mp4

# Extrair áudio para transcrição
ffmpeg -i video.mp4 -ar 16000 -ac 1 audio.wav

# Servidor web para download
npm run web
```

---

## 9. Referência Rápida de Parâmetros

### Zoom
| Valor | Efeito |
|-------|--------|
| 1.0 | Sem zoom |
| 1.05-1.10 | Zoom sutil |
| 1.10-1.20 | Zoom médio (ideal para face) |
| 1.20-1.40 | Zoom forte (close-up) |

### zoomTarget
| Valor | Foco |
|-------|------|
| `"face"` | Terço superior (30%) |
| `"top"` | Topo (20%) |
| `"center"` | Centro (50%) |
| `"bottom"` | Base (80%) |

### Transições
| Valor | Duração padrão | Quando usar |
|-------|----------------|------------|
| `"fade"` | 12 frames (0.4s) | Maioria dos cortes |
| `"zoom-in"` | 8 frames + flash | Momentos de impacto |
| `"cut"` | 0 frames | Ritmo rápido |

### Volume
| Valor | Uso |
|-------|-----|
| 0.1-0.2 | Música de fundo com fala |
| 0.3-0.5 | Música de fundo sem fala |
| 0.7-1.0 | Áudio principal |

### FPS e Frames
| Tempo | Frames (30fps) |
|-------|----------------|
| 0.5s | 15 |
| 1s | 30 |
| 2s | 60 |
| 5s | 150 |
| 10s | 300 |
| 30s | 900 |
| 1min | 1800 |

---

*Criado para uso com Claude Code + Remotion. Atualize conforme novas funcionalidades forem adicionadas.*
