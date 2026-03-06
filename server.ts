import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Conectar ao MySQL
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306
  });

  // Inicializar tabelas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS markers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cor VARCHAR(50) NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      valorSugerido DECIMAL(10, 2) NOT NULL,
      valorOportunidade DECIMAL(10, 2) NOT NULL,
      valorGanho DECIMAL(10, 2) NOT NULL,
      markerId INT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (markerId) REFERENCES markers(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      priceId INT NOT NULL,
      nome VARCHAR(255) NOT NULL,
      horas DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (priceId) REFERENCES prices(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      conteudo LONGTEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir marcadores padrão se não existirem
  const [existingMarkers] = await db.execute("SELECT COUNT(*) as count FROM markers") as any;
  if (existingMarkers[0].count === 0) {
    await db.execute("INSERT INTO markers (nome, cor) VALUES (?, ?), (?, ?), (?, ?), (?, ?)", [
      'Aprovado', '#10b981',
      'Aguardando', '#f59e0b',
      'Ajustes', '#3b82f6',
      'Reprovado', '#ef4444'
    ]);
  }

  // API Routes - Prices
  app.get("/api/prices", async (req, res) => {
    try {
      const [prices] = await db.execute(`
        SELECT p.*, m.nome as markerNome, m.cor as markerCor 
        FROM prices p 
        LEFT JOIN markers m ON p.markerId = m.id 
        ORDER BY p.createdAt DESC
      `) as any;

      const pricesWithTasks = await Promise.all(
        prices.map(async (price: any) => {
          const [tasks] = await db.execute("SELECT * FROM tasks WHERE priceId = ?", [price.id]) as any;
          return { ...price, tarefas: tasks };
        })
      );
      res.json(pricesWithTasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar preços" });
    }
  });

  app.post("/api/prices", async (req, res) => {
    const { nome, valorSugerido, valorOportunidade, valorGanho, tarefas, markerId } = req.body;
    try {
      const [result] = await db.execute(
        "INSERT INTO prices (nome, valorSugerido, valorOportunidade, valorGanho, markerId) VALUES (?, ?, ?, ?, ?)",
        [nome, valorSugerido, valorOportunidade, valorGanho, markerId || null]
      ) as any;
      const priceId = result.insertId;

      if (tarefas && tarefas.length > 0) {
        for (const task of tarefas) {
          await db.execute(
            "INSERT INTO tasks (priceId, nome, horas) VALUES (?, ?, ?)",
            [priceId, task.nome, task.horas]
          );
        }
      }

      const [newPriceRows] = await db.execute("SELECT * FROM prices WHERE id = ?", [priceId]) as any;
      const [newTasks] = await db.execute("SELECT * FROM tasks WHERE priceId = ?", [priceId]) as any;
      res.status(201).json({ ...newPriceRows[0], tarefas: newTasks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar preço" });
    }
  });

  app.patch("/api/prices/:id", async (req, res) => {
    const { id } = req.params;
    const { markerId } = req.body;
    try {
      await db.execute("UPDATE prices SET markerId = ? WHERE id = ?", [markerId, id]);
      res.json({ message: "Preço atualizado com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar preço" });
    }
  });

  app.delete("/api/prices/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM prices WHERE id = ?", [id]);
      res.json({ message: "Preço removido com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao remover preço" });
    }
  });

  // API Routes - Markers
  app.get("/api/markers", async (req, res) => {
    try {
      const [markers] = await db.execute("SELECT * FROM markers") as any;
      res.json(markers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar marcadores" });
    }
  });

  app.post("/api/markers", async (req, res) => {
    const { nome, cor } = req.body;
    try {
      const [result] = await db.execute("INSERT INTO markers (nome, cor) VALUES (?, ?)", [nome, cor]) as any;
      res.status(201).json({ id: result.insertId, nome, cor });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar marcador" });
    }
  });

  app.put("/api/markers/:id", async (req, res) => {
    const { id } = req.params;
    const { nome, cor } = req.body;
    try {
      await db.execute("UPDATE markers SET nome = ?, cor = ? WHERE id = ?", [nome, cor, id]);
      res.json({ id, nome, cor });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar marcador" });
    }
  });

  app.delete("/api/markers/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM markers WHERE id = ?", [id]);
      res.json({ message: "Marcador removido com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao remover marcador" });
    }
  });

  // API Routes - Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const [templates] = await db.execute("SELECT * FROM templates ORDER BY createdAt DESC") as any;
      res.json(templates);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar modelos" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    const { nome, conteudo } = req.body;
    try {
      const [result] = await db.execute("INSERT INTO templates (nome, conteudo) VALUES (?, ?)", [nome, JSON.stringify(conteudo)]) as any;
      res.status(201).json({ id: result.insertId, nome, conteudo, createdAt: new Date() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar modelo" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM templates WHERE id = ?", [id]);
      res.json({ message: "Modelo removido com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao remover modelo" });
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
