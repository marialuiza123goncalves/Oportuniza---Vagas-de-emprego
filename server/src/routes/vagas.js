const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { createVagasController } = require('../controllers/vagasController');

const router = express.Router();
const controller = createVagasController();

router.get('/admin', authenticate, controller.listAdmin);
router.get('/admin/:id', authenticate, controller.getById);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
