import supabase from "../database/database.js";

export const servicosController = {
  // Listar todos os serviços
  async getAll(req, res) {
    try {
      const { data: servicos, error } = await supabase
        .from("servicos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .order("data_agendamento", { ascending: false }) // data_agendamento: snake_case
        .order("hora_agendamento", { ascending: false }); // hora_agendamento: snake_case

      if (error) {
        console.error("Erro ao buscar serviços:", error.message);
        return res.status(500).json({ error: "Erro ao buscar serviços.", details: error.message });
      }
      res.json(servicos);
    } catch (error) {
      console.error("Exceção inesperada em servicosController.getAll:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar serviço por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { data: servico, error } = await supabase
        .from("servicos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .eq("servico_id", id) // servico_id: snake_case
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Serviço não encontrado" });
        }
        console.error("Erro ao buscar serviço por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar serviço por ID.", details: error.message });
      }

      // Fetch parts used in the service (Deep Join for parts details)
      const { data: pecas, error: pecasError } = await supabase
        .from("servicos_pecas") // Intermediate table
        .select("quantidade, pecas:peca_id(nome_peca, preco_venda)") // quantidade, nome_peca, preco_venda: snake_case
        .eq("servico_id", id); // servico_id: snake_case

      if (pecasError) {
        console.error("Erro ao buscar peças do serviço:", pecasError.message);
        servico.pecas = [];
      } else {
        servico.pecas = pecas.map((item) => ({
          Quantidade: item.quantidade,
          NomePeca: item.pecas.nome_peca, // nome_peca: snake_case
          PrecoVenda: item.pecas.preco_venda, // preco_venda: snake_case
          SubTotal: item.quantidade * item.pecas.preco_venda,
        }));
      }

      res.json(servico);
    } catch (error) {
      console.error("Exceção inesperada em servicosController.getById:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Criar novo serviço
  async create(req, res) {
    try {
      const { VeiculoID, FuncionarioID, DataAgendamento, HoraAgendamento, TipoServico, Status, Descricao, ValorTotal, pecas } = req.body;

      if (!VeiculoID || !DataAgendamento || !HoraAgendamento || !TipoServico) {
        return res.status(400).json({ error: "VeiculoID, DataAgendamento, HoraAgendamento e TipoServico são obrigatórios" });
      }

      // Verify if the vehicle exists
      const { data: veiculo, error: veiculoError } = await supabase
        .from("veiculos")
        .select("veiculo_id") // veiculo_id: snake_case
        .eq("veiculo_id", VeiculoID)
        .single();

      if (veiculoError || !veiculo) {
        return res.status(400).json({ error: "Veículo não encontrado" });
      }

      const { data: novoServico, error: insertError } = await supabase
        .from("servicos")
        .insert([
          {
            veiculo_id: VeiculoID, // veiculo_id: snake_case
            funcionario_id: FuncionarioID, // funcionario_id: snake_case
            data_agendamento: DataAgendamento, // data_agendamento: snake_case
            hora_agendamento: HoraAgendamento, // hora_agendamento: snake_case
            tipo_servico: TipoServico, // tipo_servico: snake_case
            status: Status || "Agendado",
            descricao: Descricao,
            valor_total: ValorTotal || 0.0, // valor_total: snake_case
          },
        ])
        .select();

      if (insertError) {
        console.error("Erro ao criar serviço:", insertError.message);
        return res.status(500).json({ error: "Erro ao criar serviço.", details: insertError.message });
      }

      const servicoId = novoServico[0].servico_id;

      // If parts provided, add to ServicosPecas table
      if (pecas && Array.isArray(pecas) && pecas.length > 0) {
        const pecasParaInserir = pecas.map((p) => ({
          servico_id: servicoId,
          peca_id: p.PecaID, // peca_id: snake_case
          quantidade: p.Quantidade,
        }));

        const { error: pecasInsertError } = await supabase.from("servicos_pecas").insert(pecasParaInserir);

        if (pecasInsertError) {
          console.error("Erro ao adicionar peças ao serviço:", pecasInsertError.message);
        }
      }

      // Return service with detailed view data
      const { data: servicoDetalhado, error: detailedError } = await supabase
        .from("servicos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .eq("servico_id", servicoId)
        .single();

      if (detailedError) {
        console.warn("Aviso: Não foi possível buscar detalhes do serviço recém-criado.", detailedError.message);
        return res.status(201).json(novoServico[0]);
      }

      res.status(201).json(servicoDetalhado);
    } catch (error) {
      console.error("Exceção inesperada em servicosController.create:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar serviço
  async update(req, res) {
    try {
      const { id } = req.params;
      const { VeiculoID, FuncionarioID, DataAgendamento, HoraAgendamento, TipoServico, Status, Descricao, ValorTotal } = req.body;

      const { data: servicoAtualizado, error: updateError } = await supabase
        .from("servicos")
        .update({
          veiculo_id: VeiculoID,
          funcionario_id: FuncionarioID,
          data_agendamento: DataAgendamento,
          hora_agendamento: HoraAgendamento,
          tipo_servico: TipoServico,
          status: Status,
          descricao: Descricao,
          valor_total: ValorTotal,
        })
        .eq("servico_id", id)
        .select();

      if (updateError) {
        console.error("Erro ao atualizar serviço:", updateError.message);
        return res.status(500).json({ error: "Erro ao atualizar serviço.", details: updateError.message });
      }

      if (!servicoAtualizado || servicoAtualizado.length === 0) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      // Return service with detailed view data
      const { data: servicoDetalhado, error: detailedError } = await supabase
        .from("servicos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .eq("servico_id", id)
        .single();

      if (detailedError) {
        console.warn("Aviso: Não foi possível buscar detalhes do serviço atualizado.", detailedError.message);
        return res.status(200).json(servicoAtualizado[0]);
      }

      res.json(servicoDetalhado);
    } catch (error) {
      console.error("Exceção inesperada em servicosController.update:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Deletar serviço
  async delete(req, res) {
    try {
      const { id } = req.params;

      // 1. First delete associated parts in the intermediate table
      const { error: deletePecasError } = await supabase.from("servicos_pecas").delete().eq("servico_id", id);

      if (deletePecasError) {
        console.error("Erro ao deletar peças associadas ao serviço:", deletePecasError.message);
        return res.status(500).json({ error: "Erro ao deletar peças do serviço.", details: deletePecasError.message });
      }

      // 2. Delete the main service
      const { data, error: deleteServiceError, count } = await supabase.from("servicos").delete({ count: "exact" }).eq("servico_id", id);

      if (deleteServiceError) {
        console.error("Erro ao deletar serviço:", deleteServiceError.message);
        if (deleteServiceError.code === "23503") {
          // Foreign key constraint
          return res.status(400).json({ error: "Não é possível deletar serviço com faturas associadas" });
        }
        return res.status(500).json({ error: "Erro ao deletar serviço.", details: deleteServiceError.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      res.json({ message: "Serviço deletado com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em servicosController.delete:", error.message);
      res.status(500).json({ error: error.message });
    }
  },

  // Adicionar peça ao serviço
  async adicionarPeca(req, res) {
    try {
      const { id } = req.params;
      const { PecaID, Quantidade } = req.body;

      if (!PecaID || !Quantidade) {
        return res.status(400).json({ error: "PecaID e Quantidade são obrigatórios" });
      }

      // Verify if the service exists
      const { data: servico, error: servicoError } = await supabase.from("servicos").select("servico_id").eq("servico_id", id).single();
      if (servicoError || !servico) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      // Verify if the part exists
      const { data: peca, error: pecaError } = await supabase
        .from("estoque")
        .select("peca_id") // peca_id: snake_case
        .eq("peca_id", PecaID)
        .single();
      if (pecaError || !peca) {
        return res.status(400).json({ error: "Peça não encontrada" });
      }

      const { data, error } = await supabase
        .from("servicos_pecas")
        .upsert(
          { servico_id: id, peca_id: PecaID, quantidade: Quantidade },
          { onConflict: "servico_id,peca_id" } // Conflict on combination of servico_id and peca_id
        )
        .select();

      if (error) {
        console.error("Erro ao adicionar/atualizar peça no serviço:", error.message);
        return res.status(500).json({ error: "Erro ao adicionar/atualizar peça no serviço.", details: error.message });
      }

      res.json({ message: "Peça adicionada/atualizada ao serviço com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em servicosController.adicionarPeca:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Remover peça do serviço
  async removerPeca(req, res) {
    try {
      const { id: servicoId, pecaId } = req.params;

      const { data, error, count } = await supabase.from("servicos_pecas").delete({ count: "exact" }).eq("servico_id", servicoId).eq("peca_id", pecaId); // peca_id: snake_case

      if (error) {
        console.error("Erro ao remover peça do serviço:", error.message);
        return res.status(500).json({ error: "Erro ao remover peça do serviço.", details: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Peça não encontrada no serviço" });
      }

      res.json({ message: "Peça removida do serviço com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em servicosController.removerPeca:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
};
