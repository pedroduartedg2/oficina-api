import supabase from "../database/database.js";

export const veiculosController = {
  // Listar todos os veículos
  async getAll(req, res) {
    try {
      // Usando deep join para incluir dados do cliente
      const { data: veiculos, error } = await supabase
        .from("veiculos") // Supondo tabela 'veiculos'
        // Aqui está a mudança crucial: 'clientes:cliente_id(nome)'
        .select("*, clientes:cliente_id(nome)") // <-- CORRIGIDO: 'cliente_id'
        .order("modelo", { ascending: true }); // Coluna em minúsculas

      if (error) {
        console.error("Erro ao buscar veículos:", error.message);
        return res.status(500).json({ error: "Erro ao buscar veículos.", details: error.message });
      }
      // Mapear para adicionar NomeCliente como antes
      const veiculosFormatados = veiculos.map((v) => ({
        ...v,
        NomeCliente: v.clientes ? v.clientes.nome : null, // Coluna em minúsculas
      }));
      res.json(veiculosFormatados);
    } catch (error) {
      console.error("Exceção inesperada em veiculosController.getAll:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar veículo por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { data: veiculo, error } = await supabase
        .from("veiculos")
        // Aqui está a mudança crucial: 'clientes:cliente_id(nome)'
        .select("*, clientes:cliente_id(nome)") // <-- CORRIGIDO: 'cliente_id'
        .eq("veiculo_id", id) // ID em minúsculas
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Veículo não encontrado" });
        }
        console.error("Erro ao buscar veículo por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar veículo por ID.", details: error.message });
      }

      // Adicionar NomeCliente ao objeto do veículo
      const veiculoFormatado = {
        ...veiculo,
        NomeCliente: veiculo.clientes ? veiculo.clientes.nome : null, // Coluna em minúsculas
      };
      res.json(veiculoFormatado);
    } catch (error) {
      console.error("Exceção inesperada em veiculosController.getById:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Criar novo veículo
  async create(req, res) {
    try {
      const { ClienteID, Modelo, Ano, Placa, Chassi, historico_servicos } = req.body;

      if (!ClienteID || !Modelo || !Placa || !Chassi) {
        return res.status(400).json({ error: "ClienteID, Modelo, Placa e Chassi são obrigatórios" });
      }

      // Verificar se o cliente existe
      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("cliente_id") // <-- CORRIGIDO: 'cliente_id'
        .eq("cliente_id", ClienteID) // <-- CORRIGIDO: 'cliente_id'
        .single();

      if (clienteError || !cliente) {
        return res.status(400).json({ error: "Cliente não encontrado" });
      }

      const { data: novoVeiculo, error: insertError } = await supabase
        .from("veiculos")
        .insert([
          {
            cliente_id: ClienteID, // <-- CORRIGIDO: 'cliente_id'
            modelo: Modelo,
            ano: Ano,
            placa: Placa,
            chassi: Chassi,
            historico_servicos: historico_servicos,
          },
        ])
        // Aqui está a mudança crucial: 'clientes:cliente_id(nome)'
        .select("*, clientes:cliente_id(nome)"); // <-- CORRIGIDO: 'cliente_id'

      if (insertError) {
        console.error("Erro ao criar veículo:", insertError.message);
        if (insertError.code === "23505" && insertError.message.includes("placa")) {
          return res.status(400).json({ error: "Placa já cadastrada" });
        }
        if (insertError.code === "23505" && insertError.message.includes("chassi")) {
          return res.status(400).json({ error: "Chassi já cadastrado" });
        }
        return res.status(500).json({ error: "Erro ao criar veículo.", details: insertError.message });
      }

      const veiculoFormatado = {
        ...novoVeiculo[0],
        NomeCliente: novoVeiculo[0].clientes ? novoVeiculo[0].clientes.nome : null,
      };

      res.status(201).json(veiculoFormatado);
    } catch (error) {
      console.error("Exceção inesperada em veiculosController.create:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar veículo
  async update(req, res) {
    try {
      const { id } = req.params;
      const { ClienteID, Modelo, Ano, Placa, Chassi, historico_servicos } = req.body;

      const { data: veiculoAtualizado, error: updateError } = await supabase
        .from("veiculos")
        .update({
          cliente_id: ClienteID, // <-- CORRIGIDO: 'cliente_id'
          modelo: Modelo,
          ano: Ano,
          placa: Placa,
          chassi: Chassi,
          historico_servicos: historico_servicos,
        })
        .eq("veiculo_id", id)
        // Aqui está a mudança crucial: 'clientes:cliente_id(nome)'
        .select("*, clientes:cliente_id(nome)"); // <-- CORRIGIDO: 'cliente_id'

      if (updateError) {
        console.error("Erro ao atualizar veículo:", updateError.message);
        if (updateError.code === "23505" && updateError.message.includes("placa")) {
          return res.status(400).json({ error: "Placa já cadastrada" });
        }
        if (updateError.code === "23505" && updateError.message.includes("chassi")) {
          return res.status(400).json({ error: "Chassi já cadastrado" });
        }
        return res.status(500).json({ error: "Erro ao atualizar veículo.", details: updateError.message });
      }

      if (!veiculoAtualizado || veiculoAtualizado.length === 0) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }

      const veiculoFormatado = {
        ...veiculoAtualizado[0],
        NomeCliente: veiculoAtualizado[0].clientes ? veiculoAtualizado[0].clientes.nome : null,
      };

      res.json(veiculoFormatado);
    } catch (error) {
      console.error("Exceção inesperada em veiculosController.update:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Deletar veículo
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { data, error, count } = await supabase.from("veiculos").delete({ count: "exact" }).eq("veiculo_id", id);

      if (error) {
        console.error("Erro ao deletar veículo:", error.message);
        if (error.code === "23503") {
          // Chave estrangeira
          return res.status(400).json({ error: "Não é possível deletar veículo com serviços cadastrados" });
        }
        return res.status(500).json({ error: "Erro ao deletar veículo.", details: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }

      res.json({ message: "Veículo deletado com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em veiculosController.delete:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
