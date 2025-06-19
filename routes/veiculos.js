import express from 'express';
import { veiculosController } from '../controllers/veiculosController.js';

const router = express.Router();

router.get('/', veiculosController.getAll);
router.get('/:id', veiculosController.getById);
router.post('/', veiculosController.create);
router.put('/:id', veiculosController.update);
router.delete('/:id', veiculosController.delete);

export default router;