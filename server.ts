import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Conectar ao SQLite
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // Inicializar tabelas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      valorSugerido REAL NOT NULL,
      valorOportunidade REAL NOT NULL,
      valorGanho REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      priceId INTEGER NOT NULL,
      nome TEXT NOT NULL,
      horas REAL NOT NULL,
      FOREIGN KEY (priceId) REFERENCES prices (id) ON DELETE CASCADE
    );
  `);

  // API Routes
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await db.all("SELECT * FROM prices ORDER BY createdAt DESC");
      const pricesWithTasks = await Promise.all(
        prices.map(async (price) => {
          const tasks = await db.all("SELECT * FROM tasks WHERE priceId = ?", [price.id]);
          return { ...price, tarefas: tasks };
        })
      );
      res.json(pricesWithTasks);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar preços" });
    }
  });

  app.post("/api/prices", async (req, res) => {
    const { nome, valorSugerido, valorOportunidade, valorGanho, tarefas } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO prices (nome, valorSugerido, valorOportunidade, valorGanho) VALUES (?, ?, ?, ?)",
        [nome, valorSugerido, valorOportunidade, valorGanho]
      );
      const priceId = result.lastID;

      if (tarefas && tarefas.length > 0) {
        for (const task of tarefas) {
          await db.run(
            "INSERT INTO tasks (priceId, nome, horas) VALUES (?, ?, ?)",
            [priceId, task.nome, task.horas]
          );
        }
      }

      const newPrice = await db.get("SELECT * FROM prices WHERE id = ?", [priceId]);
      const newTasks = await db.all("SELECT * FROM tasks WHERE priceId = ?", [priceId]);
      res.status(201).json({ ...newPrice, tarefas: newTasks });
    } catch (error) {
      res.status(500).json({ error: "Erro ao salvar preço" });
    }
  });

  app.delete("/api/prices/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.run("DELETE FROM prices WHERE id = ?", [id]);
      res.json({ message: "Preço removido com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao remover preço" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Erro ao iniciar o servidor:", err);
});
