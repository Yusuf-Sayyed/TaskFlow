const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const {
  validateCreateTask,
  validateUpdateTask,
  validateTaskStatusTransition,
} = require('../validators/taskValidator');

// CSV export must be declared before :id parameter route
router.get('/export', taskController.exportTasksCsv);

router.post('/', validateCreateTask, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', validateUpdateTask, taskController.updateTask);
router.put('/:id/status', validateTaskStatusTransition, taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
