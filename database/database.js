import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Obtém as credenciais do Supabase das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usamos a chave de serviço para operações de backend seguras

// Verifica se as credenciais estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estão definidas nas variáveis de ambiente.");
  process.exit(1); // Encerra a aplicação se as credenciais não estiverem configuradas
}

// Cria e exporta uma única instância do cliente Supabase
// Não precisamos de uma classe "Database" como antes, pois o Supabase SDK já encapsula a lógica.
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Cliente Supabase inicializado.");

export default supabase;
