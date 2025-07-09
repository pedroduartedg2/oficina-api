import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// import database from "./database/database.js"; // <-- REMOVA ESTA LINHA OU MUDE ELA
import supabase from "./database/database.js"; // <-- ADICIONE ESTA LINHA (assumindo que database.js agora exporta o cliente Supabase)
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Importar rotas
import clientesRoutes from "./routes/clientes.js";
import veiculosRoutes from "./routes/veiculos.js";
import estoqueRoutes from "./routes/estoque.js";
import servicosRoutes from "./routes/servicos.js";
import faturasRoutes from "./routes/faturas.js";
import pagamentosRoutes from "./routes/pagamentos.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela de tempo
  message: {
    error: "Muitas requisições",
    message: "Tente novamente em alguns minutos",
  },
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- REMOVA A LINHA ABAIXO, NÃO É MAIS NECESSÁRIO PARA SUPABASE ---
// await database.connect();
// ------------------------------------------------------------------

// Rota de health check
app.get("/health", (req, res) => {
  // O health check não precisa mais verificar a conexão com o banco de dados local
  // mas se quiser verificar a conexão com Supabase, precisaria fazer uma query de teste.
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rota principal
app.get("/", (req, res) => {
  res.json({
    message: "API da Oficina Mecânica",
    version: "1.0.0",
    endpoints: {
      clientes: "/api/clientes",
      veiculos: "/api/veiculos",
      estoque: "/api/estoque",
      servicos: "/api/servicos",
      faturas: "/api/faturas",
      pagamentos: "/api/pagamentos",
    },
  });
});

// Rotas da API
app.use("/api/clientes", clientesRoutes);
app.use("/api/veiculos", veiculosRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/servicos", servicosRoutes);
app.use("/api/faturas", faturasRoutes);
app.use("/api/pagamentos", pagamentosRoutes);
app.use("/api/auth", authRoutes);

// Middleware de erro 404
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  // console.log(`Conectado ao banco de dados SQLite.`); // <-- REMOVA OU ATUALIZE ESTE LOG
  console.log(`✅ Cliente Supabase inicializado e pronto para uso.`); // <-- NOVO LOG
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base: http://localhost:${PORT}/`); // Ajustado para rota principal
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Encerrando servidor...");
  // --- REMOVA ESTAS LINHAS, NÃO HÁ database.close() PARA SUPABASE ---
  // await database.close();
  // -----------------------------------------------------------------
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Encerrando servidor...");
  // --- REMOVA ESTAS LINHAS, NÃO HÁ database.close() PARA SUPABASE ---
  // await database.close();
  // -----------------------------------------------------------------
  process.exit(0);
});
