/*
  # Create oficina database schema

  1. New Tables
    - `clientes` - Customer information with contact details
    - `veiculos` - Vehicle information linked to customers
    - `estoque` - Parts inventory with pricing and stock levels
    - `servicos` - Service appointments and work orders
    - `servicos_pecas` - Junction table linking services to parts used
    - `faturas` - Invoices generated from services
    - `pagamentos` - Payment records for invoices

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data

  3. Features
    - UUID primary keys for better scalability
    - Proper foreign key relationships
    - Default values and constraints
    - Timestamps with timezone support
*/

-- Create custom types for better data integrity
CREATE TYPE status_servico AS ENUM ('Agendado', 'Em Andamento', 'Concluido', 'Cancelado');
CREATE TYPE status_pagamento AS ENUM ('Aberto', 'Parcialmente Pago', 'Pago');
CREATE TYPE metodo_pagamento AS ENUM ('Cartao de Credito', 'Cartao de Debito', 'Dinheiro', 'Pix', 'Transferencia');

-- Tabela Clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    endereco text,
    telefone text,
    email text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela Veiculos
CREATE TABLE IF NOT EXISTS veiculos (
    veiculo_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    modelo text NOT NULL,
    ano integer,
    placa text NOT NULL UNIQUE,
    chassi text NOT NULL UNIQUE,
    historico_servicos text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela Estoque
CREATE TABLE IF NOT EXISTS estoque (
    peca_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_peca text NOT NULL UNIQUE,
    descricao text,
    quantidade integer NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    preco_custo decimal(10,2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda decimal(10,2) NOT NULL CHECK (preco_venda >= 0),
    nivel_minimo integer NOT NULL DEFAULT 0 CHECK (nivel_minimo >= 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela Servicos
CREATE TABLE IF NOT EXISTS servicos (
    servico_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    veiculo_id uuid NOT NULL REFERENCES veiculos(veiculo_id) ON DELETE CASCADE,
    funcionario_id uuid, -- Para futura implementação de funcionários
    data_agendamento date NOT NULL,
    hora_agendamento time NOT NULL,
    tipo_servico text NOT NULL,
    status status_servico NOT NULL DEFAULT 'Agendado',
    descricao text,
    valor_total decimal(10,2) NOT NULL DEFAULT 0.0 CHECK (valor_total >= 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela ServicosPecas (Tabela de Junção para N:M)
CREATE TABLE IF NOT EXISTS servicos_pecas (
    servico_id uuid NOT NULL REFERENCES servicos(servico_id) ON DELETE CASCADE,
    peca_id uuid NOT NULL REFERENCES estoque(peca_id) ON DELETE CASCADE,
    quantidade integer NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (servico_id, peca_id),
    created_at timestamptz DEFAULT now()
);

-- Tabela Faturas
CREATE TABLE IF NOT EXISTS faturas (
    fatura_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servico_id uuid NOT NULL REFERENCES servicos(servico_id) ON DELETE CASCADE,
    data_emissao date NOT NULL DEFAULT CURRENT_DATE,
    valor_total_fatura decimal(10,2) NOT NULL CHECK (valor_total_fatura >= 0),
    status_pagamento status_pagamento NOT NULL DEFAULT 'Aberto',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela Pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    pagamento_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fatura_id uuid NOT NULL REFERENCES faturas(fatura_id) ON DELETE CASCADE,
    data_pagamento date NOT NULL DEFAULT CURRENT_DATE,
    valor_pago decimal(10,2) NOT NULL CHECK (valor_pago > 0),
    metodo_pagamento metodo_pagamento NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_veiculo_id ON servicos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_servicos_data_agendamento ON servicos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_faturas_servico_id ON faturas(servico_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_fatura_id ON pagamentos(fatura_id);
CREATE INDEX IF NOT EXISTS idx_estoque_quantidade ON estoque(quantidade);

-- Enable Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can read all clientes"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert clientes"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update clientes"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete clientes"
  ON clientes
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all veiculos"
  ON veiculos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert veiculos"
  ON veiculos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update veiculos"
  ON veiculos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete veiculos"
  ON veiculos
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all estoque"
  ON estoque
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert estoque"
  ON estoque
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update estoque"
  ON estoque
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete estoque"
  ON estoque
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all servicos"
  ON servicos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert servicos"
  ON servicos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update servicos"
  ON servicos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete servicos"
  ON servicos
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all servicos_pecas"
  ON servicos_pecas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert servicos_pecas"
  ON servicos_pecas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update servicos_pecas"
  ON servicos_pecas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete servicos_pecas"
  ON servicos_pecas
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all faturas"
  ON faturas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert faturas"
  ON faturas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update faturas"
  ON faturas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete faturas"
  ON faturas
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all pagamentos"
  ON pagamentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert pagamentos"
  ON pagamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update pagamentos"
  ON pagamentos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete pagamentos"
  ON pagamentos
  FOR DELETE
  TO authenticated
  USING (true);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estoque_updated_at BEFORE UPDATE ON estoque
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faturas_updated_at BEFORE UPDATE ON faturas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();