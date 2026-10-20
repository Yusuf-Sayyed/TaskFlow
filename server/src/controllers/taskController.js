const taskService = require('../services/taskService');
const { generateCsv } = require('../services/csvService');

class TaskController {
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json({
        status: 'success',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTasks(req, res, next) {
    try {
      const result = await taskService.getTasks(req.query);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const { status } = req.body;
      const task = await taskService.updateTaskStatus(req.params.id, status);
      res.status(200).json({
        status: 'success',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.params.id);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportTasksCsv(req, res, next) {
    try {
      const tasks = await taskService.getTasksForExport(req.query);

      const columns = [
        { label: 'Task ID', key: 'taskId' },
        { label: 'Title', key: 'title' },
        { label: 'Description', key: (t) => t.description || '' },
        { label: 'Department', key: 'department' },
        { label: 'Priority', key: 'priority' },
        { label: 'Status', key: 'status' },
        {
          label: 'Assignee Name',
          key: (t) =>
            t.assignedEmployee?.fullName || t.assignedEmployeeSnapshot?.fullName || 'Unassigned',
        },
        {
          label: 'Assignee ID',
          key: (t) =>
            t.assignedEmployee?.employeeId || t.assignedEmployeeSnapshot?.employeeId || '',
        },
        {
          label: 'Start Date',
          key: (t) => (t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : ''),
        },
        {
          label: 'Due Date',
          key: (t) => (t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''),
        },
        {
          label: 'Completed Date',
          key: (t) => (t.completedDate ? new Date(t.completedDate).toISOString() : ''),
        },
        {
          label: 'Overdue',
          key: (t) => (t.isOverdue ? 'Yes' : 'No'),
        },
        {
          label: 'Created At',
          key: (t) => (t.createdAt ? new Date(t.createdAt).toISOString() : ''),
        },
      ];

      const csvContent = generateCsv(tasks, columns);

      const filename = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();
