import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import database from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

async function initDatabase() {
  try {
    await database.connect();
    
    // Ler o arquivo SQL
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o schema em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    // Executar cada comando
    for (const command of commands) {
      if (command.trim()) {
        await database.run(command);
        console.log('Comando executado:', command.substring(0, 50) + '...');
      }
    }

    console.log('Banco de dados inicializado com sucesso!');
    
    // Inserir alguns dados de exemplo
    await insertSampleData();
    
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  } finally {
    await database.close();
  }
}

async function insertSampleData() {
  try {
    // Inserir clientes de exemplo
    await database.run(`
      INSERT INTO Clientes (Nome, Endereco, Telefone, Email) VALUES 
      ('João Silva', 'Rua das Flores, 123', '(11) 99999-9999', 'joao@email.com'),
      ('Maria Santos', 'Av. Principal, 456', '(11) 88888-8888', 'maria@email.com')
    `);

    // Inserir peças de exemplo
    await database.run(`
      INSERT INTO Estoque (NomePeca, Descricao, Quantidade, PrecoCusto, PrecoVenda, NivelMinimo) VALUES 
      ('Óleo Motor 5W30', 'Óleo sintético para motor', 50, 25.00, 35.00, 10),
      ('Filtro de Ar', 'Filtro de ar para diversos modelos', 30, 15.00, 25.00, 5),
      ('Pastilha de Freio', 'Pastilha de freio dianteira', 20, 45.00, 65.00, 8)
    `);

    console.log('Dados de exemplo inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir dados de exemplo:', error);
  }
}

initDatabase();