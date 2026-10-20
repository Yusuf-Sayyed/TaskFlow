require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Employee } = require('../models/Employee');
const { Task } = require('../models/Task');
const Counter = require('../models/Counter');
const { getNextEmployeeId, getNextTaskId } = require('./idGenerator');

async function seedData() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Employee.deleteMany({}),
    Task.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  console.log('Seeding employees...');

  // Helper date generators
  const today = new Date();
  const pastDate = (days) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  const futureDate = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const emp1Id = await getNextEmployeeId();
  const emp1 = await Employee.create({
    employeeId: emp1Id,
    fullName: 'Sarah Jenkins',
    email: 'sarah.jenkins@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Development',
    role: 'Lead Full Stack Engineer',
    joiningDate: pastDate(365),
    status: 'Active',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
  });

  const emp2Id = await getNextEmployeeId();
  const emp2 = await Employee.create({
    employeeId: emp2Id,
    fullName: 'Michael Chen',
    email: 'michael.chen@company.com',
    phone: '+1 (555) 345-6789',
    department: 'Design',
    role: 'Senior UI/UX Designer',
    joiningDate: pastDate(280),
    status: 'Active',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
  });

  const emp3Id = await getNextEmployeeId();
  const emp3 = await Employee.create({
    employeeId: emp3Id,
    fullName: 'Elena Rostova',
    email: 'elena.rostova@company.com',
    phone: '+1 (555) 456-7890',
    department: 'QA',
    role: 'Senior QA Automation Engineer',
    joiningDate: pastDate(190),
    status: 'Active',
    skills: ['Cypress', 'Jest', 'API Testing', 'Vitest'],
  });

  const emp4Id = await getNextEmployeeId();
  const emp4 = await Employee.create({
    employeeId: emp4Id,
    fullName: 'David Adeleke',
    email: 'david.adeleke@company.com',
    phone: '+1 (555) 567-8901',
    department: 'HR',
    role: 'Talent Acquisition Partner',
    joiningDate: pastDate(420),
    status: 'On Leave',
    skills: ['Recruitment', 'People Ops', 'Onboarding'],
    leaveStartDate: pastDate(3),
    leaveEndDate: futureDate(7),
  });

  const emp5Id = await getNextEmployeeId();
  const emp5 = await Employee.create({
    employeeId: emp5Id,
    fullName: 'Rachel Green',
    email: 'rachel.green@company.com',
    phone: '+1 (555) 678-9012',
    department: 'Sales',
    role: 'Enterprise Account Executive',
    joiningDate: pastDate(150),
    status: 'Active',
    skills: ['B2B Sales', 'Negotiation', 'CRM Management'],
  });

  const emp6Id = await getNextEmployeeId();
  const emp6 = await Employee.create({
    employeeId: emp6Id,
    fullName: 'Alex Vance',
    email: 'alex.vance@company.com',
    phone: '+1 (555) 789-0123',
    department: 'Development',
    role: 'DevOps Specialist',
    joiningDate: pastDate(500),
    status: 'Inactive',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
  });

  console.log('Seeding tasks...');

  const tsk1Id = await getNextTaskId();
  await Task.create({
    taskId: tsk1Id,
    title: 'Migrate legacy auth to JWT with refresh tokens',
    description: 'Implement secure stateless authentication middleware with rotation.',
    department: 'Development',
    priority: 'Critical',
    status: 'In Progress',
    startDate: pastDate(5),
    dueDate: futureDate(2),
    assignedEmployee: emp1._id,
    assignedEmployeeSnapshot: {
      employeeId: emp1.employeeId,
      fullName: emp1.fullName,
      department: emp1.department,
      email: emp1.email,
      role: emp1.role,
    },
  });

  const tsk2Id = await getNextTaskId();
  await Task.create({
    taskId: tsk2Id,
    title: 'Redesign onboarding flow wireframes',
    description: 'Create high-fidelity interactive prototypes in Figma for new hire workspace.',
    department: 'Design',
    priority: 'High',
    status: 'Todo',
    startDate: today,
    dueDate: futureDate(5),
    assignedEmployee: emp2._id,
    assignedEmployeeSnapshot: {
      employeeId: emp2.employeeId,
      fullName: emp2.fullName,
      department: emp2.department,
      email: emp2.email,
      role: emp2.role,
    },
  });

  const tsk3Id = await getNextTaskId();
  await Task.create({
    taskId: tsk3Id,
    title: 'Automated regression suite for billing service',
    description: 'Add Cypress end-to-end tests for card processing and invoice generation.',
    department: 'QA',
    priority: 'High',
    status: 'In Progress',
    startDate: pastDate(10),
    dueDate: pastDate(2), // Overdue task!
    assignedEmployee: emp3._id,
    assignedEmployeeSnapshot: {
      employeeId: emp3.employeeId,
      fullName: emp3.fullName,
      department: emp3.department,
      email: emp3.email,
      role: emp3.role,
    },
  });

  const tsk4Id = await getNextTaskId();
  await Task.create({
    taskId: tsk4Id,
    title: 'Q3 Enterprise Client Product Demo Prep',
    description: 'Prepare tailored slide decks and live demo environment for Fortune 500 prospect.',
    department: 'Sales',
    priority: 'Medium',
    status: 'Completed',
    startDate: pastDate(15),
    dueDate: pastDate(5),
    completedDate: pastDate(4),
    assignedEmployee: emp5._id,
    assignedEmployeeSnapshot: {
      employeeId: emp5.employeeId,
      fullName: emp5.fullName,
      department: emp5.department,
      email: emp5.email,
      role: emp5.role,
    },
  });

  const tsk5Id = await getNextTaskId();
  await Task.create({
    taskId: tsk5Id,
    title: 'Legacy Redis cache configuration review',
    description: 'Deprecated after migration to Memcached cluster.',
    department: 'Development',
    priority: 'Low',
    status: 'Cancelled',
    startDate: pastDate(30),
    dueDate: pastDate(20),
    assignedEmployee: emp1._id,
    assignedEmployeeSnapshot: {
      employeeId: emp1.employeeId,
      fullName: emp1.fullName,
      department: emp1.department,
      email: emp1.email,
      role: emp1.role,
    },
  });

  const tsk6Id = await getNextTaskId();
  await Task.create({
    taskId: tsk6Id,
    title: 'Database connection pooling audit',
    description: 'Verify connection leaks under high concurrent query loads.',
    department: 'Development',
    priority: 'Medium',
    status: 'Todo',
    startDate: today,
    dueDate: futureDate(10),
    assignedEmployee: emp1._id,
    assignedEmployeeSnapshot: {
      employeeId: emp1.employeeId,
      fullName: emp1.fullName,
      department: emp1.department,
      email: emp1.email,
      role: emp1.role,
    },
  });

  console.log('Seeding completed successfully!');
  await mongoose.connection.close();
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
