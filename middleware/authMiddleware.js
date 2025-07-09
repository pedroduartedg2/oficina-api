// middleware/authMiddleware.js
import supabase from "../database/database.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verifica o token com o Supabase Auth
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        console.error("Erro na autenticação (token inválido/expirado):", error?.message || "Token inválido.");
        return res.status(401).json({ error: "Não autorizado, token falhou ou é inválido." });
      }

      // Anexa o usuário autenticado ao objeto de requisição
      // O objeto 'data.user' já contém todas as informações do usuário do Auth,
      // incluindo a user_metadata que contém o 'nome_completo'
      req.user = {
        id: data.user.id,
        email: data.user.email,
        // Acessamos nome_completo da user_metadata diretamente
        nome_completo: data.user.user_metadata.nome_completo || null,
        // Você pode adicionar outros campos da user_metadata aqui se tiver
      };

      next();
    } catch (error) {
      console.error("Exceção inesperada no middleware de autenticação:", error.message);
      return res.status(401).json({ error: "Não autorizado, token inválido." });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Não autorizado, nenhum token fornecido." });
  }
};
