export const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação do SQLite
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Erro de validação',
      message: err.message
    });
  }

  // Erro de sintaxe SQL
  if (err.code === 'SQLITE_ERROR') {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro na consulta ao banco de dados'
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message || 'Algo deu errado'
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `Rota ${req.method} ${req.path} não existe`
  });
};