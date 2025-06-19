import express from 'express';
import { pagamentosController } from '../controllers/pagamentosController.js';

const router = express.Router();

router.get('/', pagamentosController.getAll);
router.get('/:id', pagamentosController.getById);
router.get('/fatura/:faturaId', pagamentosController.getByFatura);
router.post('/', pagamentosController.create);
router.put('/:id', pagamentosController.update);
router.delete('/:id', pagamentosController.delete);

export default router;