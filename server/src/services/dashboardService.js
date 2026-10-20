const { Employee } = require('../models/Employee');
const { Task } = require('../models/Task');
const { toDayString } = require('../utils/dateUtils');

class DashboardService {
  async getDashboardStats() {
    const todayStr = toDayString(new Date());
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      inactiveEmployees,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      overdueTasks,
      recentTasks,
      tasksByDepartment,
      tasksByPriority,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ status: 'On Leave' }),
      Employee.countDocuments({ status: 'Inactive' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Todo' }),
      Task.countDocuments({ status: 'In Progress' }),
      Task.countDocuments({ status: 'Completed' }),
      Task.countDocuments({ status: 'Cancelled' }),
      // Rule 6: Overdue when dueDate < current date and status is not Completed or Cancelled
      Task.countDocuments({
        dueDate: { $lt: todayDate },
        status: { $nin: ['Completed', 'Cancelled'] },
      }),
      Task.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedEmployee'),
      Task.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      inactiveEmployees,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      overdueTasks,
      recentTasks,
      tasksByDepartment,
      tasksByPriority,
    };
  }
}

module.exports = new DashboardService();
