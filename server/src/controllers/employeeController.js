const employeeService = require('../services/employeeService');
const { generateCsv } = require('../services/csvService');

class EmployeeController {
  async createEmployee(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json({
        status: 'success',
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEmployees(req, res, next) {
    try {
      const result = await employeeService.getEmployees(req.query);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      const result = await employeeService.deleteEmployee(req.params.id);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportEmployeesCsv(req, res, next) {
    try {
      const employees = await employeeService.getEmployeesForExport(req.query);

      const columns = [
        { label: 'Employee ID', key: 'employeeId' },
        { label: 'Full Name', key: 'fullName' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: (e) => e.phone || '' },
        { label: 'Department', key: 'department' },
        { label: 'Role', key: 'role' },
        { label: 'Status', key: 'status' },
        {
          label: 'Joining Date',
          key: (e) => (e.joiningDate ? e.joiningDate.toISOString().split('T')[0] : ''),
        },
        {
          label: 'Skills',
          key: (e) => (Array.isArray(e.skills) ? e.skills.join('; ') : ''),
        },
        {
          label: 'Leave Start Date',
          key: (e) => (e.leaveStartDate ? e.leaveStartDate.toISOString().split('T')[0] : ''),
        },
        {
          label: 'Leave End Date',
          key: (e) => (e.leaveEndDate ? e.leaveEndDate.toISOString().split('T')[0] : ''),
        },
        {
          label: 'Created At',
          key: (e) => (e.createdAt ? e.createdAt.toISOString() : ''),
        },
      ];

      const csvContent = generateCsv(employees, columns);

      const filename = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmployeeController();
