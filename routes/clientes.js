import express from 'express';
import { clientesController } from '../controllers/clientesController.js';

const router = express.Router();

router.get('/', clientesController.getAll);
router.get('/:id', clientesController.getById);
router.post('/', clientesController.create);
router.put('/:id', clientesController.update);
router.delete('/:id', clientesController.delete);
router.get('/:id/veiculos', clientesController.getVeiculos);

export default router;