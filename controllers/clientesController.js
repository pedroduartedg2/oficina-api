import supabase from "../database/database.js";

export const clientesController = {
  // Listar todos os clientes
  async getAll(req, res) {
    try {
      const { data: clientes, error } = await supabase.from("clientes").select("*").order("nome", { ascending: true }); // nome: snake_case

      if (error) {
        console.error("Erro ao buscar clientes:", error.message);
        return res.status(500).json({ error: "Erro ao buscar clientes.", details: error.message });
      }
      res.json(clientes);
    } catch (error) {
      console.error("Exceção inesperada em clientesController.getAll:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar cliente por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { data: cliente, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("cliente_id", id) // cliente_id: snake_case
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Cliente não encontrado" });
        }
        console.error("Erro ao buscar cliente por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar cliente por ID.", details: error.message });
      }

      res.json(cliente);
    } catch (error) {
      console.error("Exceção inesperada em clientesController.getById:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Criar novo cliente
  async create(req, res) {
    try {
      const { Nome, Endereco, Telefone, Email } = req.body; // Incoming body keys might still be PascalCase

      if (!Nome) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }

      const { data: novoCliente, error } = await supabase
        .from("clientes")
        .insert([
          {
            nome: Nome,
            endereco: Endereco,
            telefone: Telefone,
            email: Email,
          },
        ])
        .select();

      if (error) {
        console.error("Erro ao criar cliente:", error.message);
        // Adjust key name if different, but 'clientes_email_key' is common for a unique constraint on 'email'
        if (error.code === "23505" && error.message.includes("clientes_email_key")) {
          return res.status(400).json({ error: "Email já cadastrado" });
        }
        return res.status(500).json({ error: "Erro ao criar cliente.", details: error.message });
      }

      res.status(201).json(novoCliente[0]);
    } catch (error) {
      console.error("Exceção inesperada em clientesController.create:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar cliente
  async update(req, res) {
    try {
      const { id } = req.params;
      const { Nome, Endereco, Telefone, Email } = req.body;

      const { data: clienteAtualizado, error } = await supabase
        .from("clientes")
        .update({
          nome: Nome,
          endereco: Endereco,
          telefone: Telefone,
          email: Email,
        })
        .eq("cliente_id", id)
        .select();

      if (error) {
        console.error("Erro ao atualizar cliente:", error.message);
        if (error.code === "23505" && error.message.includes("clientes_email_key")) {
          return res.status(400).json({ error: "Email já cadastrado" });
        }
        return res.status(500).json({ error: "Erro ao atualizar cliente.", details: error.message });
      }

      if (!clienteAtualizado || clienteAtualizado.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      res.json(clienteAtualizado[0]);
    } catch (error) {
      console.error("Exceção inesperada em clientesController.update:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Deletar cliente
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { data, error, count } = await supabase.from("clientes").delete({ count: "exact" }).eq("cliente_id", id);

      if (error) {
        console.error("Erro ao deletar cliente:", error.message);
        if (error.code === "23503") {
          // Foreign key constraint violation
          return res.status(400).json({ error: "Não é possível deletar cliente com veículos associados" });
        }
        return res.status(500).json({ error: "Erro ao deletar cliente.", details: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      res.json({ message: "Cliente deletado com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em clientesController.delete:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar veículos do cliente
  async getVeiculos(req, res) {
    try {
      const { id } = req.params;
      const { data: veiculos, error } = await supabase.from("veiculos").select("*").eq("cliente_id", id); // cliente_id: snake_case

      if (error) {
        console.error("Erro ao buscar veículos do cliente:", error.message);
        return res.status(500).json({ error: "Erro ao buscar veículos do cliente.", details: error.message });
      }
      res.json(veiculos);
    } catch (error) {
      console.error("Exceção inesperada em clientesController.getVeiculos:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
