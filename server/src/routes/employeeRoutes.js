const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const {
  validateCreateEmployee,
  validateUpdateEmployee,
} = require('../validators/employeeValidator');

// CSV export must be placed before :id parameter route
router.get('/export', employeeController.exportEmployeesCsv);

router.post('/', validateCreateEmployee, employeeController.createEmployee);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', validateUpdateEmployee, employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
