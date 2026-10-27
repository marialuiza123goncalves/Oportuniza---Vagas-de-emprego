const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { createCoursesController } = require('../controllers/coursesController');

const router = express.Router();
const controller = createCoursesController();

router.get('/admin', authenticate, controller.listAdmin);
router.get('/admin/:id', authenticate, controller.getById);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);
router.get('/', controller.list);

module.exports = router;
