import supabase from "../database/database.js";

export const estoqueController = {
  // Listar todas as peças
  async getAll(req, res) {
    try {
      const { data: pecas, error } = await supabase.from("estoque").select("*").order("nome_peca", { ascending: true }); // nome_peca: snake_case

      if (error) {
        console.error("Erro ao buscar peças do estoque:", error.message);
        return res.status(500).json({ error: "Erro ao buscar peças do estoque.", details: error.message });
      }
      res.json(pecas);
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.getAll:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar peça por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { data: peca, error } = await supabase
        .from("estoque")
        .select("*")
        .eq("peca_id", id) // peca_id: snake_case
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Peça não encontrada" });
        }
        console.error("Erro ao buscar peça por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar peça por ID.", details: error.message });
      }

      res.json(peca);
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.getById:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Criar nova peça
  async create(req, res) {
    try {
      const { NomePeca, Descricao, Quantidade, PrecoCusto, PrecoVenda, NivelMinimo } = req.body;

      if (!NomePeca || PrecoCusto === undefined || PrecoVenda === undefined) {
        return res.status(400).json({ error: "NomePeca, PrecoCusto e PrecoVenda são obrigatórios" });
      }

      const { data: novaPeca, error } = await supabase
        .from("estoque")
        .insert([
          {
            nome_peca: NomePeca, // nome_peca: snake_case
            descricao: Descricao,
            quantidade: Quantidade || 0,
            preco_custo: PrecoCusto, // preco_custo: snake_case
            preco_venda: PrecoVenda, // preco_venda: snake_case
            nivel_minimo: NivelMinimo || 0, // nivel_minimo: snake_case
          },
        ])
        .select();

      if (error) {
        console.error("Erro ao criar peça:", error.message);
        if (error.code === "23505" && error.message.includes("estoque_nome_peca_key")) {
          return res.status(400).json({ error: "Nome da peça já cadastrado" });
        }
        return res.status(500).json({ error: "Erro ao criar peça.", details: error.message });
      }

      res.status(201).json(novaPeca[0]);
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.create:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar peça
  async update(req, res) {
    try {
      const { id } = req.params;
      const { NomePeca, Descricao, Quantidade, PrecoCusto, PrecoVenda, NivelMinimo } = req.body;

      const { data: pecaAtualizada, error } = await supabase
        .from("estoque")
        .update({
          nome_peca: NomePeca,
          descricao: Descricao,
          quantidade: Quantidade,
          preco_custo: PrecoCusto,
          preco_venda: PrecoVenda,
          nivel_minimo: NivelMinimo,
        })
        .eq("peca_id", id)
        .select();

      if (error) {
        console.error("Erro ao atualizar peça:", error.message);
        if (error.code === "23505" && error.message.includes("estoque_nome_peca_key")) {
          return res.status(400).json({ error: "Nome da peça já cadastrado" });
        }
        return res.status(500).json({ error: "Erro ao atualizar peça.", details: error.message });
      }

      if (!pecaAtualizada || pecaAtualizada.length === 0) {
        return res.status(404).json({ error: "Peça não encontrada" });
      }

      res.json(pecaAtualizada[0]);
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.update:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Deletar peça
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { data, error, count } = await supabase.from("estoque").delete({ count: "exact" }).eq("peca_id", id);

      if (error) {
        console.error("Erro ao deletar peça:", error.message);
        if (error.code === "23503") {
          return res.status(400).json({ error: "Não é possível deletar peça utilizada em serviços" });
        }
        return res.status(500).json({ error: "Erro ao deletar peça.", details: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Peça não encontrada" });
      }

      res.json({ message: "Peça deletada com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.delete:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Listar peças com estoque baixo
  async getBaixoEstoque(req, res) {
    try {
      const { data: pecas, error } = await supabase
        .from("estoque")
        .select("*")
        .lte("quantidade", "nivel_minimo") // quantidade, nivel_minimo: snake_case
        .order("nome_peca", { ascending: true });

      if (error) {
        console.error("Erro ao buscar peças com estoque baixo:", error.message);
        return res.status(500).json({ error: "Erro ao buscar peças com estoque baixo.", details: error.message });
      }
      res.json(pecas);
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.getBaixoEstoque:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar quantidade de uma peça
  async updateQuantidade(req, res) {
    try {
      const { id } = req.params;
      const { quantidade, operacao } = req.body;

      if (!quantidade || !operacao) {
        return res.status(400).json({ error: "Quantidade e operação são obrigatórios" });
      }

      const { data: pecaAtual, error: getError } = await supabase
        .from("estoque")
        .select("quantidade") // quantidade: snake_case
        .eq("peca_id", id)
        .single();

      if (getError) {
        if (getError.code === "PGRST116") {
          return res.status(404).json({ error: "Peça não encontrada" });
        }
        console.error("Erro ao buscar peça para atualizar quantidade:", getError.message);
        return res.status(500).json({ error: "Erro ao buscar peça.", details: getError.message });
      }

      let novaQuantidade;
      if (operacao === "adicionar") {
        novaQuantidade = pecaAtual.quantidade + quantidade;
      } else if (operacao === "remover") {
        novaQuantidade = pecaAtual.quantidade - quantidade;
        if (novaQuantidade < 0) {
          return res.status(400).json({ error: "Quantidade insuficiente em estoque" });
        }
      } else {
        return res.status(400).json({ error: 'Operação deve ser "adicionar" ou "remover"' });
      }

      const { data: pecaAtualizada, error: updateError } = await supabase
        .from("estoque")
        .update({ quantidade: novaQuantidade }) // quantidade: snake_case
        .eq("peca_id", id)
        .select();

      if (updateError) {
        console.error("Erro ao atualizar quantidade da peça:", updateError.message);
        return res.status(500).json({ error: "Erro ao atualizar quantidade.", details: updateError.message });
      }

      res.json(pecaAtualizada[0]);
    } catch (error) {
      console.error("Exceção inesperada em estoqueController.updateQuantidade:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
