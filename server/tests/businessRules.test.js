const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { Employee } = require('../src/models/Employee');
const { Task } = require('../src/models/Task');
const Counter = require('../src/models/Counter');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    Employee.deleteMany({}),
    Task.deleteMany({}),
    Counter.deleteMany({}),
  ]);
});

describe('MERN Assessment - 23 Mandatory Business Rules & API Specifications', () => {
  // 1. Successful employee creation
  it('1. should successfully create an employee with server-generated employeeId', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({
        fullName: 'Jane Doe',
        email: 'Jane.Doe@example.com',
        phone: '1234567890',
        department: 'Development',
        role: 'Software Engineer',
        joiningDate: '2025-01-15',
        status: 'Active',
        skills: ['React', 'Node.js'],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.employeeId).toBe('EMP-0001');
    expect(res.body.data.email).toBe('jane.doe@example.com'); // normalized
    expect(res.body.data.fullName).toBe('Jane Doe');
  });

  // 2. Duplicate normalized email rejection
  it('2. should reject duplicate email addresses after normalization with 409 Conflict', async () => {
    await request(app).post('/api/employees').send({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      department: 'Design',
      role: 'UI Designer',
      joiningDate: '2025-01-01',
      status: 'Active',
    });

    const res = await request(app).post('/api/employees').send({
      fullName: 'Alice Clone',
      email: '  ALICE@example.com  ', // same email with caps and whitespace
      department: 'Design',
      role: 'UI Designer',
      joiningDate: '2025-02-01',
      status: 'Active',
    });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toMatch(/already exists/i);
  });

  // 3. Invalid employee data rejection
  it('3. should reject invalid employee data with 400 Bad Request', async () => {
    // Missing required fields
    const res1 = await request(app).post('/api/employees').send({
      fullName: '',
      email: 'invalid-email',
      department: 'NonExistentDept',
    });
    expect(res1.status).toBe(400);

    // On leave without leave dates
    const res2 = await request(app).post('/api/employees').send({
      fullName: 'Bob OnLeave',
      email: 'bob@example.com',
      department: 'QA',
      role: 'QA Engineer',
      joiningDate: '2025-01-01',
      status: 'On Leave',
    });
    expect(res2.status).toBe(400);
    expect(res2.body.message).toMatch(/validation failed/i);

    // On leave with end date before start date
    const res3 = await request(app).post('/api/employees').send({
      fullName: 'Charlie BadDates',
      email: 'charlie@example.com',
      department: 'HR',
      role: 'HR Specialist',
      joiningDate: '2025-01-01',
      status: 'On Leave',
      leaveStartDate: '2026-10-15',
      leaveEndDate: '2026-10-10',
    });
    expect(res3.status).toBe(400);
  });

  // 4. Successful task creation with an Active employee
  it('4. should successfully create a task with an Active employee', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Active Worker',
      email: 'worker@example.com',
      department: 'Development',
      role: 'Dev',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const employeeId = empRes.body.data._id;

    const res = await request(app).post('/api/tasks').send({
      title: 'Build Login API',
      description: 'Implement JWT auth',
      department: 'Development',
      priority: 'High',
      startDate: '2026-10-25',
      dueDate: '2026-10-30',
      assignedEmployee: employeeId,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.taskId).toBe('TSK-0001');
    expect(res.body.data.status).toBe('Todo');
    expect(res.body.data.assignedEmployeeSnapshot.fullName).toBe('Active Worker');
  });

  // 5. Rejection of assignment to an Inactive employee
  it('5. should reject assignment to an Inactive employee with 400', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Inactive User',
      email: 'inactive@example.com',
      department: 'Development',
      role: 'Dev',
      joiningDate: '2025-01-01',
      status: 'Inactive',
    });
    const employeeId = empRes.body.data._id;

    const res = await request(app).post('/api/tasks').send({
      title: 'Some Task',
      department: 'Development',
      startDate: '2026-10-25',
      dueDate: '2026-10-30',
      assignedEmployee: employeeId,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Inactive/i);
  });

  // 6. Rejection of assignment during an applicable leave period, including boundary dates
  it('6. should reject task assignment when task startDate falls within leave period (inclusive boundary)', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Vacationer',
      email: 'vacation@example.com',
      department: 'Design',
      role: 'Designer',
      joiningDate: '2025-01-01',
      status: 'On Leave',
      leaveStartDate: '2026-11-01',
      leaveEndDate: '2026-11-10',
    });
    const employeeId = empRes.body.data._id;

    // Start date exactly on leaveStartDate boundary (2026-11-01)
    const resStartBoundary = await request(app).post('/api/tasks').send({
      title: 'Boundary Start Task',
      department: 'Design',
      startDate: '2026-11-01',
      dueDate: '2026-11-15',
      assignedEmployee: employeeId,
    });
    expect(resStartBoundary.status).toBe(400);
    expect(resStartBoundary.body.message).toMatch(/On Leave/i);

    // Start date exactly on leaveEndDate boundary (2026-11-10)
    const resEndBoundary = await request(app).post('/api/tasks').send({
      title: 'Boundary End Task',
      department: 'Design',
      startDate: '2026-11-10',
      dueDate: '2026-11-15',
      assignedEmployee: employeeId,
    });
    expect(resEndBoundary.status).toBe(400);
    expect(resEndBoundary.body.message).toMatch(/On Leave/i);

    // Start date inside leave period (2026-11-05)
    const resInside = await request(app).post('/api/tasks').send({
      title: 'Inside Leave Task',
      department: 'Design',
      startDate: '2026-11-05',
      dueDate: '2026-11-15',
      assignedEmployee: employeeId,
    });
    expect(resInside.status).toBe(400);
  });

  // 7. Acceptance when the task starts outside the leave period, subject to Active status requirement
  it('7. should accept assignment when task starts outside leave period for an Active employee', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Active Worker With Leave Plan',
      email: 'active.leave@example.com',
      department: 'QA',
      role: 'QA Engineer',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const employeeId = empRes.body.data._id;

    const res = await request(app).post('/api/tasks').send({
      title: 'Task Outside Leave',
      department: 'QA',
      startDate: '2026-11-15',
      dueDate: '2026-11-20',
      assignedEmployee: employeeId,
    });

    expect(res.status).toBe(201);
  });

  // 8. Rejection when due date precedes start date
  it('8. should reject when due date precedes start date with 400', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Backwards Dates Task',
      department: 'Development',
      startDate: '2026-11-20',
      dueDate: '2026-11-10', // earlier!
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be earlier than start date/i);
  });

  // 9. Rejection of invalid task status transitions
  it('9. should reject invalid task status transitions', async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Transition Test',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const taskId = taskRes.body.data._id;

    // Direct Todo -> Completed is INVALID (must go through In Progress)
    const invalidRes = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'Completed' });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.message).toMatch(/Invalid status transition/i);
  });

  // 10. Successful Todo -> In Progress transition
  it('10. should successfully transition Todo -> In Progress', async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Progress Test',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const taskId = taskRes.body.data._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('In Progress');
  });

  // 11. Successful In Progress -> Completed transition
  it('11. should successfully transition In Progress -> Completed and set completedDate', async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Completion Test',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    const res = await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');
    expect(res.body.data.completedDate).toBeTruthy();
  });

  // 12. Successful Todo -> Cancelled transition
  it('12. should successfully transition Todo -> Cancelled', async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Cancel from Todo',
      department: 'HR',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const taskId = taskRes.body.data._id;

    const res = await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
  });

  // 13. Successful In Progress -> Cancelled transition
  it('13. should successfully transition In Progress -> Cancelled', async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Cancel from In Progress',
      department: 'Sales',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    const res = await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
  });

  // 14. Rejection of edits to Completed or Cancelled tasks
  it('14. should reject edits and reopening of Completed or Cancelled tasks', async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Immutable Task',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    // Attempting PUT /api/tasks/:id
    const editRes = await request(app).put(`/api/tasks/${taskId}`).send({ title: 'New Title' });
    expect(editRes.status).toBe(400);
    expect(editRes.body.message).toMatch(/immutable/i);

    // Attempting status transition from Completed to anything
    const reopenRes = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'In Progress' });
    expect(reopenRes.status).toBe(400);
    expect(reopenRes.body.message).toMatch(/cannot be reopened/i);
  });

  // 15. Server-generated completion date
  it('15. should enforce that completedDate is strictly server-generated', async () => {
    const fakeClientDate = '2020-01-01T00:00:00.000Z';
    // Reject on create
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Client Date Task',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
      completedDate: fakeClientDate,
    });
    expect(createRes.status).toBe(400);

    // Reject on update
    const normalTask = await request(app).post('/api/tasks').send({
      title: 'Normal Task',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
    });
    const editRes = await request(app)
      .put(`/api/tasks/${normalTask.body.data._id}`)
      .send({ completedDate: fakeClientDate });
    expect(editRes.status).toBe(400);
  });

  // 16. Enforcement of the three-active-task capacity limit
  it('16. should enforce the maximum 3 active tasks capacity limit with 409 Conflict', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Busy Worker',
      email: 'busy@example.com',
      department: 'Development',
      role: 'Dev',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const empId = empRes.body.data._id;

    // Assign 3 active tasks (Todo/In Progress)
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).post('/api/tasks').send({
        title: `Task #${i}`,
        department: 'Development',
        startDate: '2026-11-01',
        dueDate: '2026-11-05',
        assignedEmployee: empId,
      });
      expect(res.status).toBe(201);
    }

    // 4th task should be rejected with 409
    const fourthTaskRes = await request(app).post('/api/tasks').send({
      title: 'Task #4 (Over Capacity)',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
      assignedEmployee: empId,
    });

    expect(fourthTaskRes.status).toBe(409);
    expect(fourthTaskRes.body.message).toMatch(/maximum capacity of 3 active tasks/i);
  });

  // 17. Correct capacity calculation when changing assignees
  it('17. should correctly calculate capacity when changing assignees or editing existing tasks', async () => {
    const empRes1 = await request(app).post('/api/employees').send({
      fullName: 'Dev One',
      email: 'dev1@example.com',
      department: 'Development',
      role: 'Dev',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const empRes2 = await request(app).post('/api/employees').send({
      fullName: 'Dev Two',
      email: 'dev2@example.com',
      department: 'Development',
      role: 'Dev',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const dev1Id = empRes1.body.data._id;
    const dev2Id = empRes2.body.data._id;

    // Give Dev1 3 tasks
    let taskToMoveId;
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).post('/api/tasks').send({
        title: `Dev1 Task ${i}`,
        department: 'Development',
        startDate: '2026-11-01',
        dueDate: '2026-11-05',
        assignedEmployee: dev1Id,
      });
      if (i === 1) taskToMoveId = res.body.data._id;
    }

    // Editing Dev1's task (keeping assignee as Dev1) should NOT trigger 409
    const selfEditRes = await request(app)
      .put(`/api/tasks/${taskToMoveId}`)
      .send({ title: 'Updated Title Same Assignee' });
    expect(selfEditRes.status).toBe(200);

    // Give Dev2 3 tasks
    for (let i = 1; i <= 3; i++) {
      await request(app).post('/api/tasks').send({
        title: `Dev2 Task ${i}`,
        department: 'Development',
        startDate: '2026-11-01',
        dueDate: '2026-11-05',
        assignedEmployee: dev2Id,
      });
    }

    // Moving taskToMoveId to Dev2 should fail with 409 because Dev2 is full
    const moveFailRes = await request(app)
      .put(`/api/tasks/${taskToMoveId}`)
      .send({ assignedEmployee: dev2Id });
    expect(moveFailRes.status).toBe(409);
  });

  // 18. Rejection of employee deletion with Todo or In Progress tasks
  it('18. should reject employee deletion if employee has Todo or In Progress tasks with 409', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Mark Active',
      email: 'mark@example.com',
      department: 'Development',
      role: 'Dev',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const empId = empRes.body.data._id;

    await request(app).post('/api/tasks').send({
      title: 'Active Task for Mark',
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-05',
      assignedEmployee: empId,
    });

    const delRes = await request(app).delete(`/api/employees/${empId}`);
    expect(delRes.status).toBe(409);
    expect(delRes.body.message).toMatch(/Cannot delete employee/i);
  });

  // 19. Preservation of historical employee information after permitted deletion
  it('19. should allow employee deletion when only Completed/Cancelled tasks exist, preserving historical snapshot', async () => {
    const empRes = await request(app).post('/api/employees').send({
      fullName: 'Historical Person',
      email: 'historical@example.com',
      department: 'HR',
      role: 'HR Lead',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const empId = empRes.body.data._id;

    const taskRes = await request(app).post('/api/tasks').send({
      title: 'Historical Task',
      department: 'HR',
      startDate: '2026-10-01',
      dueDate: '2026-10-05',
      assignedEmployee: empId,
    });
    const taskId = taskRes.body.data._id;

    // Transition task to Completed
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    // Now deleting employee should succeed
    const delRes = await request(app).delete(`/api/employees/${empId}`);
    expect(delRes.status).toBe(200);

    // Fetching the historical task should still display snapshot details
    const fetchedTask = await request(app).get(`/api/tasks/${taskId}`);
    expect(fetchedTask.status).toBe(200);
    expect(fetchedTask.body.data.assignedEmployeeSnapshot.fullName).toBe('Historical Person');
    expect(fetchedTask.body.data.assignedEmployeeSnapshot.department).toBe('HR');
  });

  // 20. Correct overdue calculation, including due-date boundaries and excluded statuses
  it('20. should calculate overdue correctly respecting boundaries and excluded statuses', async () => {
    const pastDate = '2020-01-01';
    const futureDate = '2030-01-01';

    // Overdue Todo task
    const t1 = await request(app).post('/api/tasks').send({
      title: 'Overdue Todo',
      department: 'Sales',
      startDate: '2019-12-01',
      dueDate: pastDate,
    });
    const t1Data = await request(app).get(`/api/tasks/${t1.body.data._id}`);
    expect(t1Data.body.data.isOverdue).toBe(true);

    // Non-overdue Future Todo task
    const t2 = await request(app).post('/api/tasks').send({
      title: 'Future Task',
      department: 'Sales',
      startDate: '2026-10-01',
      dueDate: futureDate,
    });
    const t2Data = await request(app).get(`/api/tasks/${t2.body.data._id}`);
    expect(t2Data.body.data.isOverdue).toBe(false);

    // Completed task with past dueDate should NOT be overdue
    const t3 = await request(app).post('/api/tasks').send({
      title: 'Completed Past Task',
      department: 'Sales',
      startDate: '2019-12-01',
      dueDate: pastDate,
    });
    await request(app).put(`/api/tasks/${t3.body.data._id}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${t3.body.data._id}/status`).send({ status: 'Completed' });

    const t3Data = await request(app).get(`/api/tasks/${t3.body.data._id}`);
    expect(t3Data.body.data.isOverdue).toBe(false);
  });

  // 21. Server-side filtering, sorting, and pagination
  it('21. should support server-side search, department filter, priority sort, and pagination', async () => {
    // Seed 3 tasks
    await request(app).post('/api/tasks').send({
      title: 'Alpha Design Task',
      department: 'Design',
      priority: 'Low',
      startDate: '2026-10-01',
      dueDate: '2026-10-10',
    });
    await request(app).post('/api/tasks').send({
      title: 'Beta Dev Task',
      department: 'Development',
      priority: 'Critical',
      startDate: '2026-10-01',
      dueDate: '2026-10-10',
    });
    await request(app).post('/api/tasks').send({
      title: 'Gamma Dev Task',
      department: 'Development',
      priority: 'Medium',
      startDate: '2026-10-01',
      dueDate: '2026-10-10',
    });

    // Test filter department=Development
    const devFilter = await request(app).get('/api/tasks?department=Development');
    expect(devFilter.body.total).toBe(2);

    // Test priority sorting (desc -> Critical first)
    const prioSorted = await request(app).get('/api/tasks?sortBy=priority&sortOrder=desc');
    expect(prioSorted.body.data[0].priority).toBe('Critical');

    // Test pagination
    const paginated = await request(app).get('/api/tasks?page=1&limit=2');
    expect(paginated.body.data.length).toBe(2);
    expect(paginated.body.totalPages).toBe(2);
  });

  // 22. CSV exports containing all matching records across pages
  it('22. should export all matching records across pages with CSV formatting and formula injection prevention', async () => {
    await request(app).post('/api/tasks').send({
      title: '=HYPERLINK("malicious.com")', // formula injection attempt
      department: 'QA',
      startDate: '2026-10-01',
      dueDate: '2026-10-10',
    });
    await request(app).post('/api/tasks').send({
      title: 'Normal QA Task',
      department: 'QA',
      startDate: '2026-10-01',
      dueDate: '2026-10-10',
    });

    const exportRes = await request(app).get('/api/tasks/export?department=QA');
    expect(exportRes.status).toBe(200);
    expect(exportRes.headers['content-type']).toMatch(/text\/csv/);
    expect(exportRes.text).toContain("'=HYPERLINK"); // Formula sanitized with single quote!
    expect(exportRes.text).toContain('Normal QA Task');
  });

  // 23. Proper 400, 404, and 409 error responses
  it('23. should return proper 400, 404, and 409 status codes and consistent JSON format', async () => {
    // 404
    const notFoundRes = await request(app).get('/api/employees/64b1f234567890abcdef1234');
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.status).toBe('fail');

    // 400
    const badReqRes = await request(app).post('/api/employees').send({});
    expect(badReqRes.status).toBe(400);
    expect(badReqRes.body.status).toBe('fail');

    // 409
    const emp = await request(app).post('/api/employees').send({
      fullName: 'Test Unique',
      email: 'unique@example.com',
      department: 'HR',
      role: 'Staff',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    const dupRes = await request(app).post('/api/employees').send({
      fullName: 'Test Duplicate',
      email: 'unique@example.com',
      department: 'HR',
      role: 'Staff',
      joiningDate: '2025-01-01',
      status: 'Active',
    });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.status).toBe('fail');
  });
});
