import supabase from "../database/database.js";

export const faturasController = {
  // Listar todas as faturas
  async getAll(req, res) {
    try {
      // Using the VIEW created in Supabase
      const { data: faturas, error } = await supabase.from("faturas_detalhadas").select("*").order("data_emissao", { ascending: false }); // data_emissao: snake_case

      if (error) {
        console.error("Erro ao buscar faturas:", error.message);
        return res.status(500).json({ error: "Erro ao buscar faturas.", details: error.message });
      }
      res.json(faturas);
    } catch (error) {
      console.error("Exceção inesperada em faturasController.getAll:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar fatura por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      // Using the VIEW created in Supabase
      const { data: fatura, error } = await supabase
        .from("faturas_detalhadas")
        .select("*")
        .eq("fatura_id", id) // fatura_id: snake_case
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Fatura não encontrada" });
        }
        console.error("Erro ao buscar fatura por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar fatura por ID.", details: error.message });
      }

      // Fetch payments for the invoice
      const { data: pagamentos, error: pagamentosError } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("fatura_id", id) // fatura_id: snake_case
        .order("data_pagamento", { ascending: false }); // data_pagamento: snake_case

      if (pagamentosError) {
        console.error("Erro ao buscar pagamentos da fatura:", pagamentosError.message);
        fatura.pagamentos = [];
      } else {
        fatura.pagamentos = pagamentos;
      }

      res.json(fatura);
    } catch (error) {
      console.error("Exceção inesperada em faturasController.getById:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Criar nova fatura
  async create(req, res) {
    try {
      const { ServicoID, DataEmissao, ValorTotalFatura, StatusPagamento } = req.body;

      if (!ServicoID || ValorTotalFatura === undefined) {
        return res.status(400).json({ error: "ServicoID e ValorTotalFatura são obrigatórios" });
      }

      // Verify if the service exists
      const { data: servico, error: servicoError } = await supabase.from("servicos").select("servico_id").eq("servico_id", ServicoID).single();

      if (servicoError || !servico) {
        return res.status(400).json({ error: "Serviço não encontrado" });
      }

      const { data: novaFatura, error } = await supabase
        .from("faturas")
        .insert([
          {
            servico_id: ServicoID, // servico_id: snake_case
            data_emissao: DataEmissao || new Date().toISOString().split("T")[0], // data_emissao: snake_case
            valor_total_fatura: ValorTotalFatura, // valor_total_fatura: snake_case
            status_pagamento: StatusPagamento || "Aberto", // status_pagamento: snake_case
          },
        ])
        .select();

      if (error) {
        console.error("Erro ao criar fatura:", error.message);
        return res.status(500).json({ error: "Erro ao criar fatura.", details: error.message });
      }

      // After creation, fetch from the VIEW for full details
      const { data: faturaDetalhada, error: detailedError } = await supabase.from("faturas_detalhadas").select("*").eq("fatura_id", novaFatura[0].fatura_id).single();

      if (detailedError) {
        console.warn("Aviso: Não foi possível buscar detalhes da fatura recém-criada.", detailedError.message);
        return res.status(201).json(novaFatura[0]);
      }

      res.status(201).json(faturaDetalhada);
    } catch (error) {
      console.error("Exceção inesperada em faturasController.create:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar fatura
  async update(req, res) {
    try {
      const { id } = req.params;
      const { ServicoID, DataEmissao, ValorTotalFatura, StatusPagamento } = req.body;

      const { data: faturaAtualizada, error } = await supabase
        .from("faturas")
        .update({
          servico_id: ServicoID,
          data_emissao: DataEmissao,
          valor_total_fatura: ValorTotalFatura,
          status_pagamento: StatusPagamento,
        })
        .eq("fatura_id", id)
        .select();

      if (error) {
        console.error("Erro ao atualizar fatura:", error.message);
        return res.status(500).json({ error: "Erro ao atualizar fatura.", details: error.message });
      }

      if (!faturaAtualizada || faturaAtualizada.length === 0) {
        return res.status(404).json({ error: "Fatura não encontrada" });
      }

      // After update, fetch from the VIEW for full details
      const { data: faturaDetalhada, error: detailedError } = await supabase.from("faturas_detalhadas").select("*").eq("fatura_id", id).single();

      if (detailedError) {
        console.warn("Aviso: Não foi possível buscar detalhes da fatura atualizada.", detailedError.message);
        return res.status(200).json(faturaAtualizada[0]);
      }

      res.json(faturaDetalhada);
    } catch (error) {
      console.error("Exceção inesperada em faturasController.update:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Deletar fatura
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { data, error, count } = await supabase.from("faturas").delete({ count: "exact" }).eq("fatura_id", id);

      if (error) {
        console.error("Erro ao deletar fatura:", error.message);
        if (error.code === "23503") {
          // Foreign key constraint
          return res.status(400).json({ error: "Não é possível deletar fatura com pagamentos associados" });
        }
        return res.status(500).json({ error: "Erro ao deletar fatura.", details: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Fatura não encontrada" });
      }

      res.json({ message: "Fatura deletada com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em faturasController.delete:", error.message);
      res.status(500).json({ error: error.message });
    }
  },

  // Listar faturas em aberto
  async getEmAberto(req, res) {
    try {
      // Using the VIEW created in Supabase
      const { data: faturas, error } = await supabase
        .from("faturas_detalhadas")
        .select("*")
        .eq("status_pagamento", "Aberto") // status_pagamento: snake_case
        .order("data_emissao", { ascending: true }); // data_emissao: snake_case

      if (error) {
        console.error("Erro ao buscar faturas em aberto:", error.message);
        return res.status(500).json({ error: "Erro ao buscar faturas em aberto.", details: error.message });
      }
      res.json(faturas);
    } catch (error) {
      console.error("Exceção inesperada em faturasController.getEmAberto:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
