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
    CREATE TABLE IF NOT EXISTS prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      valorSugerido DECIMAL(10, 2) NOT NULL,
      valorOportunidade DECIMAL(10, 2) NOT NULL,
      valorGanho DECIMAL(10, 2) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // API Routes
  app.get("/api/prices", async (req, res) => {
    try {
      const [prices] = await db.execute("SELECT * FROM prices ORDER BY createdAt DESC") as any;
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
    const { nome, valorSugerido, valorOportunidade, valorGanho, tarefas } = req.body;
    try {
      const [result] = await db.execute(
        "INSERT INTO prices (nome, valorSugerido, valorOportunidade, valorGanho) VALUES (?, ?, ?, ?)",
        [nome, valorSugerido, valorOportunidade, valorGanho]
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
