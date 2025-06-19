import express from 'express';
import { estoqueController } from '../controllers/estoqueController.js';

const router = express.Router();

router.get('/', estoqueController.getAll);
router.get('/baixo-estoque', estoqueController.getBaixoEstoque);
router.get('/:id', estoqueController.getById);
router.post('/', estoqueController.create);
router.put('/:id', estoqueController.update);
router.put('/:id/quantidade', estoqueController.updateQuantidade);
router.delete('/:id', estoqueController.delete);

export default router;