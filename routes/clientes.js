// import express from "express";
// import { clientesController } from "../controllers/clientesController.js";
// import { protect } from "../middleware/authMiddleware.js"; // <-- Importe o middleware de proteção

// const router = express.Router();

// router.get("/", protect, clientesController.getAll);
// router.get("/:id", protect, clientesController.getById);
// router.post("/", protect, clientesController.create);
// router.put("/:id", protect, clientesController.update);
// router.delete("/:id", protect, clientesController.delete);
// router.get("/:id/veiculos", protect, clientesController.getVeiculos);

// export default router;

import express from "express";
import { clientesController } from "../controllers/clientesController.js";

const router = express.Router();

router.get("/", clientesController.getAll);
router.get("/:id", clientesController.getById);
router.post("/", clientesController.create);
router.put("/:id", clientesController.update);
router.delete("/:id", clientesController.delete);
router.get("/:id/veiculos", clientesController.getVeiculos);

export default router;
