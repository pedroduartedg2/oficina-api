// controllers/authController.js
import supabase from "../database/database.js";

export const authController = {
  /**
   * @route POST /api/auth/register
   * @desc Registra um novo usuário com email e senha
   * @access Public
   */
  async register(req, res) {
    try {
      const { email, password, nome_completo } = req.body;

      if (!email || !password || !nome_completo) {
        return res.status(400).json({ error: "Email, senha e nome completo são obrigatórios." });
      }

      // Registrar o usuário no Supabase Auth
      // 'nome_completo' será armazenado na user_metadata
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nome_completo: nome_completo, // Armazenado na user_metadata do Auth
          },
        },
      });

      if (signUpError) {
        console.error("Erro ao registrar usuário:", signUpError.message);
        return res.status(400).json({ error: signUpError.message });
      }

      // NÃO HÁ CÓDIGO AQUI PARA INSERIR NA TABELA 'usuarios_app'
      // O nome_completo já está na user_metadata de userData.user

      res.status(201).json({
        message: "Usuário registrado com sucesso. Por favor, verifique seu e-mail para confirmar a conta.",
        user: {
          id: userData.user.id,
          email: userData.user.email,
          // Acessamos nome_completo da user_metadata aqui
          nome_completo: userData.user.user_metadata.nome_completo || null,
        },
      });
    } catch (error) {
      console.error("Exceção inesperada em authController.register:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  /**
   * @route POST /api/auth/login
   * @desc Autentica um usuário com email e senha
   * @access Public
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error("Erro ao fazer login:", signInError.message);
        return res.status(401).json({ error: signInError.message });
      }

      res.status(200).json({
        message: "Login bem-sucedido!",
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        user: {
          id: signInData.user.id,
          email: signInData.user.email,
          // Acessamos nome_completo da user_metadata aqui
          nome_completo: signInData.user.user_metadata.nome_completo || null,
        },
      });
    } catch (error) {
      console.error("Exceção inesperada em authController.login:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
