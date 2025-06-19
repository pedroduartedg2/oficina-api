import express from 'express';
import { servicosController } from '../controllers/servicosController.js';

const router = express.Router();

router.get('/', servicosController.getAll);
router.get('/:id', servicosController.getById);
router.post('/', servicosController.create);
router.put('/:id', servicosController.update);
router.delete('/:id', servicosController.delete);
router.post('/:id/pecas', servicosController.adicionarPeca);
router.delete('/:id/pecas/:pecaId', servicosController.removerPeca);

export default router;