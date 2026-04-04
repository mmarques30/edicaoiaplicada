import express from "express";
import cors from "cors";
import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "out");
const FRONTEND_DIR = path.join(PROJECT_ROOT, "frontend");

const app = express();
app.use(cors());
app.use(express.json());

// Servir o frontend
app.use(express.static(FRONTEND_DIR));

// Servir vídeos renderizados
app.use("/videos", express.static(OUT_DIR));

// Status do render atual
let renderStatus: {
  status: "idle" | "rendering" | "done" | "error";
  progress: number;
  message: string;
  outputFile?: string;
  compositionId?: string;
} = {
  status: "idle",
  progress: 0,
  message: "Pronto para renderizar",
};

// Listar composições disponíveis
app.get("/api/compositions", (_req, res) => {
  try {
    const rootFile = path.join(PROJECT_ROOT, "src", "Root.tsx");
    const content = fs.readFileSync(rootFile, "utf-8");
    const matches = [...content.matchAll(/id="([^"]+)"/g)];
    const compositions = matches.map((m) => m[1]);
    res.json({ compositions });
  } catch {
    res.json({ compositions: ["VideoEditado", "ExampleVideo"] });
  }
});

// Listar vídeos renderizados
app.get("/api/rendered", (_req, res) => {
  try {
    if (!fs.existsSync(OUT_DIR)) {
      return res.json({ files: [] });
    }
    const files = fs.readdirSync(OUT_DIR)
      .filter((f) => f.endsWith(".mp4"))
      .map((f) => {
        const stats = fs.statSync(path.join(OUT_DIR, f));
        return {
          name: f,
          size: (stats.size / 1024 / 1024).toFixed(1) + " MB",
          date: stats.mtime.toISOString(),
          url: `/videos/${f}`,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

// Status do render
app.get("/api/status", (_req, res) => {
  res.json(renderStatus);
});

// Iniciar renderização
app.post("/api/render", (req, res) => {
  const { compositionId = "VideoEditado", outputName } = req.body;

  if (renderStatus.status === "rendering") {
    return res.status(409).json({ error: "Já existe um render em andamento" });
  }

  const fileName = outputName || `${compositionId}-${Date.now()}.mp4`;
  const outputPath = path.join(OUT_DIR, fileName);

  // Criar pasta out/ se não existir
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  renderStatus = {
    status: "rendering",
    progress: 0,
    message: `Renderizando ${compositionId}...`,
    compositionId,
  };

  const render = spawn("npx", [
    "remotion",
    "render",
    compositionId,
    outputPath,
  ], {
    cwd: PROJECT_ROOT,
    shell: true,
  });

  let lastOutput = "";

  render.stderr.on("data", (data: Buffer) => {
    const output = data.toString();
    lastOutput = output;

    // Tentar extrair progresso
    const progressMatch = output.match(/(\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      renderStatus.progress = Math.round((current / total) * 100);
      renderStatus.message = `Renderizando ${compositionId}... ${renderStatus.progress}%`;
    }
  });

  render.stdout.on("data", (data: Buffer) => {
    const output = data.toString();
    lastOutput = output;

    const progressMatch = output.match(/(\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      renderStatus.progress = Math.round((current / total) * 100);
      renderStatus.message = `Renderizando ${compositionId}... ${renderStatus.progress}%`;
    }
  });

  render.on("close", (code: number) => {
    if (code === 0) {
      renderStatus = {
        status: "done",
        progress: 100,
        message: `Pronto! ${fileName}`,
        outputFile: `/videos/${fileName}`,
        compositionId,
      };
    } else {
      renderStatus = {
        status: "error",
        progress: 0,
        message: `Erro na renderização: ${lastOutput.slice(-200)}`,
        compositionId,
      };
    }
  });

  res.json({ message: "Renderização iniciada", fileName });
});

// Resetar status
app.post("/api/reset", (_req, res) => {
  renderStatus = {
    status: "idle",
    progress: 0,
    message: "Pronto para renderizar",
  };
  res.json({ ok: true });
});

const PORT = 3100;
app.listen(PORT, () => {
  console.log(`\n🎬 Editor de Vídeo com IA`);
  console.log(`   Abra no navegador: http://localhost:${PORT}`);
  console.log(`   Vídeos renderizados ficam em: ${OUT_DIR}\n`);
});
