import express from 'express';
import { faturasController } from '../controllers/faturasController.js';

const router = express.Router();

router.get('/', faturasController.getAll);
router.get('/em-aberto', faturasController.getEmAberto);
router.get('/:id', faturasController.getById);
router.post('/', faturasController.create);
router.put('/:id', faturasController.update);
router.delete('/:id', faturasController.delete);

export default router;