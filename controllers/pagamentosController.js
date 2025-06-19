import supabase from "../database/database.js";

export const pagamentosController = {
  // Listar todos os pagamentos
  async getAll(req, res) {
    try {
      const { data: pagamentos, error } = await supabase
        .from("pagamentos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .order("data_pagamento", { ascending: false }); // data_pagamento: snake_case

      if (error) {
        console.error("Erro ao buscar pagamentos:", error.message);
        return res.status(500).json({ error: "Erro ao buscar pagamentos.", details: error.message });
      }
      res.json(pagamentos);
    } catch (error) {
      console.error("Exceção inesperada em pagamentosController.getAll:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar pagamento por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { data: pagamento, error } = await supabase
        .from("pagamentos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .eq("pagamento_id", id) // pagamento_id: snake_case
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Pagamento não encontrado" });
        }
        console.error("Erro ao buscar pagamento por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar pagamento por ID.", details: error.message });
      }

      res.json(pagamento);
    } catch (error) {
      console.error("Exceção inesperada em pagamentosController.getById:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Criar novo pagamento
  async create(req, res) {
    const { FaturaID, DataPagamento, ValorPago, MetodoPagamento } = req.body;

    try {
      if (!FaturaID || ValorPago === undefined || !MetodoPagamento) {
        return res.status(400).json({ error: "FaturaID, ValorPago e MetodoPagamento são obrigatórios" });
      }

      // 1. Verify if the invoice exists and get total value
      const { data: fatura, error: faturaError } = await supabase
        .from("faturas")
        .select("valor_total_fatura") // valor_total_fatura: snake_case
        .eq("fatura_id", FaturaID) // fatura_id: snake_case
        .single();

      if (faturaError || !fatura) {
        return res.status(400).json({ error: "Fatura não encontrada" });
      }

      // 2. Calculate total already paid
      const { data: pagamentosExistentes, error: existingPaymentsError } = await supabase
        .from("pagamentos")
        .select("valor_pago") // valor_pago: snake_case
        .eq("fatura_id", FaturaID);

      if (existingPaymentsError) {
        console.error("Erro ao buscar pagamentos existentes:", existingPaymentsError.message);
        return res.status(500).json({ error: "Erro ao processar pagamento.", details: existingPaymentsError.message });
      }

      const totalPagoExistente = pagamentosExistentes.reduce((sum, p) => sum + p.valor_pago, 0); // valor_pago: snake_case
      const novoTotalPago = totalPagoExistente + ValorPago;

      // 3. Verify if it doesn't exceed invoice total
      if (novoTotalPago > fatura.valor_total_fatura) {
        // valor_total_fatura: snake_case
        return res.status(400).json({ error: "Valor do pagamento excede o valor restante da fatura" });
      }

      // 4. Insert new payment
      const { data: novoPagamento, error: insertError } = await supabase
        .from("pagamentos")
        .insert([
          {
            fatura_id: FaturaID, // fatura_id: snake_case
            data_pagamento: DataPagamento || new Date().toISOString().split("T")[0], // data_pagamento: snake_case
            valor_pago: ValorPago, // valor_pago: snake_case
            metodo_pagamento: MetodoPagamento, // metodo_pagamento: snake_case
          },
        ])
        .select();

      if (insertError) {
        console.error("Erro ao criar pagamento:", insertError.message);
        return res.status(500).json({ error: "Erro ao criar pagamento.", details: insertError.message });
      }

      // 5. Update invoice status
      let novoStatus = "Parcialmente Pago";
      if (novoTotalPago >= fatura.valor_total_fatura) {
        novoStatus = "Pago";
      }

      const { error: updateFaturaError } = await supabase
        .from("faturas")
        .update({ status_pagamento: novoStatus }) // status_pagamento: snake_case
        .eq("fatura_id", FaturaID);

      if (updateFaturaError) {
        console.error("Erro ao atualizar status da fatura:", updateFaturaError.message);
      }

      // Return the payment with detailed view data
      const { data: pagamentoDetalhado, error: detailedError } = await supabase
        .from("pagamentos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .eq("pagamento_id", novoPagamento[0].pagamento_id)
        .single();

      if (detailedError) {
        console.warn("Aviso: Não foi possível buscar detalhes do pagamento recém-criado.", detailedError.message);
        return res.status(201).json(novoPagamento[0]);
      }

      res.status(201).json(pagamentoDetalhado);
    } catch (error) {
      console.error("Exceção inesperada em pagamentosController.create:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Atualizar pagamento
  async update(req, res) {
    try {
      const { id } = req.params;
      const { FaturaID, DataPagamento, ValorPago, MetodoPagamento } = req.body;

      // 1. Get old payment to recalculate invoice
      const { data: oldPayment, error: oldPaymentError } = await supabase
        .from("pagamentos")
        .select("fatura_id, valor_pago") // fatura_id, valor_pago: snake_case
        .eq("pagamento_id", id) // pagamento_id: snake_case
        .single();

      if (oldPaymentError || !oldPayment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      // 2. Update payment
      const { data: pagamentoAtualizado, error: updateError } = await supabase
        .from("pagamentos")
        .update({
          fatura_id: FaturaID,
          data_pagamento: DataPagamento,
          valor_pago: ValorPago,
          metodo_pagamento: MetodoPagamento,
        })
        .eq("pagamento_id", id)
        .select();

      if (updateError) {
        console.error("Erro ao atualizar pagamento:", updateError.message);
        return res.status(500).json({ error: "Erro ao atualizar pagamento.", details: updateError.message });
      }

      // 3. Recalculate and update status of affected invoices
      const faturasAfetadas = new Set([oldPayment.fatura_id]);
      if (FaturaID && FaturaID !== oldPayment.fatura_id) {
        faturasAfetadas.add(FaturaID);
      }

      for (const faturaIdToUpdate of Array.from(faturasAfetadas)) {
        await updateFaturaStatus(faturaIdToUpdate);
      }

      // Return the payment with detailed view data
      const { data: pagamentoDetalhado, error: detailedError } = await supabase
        .from("pagamentos_detalhados") // Using the VIEW created in Supabase
        .select("*")
        .eq("pagamento_id", id)
        .single();

      if (detailedError) {
        console.warn("Aviso: Não foi possível buscar detalhes do pagamento atualizado.", detailedError.message);
        return res.status(200).json(pagamentoAtualizado[0]);
      }

      res.json(pagamentoDetalhado);
    } catch (error) {
      console.error("Exceção inesperada em pagamentosController.update:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Deletar pagamento
  async delete(req, res) {
    try {
      const { id } = req.params;

      // 1. Get payment to retrieve FaturaID
      const { data: pagamento, error: getPaymentError } = await supabase
        .from("pagamentos")
        .select("fatura_id, valor_pago") // fatura_id, valor_pago: snake_case
        .eq("pagamento_id", id) // pagamento_id: snake_case
        .single();

      if (getPaymentError || !pagamento) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      // 2. Delete payment
      const { error: deleteError, count } = await supabase.from("pagamentos").delete({ count: "exact" }).eq("pagamento_id", id);

      if (deleteError) {
        console.error("Erro ao deletar pagamento:", deleteError.message);
        return res.status(500).json({ error: "Erro ao deletar pagamento.", details: deleteError.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      // 3. Recalculate and update invoice status
      await updateFaturaStatus(pagamento.fatura_id);

      res.json({ message: "Pagamento deletado com sucesso" });
    } catch (error) {
      console.error("Exceção inesperada em pagamentosController.delete:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  // Buscar pagamentos por fatura
  async getByFatura(req, res) {
    try {
      const { faturaId } = req.params;
      const { data: pagamentos, error } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("fatura_id", faturaId) // fatura_id: snake_case
        .order("data_pagamento", { ascending: false }); // data_pagamento: snake_case

      if (error) {
        console.error("Erro ao buscar pagamentos por fatura:", error.message);
        return res.status(500).json({ error: "Erro ao buscar pagamentos por fatura.", details: error.message });
      }
      res.json(pagamentos);
    } catch (error) {
      console.error("Exceção inesperada em pagamentosController.getByFatura:", error.message);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};

// Helper function to update invoice status (adjusted for Supabase)
async function updateFaturaStatus(faturaId) {
  // Get total invoice value
  const { data: fatura, error: getFaturaError } = await supabase
    .from("faturas")
    .select("valor_total_fatura") // valor_total_fatura: snake_case
    .eq("fatura_id", faturaId) // fatura_id: snake_case
    .single();

  if (getFaturaError || !fatura) {
    console.error(`Erro ao obter fatura para atualização de status (${faturaId}):`, getFaturaError?.message || "Fatura não encontrada");
    return;
  }

  // Calculate total paid
  const { data: totalPagoResult, error: sumError } = await supabase
    .from("pagamentos")
    .select("valor_pago") // valor_pago: snake_case
    .eq("fatura_id", faturaId);

  if (sumError) {
    console.error(`Erro ao somar pagamentos para fatura ${faturaId}:`, sumError.message);
    return;
  }

  const totalPago = totalPagoResult.reduce((sum, p) => sum + p.valor_pago, 0); // valor_pago: snake_case

  let novoStatus;
  if (totalPago === 0) {
    novoStatus = "Aberto";
  } else if (totalPago < fatura.valor_total_fatura) {
    novoStatus = "Parcialmente Pago";
  } else {
    novoStatus = "Pago";
  }

  // Update invoice status
  const { error: updateError } = await supabase
    .from("faturas")
    .update({ status_pagamento: novoStatus }) // status_pagamento: snake_case
    .eq("fatura_id", faturaId);

  if (updateError) {
    console.error(`Erro ao atualizar status_pagamento da fatura ${faturaId}:`, updateError.message);
  }
}
