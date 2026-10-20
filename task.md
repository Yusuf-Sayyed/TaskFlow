# MASTER PROMPT — MERN Stack Developer Assessment
## Employee & Task Management System

Act as a senior full-stack MERN developer. Build a complete, production-quality Employee & Task Management System that satisfies every requirement below.

This is a technical assessment. The evaluator will inspect the UI, test API endpoints, verify business rules, examine code quality, and read the README. **Do not build only a frontend prototype. Every feature must work end to end.**

## 1. Technology Stack

Use the following technologies:

- **Frontend:** React, Vite, JavaScript or TypeScript, React Router, Tailwind CSS, and a suitable icon library.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB with Mongoose.
- **Validation:** Shared, consistent validation rules across frontend and backend where appropriate.
- **API:** RESTful JSON APIs.
- **Testing:** Automated tests for important business rules and API endpoints.
- **Deployment:** Netlify or Vercel for frontend and a suitable Node.js hosting provider for backend. MongoDB Atlas for the database.

You may use a suitable UI component library if it improves consistency. Do not introduce unnecessary technologies or excessive dependencies.

First inspect the existing repository, installed dependencies, project structure, and supplied design screenshots. Reuse existing code when appropriate. Do not overwrite working code blindly.

If the repository is empty, initialize the complete project.

## 2. Application Overview

Build an Employee & Task Management System for managing employees and their assigned tasks.

The application must support:

- Employee creation, listing, viewing, editing, and deletion.
- Task creation, listing, viewing, editing, and deletion.
- Task status transitions enforced by the backend.
- Employee assignment and availability validation.
- Search, filtering, sorting, pagination, and URL-persisted state.
- Dashboard statistics.
- CSV exports.
- Responsive design.
- Clear loading, empty, success, and error states.

No login or authentication is required. Do not add authentication screens.

Departments must be restricted to:

- Development
- Design
- QA
- HR
- Sales

## 3. Database Models

Design proper Mongoose schemas with timestamps, indexes where appropriate, validation, and consistent relationships.

### A. Employee

Fields:

- `employeeId`: automatically generated unique identifier.
- `fullName`: required.
- `email`: required, normalized to lowercase, trimmed, and unique.
- `phone`: employee phone number.
- `department`: one of the five permitted departments.
- `role`: employee's job role.
- `joiningDate`: required joining date.
- `status`: Active, Inactive, or On Leave.
- `skills`: array of skills.
- `leaveStartDate`: applicable when the employee is On Leave.
- `leaveEndDate`: applicable when the employee is On Leave.
- `createdAt` and `updatedAt`.

Requirements:

1. Generate employee IDs on the server. Never trust an employee ID supplied by the client.
2. Enforce unique email addresses after normalization.
3. Validate required fields, date values, department, and status.
4. If an employee is On Leave, validate that both leave dates exist and that the end date is not earlier than the start date.
5. Do not allow invalid or inconsistent employee records.
6. Handle duplicate employee IDs and email addresses with appropriate HTTP 409 responses.

### B. Task

Fields:

- `taskId`: automatically generated unique identifier.
- `title`: required task title.
- `description`: task description.
- `assignedEmployee`: reference to an Employee document.
- `department`: task department.
- `priority`: Low, Medium, High, or Critical.
- `status`: Todo, In Progress, Completed, or Cancelled.
- `startDate`: task start date.
- `dueDate`: task deadline.
- `createdAt`: server-generated creation date.
- `completedDate`: server-generated completion date, set only when the task becomes Completed.

Add appropriate indexes to support task listing, filtering, and sorting.

Use proper MongoDB references and populate employee information where necessary. Do not hardcode mock data into the application.

## 4. Mandatory Backend Business Rules

These rules are critical. Implement them in the backend service/business logic layer and verify them through tests. Frontend validation alone is insufficient.

### Rule 1: Employee assignment

- A task can only be assigned to an employee whose status is Active.
- Assigning a task to an Inactive employee must be rejected.
- Assigning a task to an employee who is On Leave must be rejected when the task's `startDate` falls within the employee's leave period.
- The leave-period comparison is inclusive of both `leaveStartDate` and `leaveEndDate`.
- If the task starts outside the leave period, the leave-period rule alone does not reject the assignment, provided the employee is Active.
- Revalidate assignment when creating a task, changing its assignee, or changing a task's start date.
- Return HTTP 400 for invalid assignment data and a suitable business-rule error for an unavailable employee. Use consistent error handling.

### Rule 2: Date validation

- `dueDate` must not be earlier than `startDate`.
- Apply the rule when creating a task and updating its dates.
- Reject invalid dates on the backend even if the frontend already validates them.

### Rule 3: Allowed task status transitions

Implement exactly the following transitions:

| Current status | Allowed next status |
|---|---|
| Todo | In Progress, Cancelled |
| In Progress | Completed, Cancelled |
| Completed | None |
| Cancelled | None |

Additional requirements:

- New tasks must always start with `Todo`.
- Ignore or reject any attempt to create a task with another initial status.
- The only way to change task status is through `PUT /api/tasks/:id/status`.
- Status changes through the normal task update endpoint must be rejected.
- Completed tasks cannot be edited.
- Cancelled tasks cannot be edited.
- Attempts to reopen Completed or Cancelled tasks must be rejected.
- Invalid status transitions must return HTTP 400 with a clear explanation.
- A missing task must return HTTP 404.

### Rule 4: Completion date

- When a task transitions from In Progress to Completed, set `completedDate` on the server.
- The client must never determine or submit the authoritative completion date.
- Never accept a client-supplied `completedDate`.
- Tasks that have not reached Completed must not have a completion date.
- Preserve the completion date after completion; completed tasks cannot be edited or reopened.

### Rule 5: Employee task capacity

- An employee can hold at most three tasks whose status is either Todo or In Progress.
- Check the current count on the server before assigning or creating a task.
- Reject any operation that would cause the employee to exceed this limit.
- When changing an assignee, account for the task being moved so that it is not counted twice.
- Completed and Cancelled tasks do not count toward capacity.
- Return HTTP 409 when the capacity limit is exceeded.
- Protect this rule against concurrent requests as far as the chosen database design allows. Explain any remaining concurrency limitations in the README.

### Rule 6: Overdue tasks

A task is overdue when:

- Its due date is earlier than the current date; and
- Its status is not Completed or Cancelled.

Implement this definition consistently in task lists, task details, dashboard statistics, and CSV exports.

Use one documented date and timezone convention throughout the application. For date-only task deadlines, avoid incorrectly marking a task overdue merely because the current time is later than midnight on its due date.

### Rule 7: Employee deletion

- Do not allow an employee to be deleted if they have any Todo or In Progress tasks.
- Return HTTP 409 with a helpful message explaining why deletion is blocked.
- Employees with only Completed or Cancelled tasks may be deleted.
- Historical tasks must continue to display meaningful employee details after employee deletion.
- Preserve the employee's relevant historical information, including name, employee ID, and department, using a consistent snapshot or archival strategy.
- Do not leave broken references or display `[object Object]`, blank assignee names, or unexplained missing employee data.
- Document the deletion strategy in the README.

## 5. Required Backend API

Implement a clean REST API with controllers, routes, services, models, validation middleware, and centralized error handling.

### Employee endpoints

- `POST /api/employees` — Create an employee.
- `GET /api/employees` — List employees with pagination, search, filters, and sorting.
- `GET /api/employees/:id` — Retrieve one employee.
- `PUT /api/employees/:id` — Update an employee.
- `DELETE /api/employees/:id` — Delete an employee subject to business rules.

Employee listing must support searching by name and employee ID, filtering by department and status, sorting, and pagination.

Normalize email before checking uniqueness. Handle MongoDB duplicate-key errors correctly.

### Task endpoints

- `POST /api/tasks` — Create a task with initial status Todo.
- `GET /api/tasks` — List tasks with pagination, search, filters, sorting, and populated or snapshotted employee information.
- `GET /api/tasks/:id` — Retrieve one task.
- `PUT /api/tasks/:id` — Update permitted task fields, excluding status and completion date.
- `DELETE /api/tasks/:id` — Delete a task according to documented rules.
- `PUT /api/tasks/:id/status` — Perform an explicitly permitted status transition.

The normal task update endpoint must enforce all relevant validation, including employee availability, capacity, task date validity, and immutable fields.

For task deletion, document a clear policy. At minimum, reject deletion of Completed and Cancelled tasks because those records are immutable. Ensure any additional restrictions are applied consistently and documented.

### Dashboard endpoint

Implement:

`GET /api/dashboard/stats`

Return server-calculated statistics, including:

- Total employees.
- Active employees.
- Employees on leave.
- Total tasks.
- Todo tasks.
- In Progress tasks.
- Completed tasks.
- Cancelled tasks.
- Overdue tasks.

The dashboard must use real database data, not hardcoded numbers.

### CSV export endpoints

Implement:

- `GET /api/tasks/export`
- `GET /api/employees/export`

Task exports must respect the same search, filter, and sort parameters as the corresponding task list, but export all matching records rather than only the current page.

Employee exports should similarly respect the applicable search, filters, and sorting.

Generate valid CSV files with appropriate content types and download headers. Properly escape commas, quotes, and line breaks. Prevent spreadsheet formula injection for untrusted cell values.

### API requirements

- Use proper HTTP status codes.
- Validate route parameters, request bodies, and query parameters.
- Return consistent JSON error responses.
- Use 400 for invalid input, 404 for missing records, 409 for conflicts, and 500 for unexpected server errors.
- Never expose stack traces or sensitive environment variables in production responses.
- Add health-check and database connection handling where appropriate.
- Handle empty result sets gracefully.
- Never fetch every database record and perform all filtering in React.

## 6. Search, Filters, Sorting, and Pagination

Implement these features on the server and expose them through query parameters.

### Task filters

Support:

- Task title.
- Employee name and employee ID.
- Department.
- Priority.
- Status.
- Due date.
- Created date.

Support appropriate date-range filtering for dates.

### Employee filters

Support:

- Name.
- Employee ID.
- Department.
- Status.

### Sorting

Support relevant sortable fields, including:

- Created date.
- Due date.
- Priority.
- Title.
- Employee name.
- Employee joining date.

Use an explicit, documented priority ordering instead of assuming alphabetical sorting gives the correct business order.

Whitelist sortable fields and valid sort directions to prevent unsafe database queries.

### Pagination

Support query parameters such as:

`page`, `limit`, `search`, `status`, `priority`, `department`, `sortBy`, and `sortOrder`.

Return a consistent response structure containing the records and pagination metadata, such as:

- `data`
- `page`
- `limit`
- `total`
- `totalPages`

Use the actual selected parameter names consistently across the application.

### URL state persistence

The frontend URL must preserve search, filters, sorting, and pagination.

Example:

`/tasks?status=In%20Progress&priority=High&page=2`

Requirements:

- Update the URL when the user changes filters, search, sort order, or page.
- Restore the same state when a URL is opened directly or refreshed.
- Keep the URL and visible controls synchronized.
- Use debouncing for text search.
- Reset pagination when a filter changes if the current page is no longer valid.
- Ensure copied URLs reproduce the same result set.

## 7. Frontend Pages and Navigation

Create a complete responsive application with multiple routes.

### A. Dashboard

Show:

- Summary cards for employee and task statistics.
- Task status distribution.
- Overdue task count.
- Recent tasks.
- Useful quick actions.
- Clear visual indicators for priorities and statuses.

All statistics must come from the backend.

### B. Employee List

Include:

- Searchable employee table.
- Employee ID and name.
- Email and phone.
- Department and role.
- Status.
- Joining date.
- Skills.
- Add employee action.
- Edit, view, and delete actions.
- Filters, sorting, pagination, and CSV export.

### C. Employee Add/Edit Form

Include all employee fields, appropriate validation, accessible labels, helpful error messages, and conditional leave-date fields when status is On Leave.

Show duplicate-email and other server validation errors clearly.

### D. Employee Details

Show employee information, employment status, skills, leave dates when applicable, and assigned task history.

Clearly distinguish active tasks from completed and cancelled historical tasks.

### E. Task List

Include:

- Search.
- Department, priority, status, due-date, and created-date filters.
- Sort controls.
- Pagination.
- CSV export.
- Add, view, edit, and delete actions where permitted.
- Priority and status indicators.
- Assignee information.
- Due dates.
- Overdue indicators.
- Loading, empty, and error states.

The status dropdown must only show valid next statuses for the task's current status. Never offer invalid transitions.

Completed and Cancelled tasks must appear read-only, with edit and prohibited transition actions disabled or hidden appropriately.

### F. Task Add/Edit Form

Include:

- Title.
- Description.
- Department.
- Priority.
- Assigned employee.
- Start date.
- Due date.

Requirements:

- New tasks begin as Todo.
- Employee options must reflect employee availability.
- Show employee availability and capacity information when useful.
- Validate date order.
- Handle backend assignment and capacity errors.
- Do not expose editable status or completion-date fields.
- Make completed and cancelled tasks read-only.

### G. Task Details

Display the complete task information, assignee details, status, priority, start date, due date, creation date, and completion date when applicable.

Show available status transitions based on the current status and explain why an operation cannot be performed when appropriate.

## 8. UI/UX and Design Quality

Use the supplied assessment screenshots as a reference for the intended application structure and visual direction. They show a specification rather than a fully designed UI, so create a polished, professional admin dashboard consistent with that purpose.

Design requirements:

- Clean, modern SaaS interface.
- Responsive sidebar navigation and header.
- Well-structured data tables.
- Consistent spacing, typography, borders, and colors.
- Appropriate status badges and priority indicators.
- Professional forms with inline validation.
- Accessible buttons, inputs, labels, and keyboard navigation.
- Responsive layouts for mobile, tablet, and desktop.
- Confirmation dialogs for destructive operations.
- Toast notifications for success and failure.
- Loading indicators or skeletons.
- Helpful empty states and retry options.
- No horizontal overflow on mobile.
- No broken layouts, placeholder buttons, or dead links.

Do not spend time reproducing decorative details at the expense of functional requirements.

## 9. Reusable Components and Code Structure

Build reusable components rather than duplicating code.

Examples:

- Application layout.
- Sidebar and header.
- Data table.
- Search and filter toolbar.
- Pagination controls.
- Status badge.
- Priority badge.
- Form fields.
- Confirmation dialog.
- Toast notification system.
- Loading state.
- Empty state.
- Error state.

Suggested structure:

```text
project/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── employees/
│   │   │   ├── tasks/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── README.md
├── .env.example
└── .gitignore
```

Adapt the structure as needed, but maintain a clear separation between frontend and backend.

Keep business rules in reusable backend services rather than embedding them exclusively in controllers or UI components.

Avoid giant components, duplicated business logic, inline styling scattered throughout the application, unused files, and inconsistent naming.

## 10. Security and Reliability

- Store configuration in environment variables.
- Include `.env.example` with placeholders only.
- Never commit credentials, API keys, database passwords, or real secrets.
- Configure CORS for the deployed frontend.
- Use request-body validation and safe query construction.
- Prevent mass assignment by explicitly allowing editable fields.
- Never allow the frontend to override generated IDs, creation timestamps, status transitions, or completion dates.
- Add sensible request limits and JSON parsing limits.
- Handle MongoDB connection failures and server shutdown gracefully.
- Avoid leaking internal errors to clients.
- Keep frontend and backend error handling consistent.

## 11. Testing Requirements

Write automated tests for the most important business rules and endpoints.

At minimum, test the following:

1. Successful employee creation.
2. Duplicate normalized email rejection.
3. Invalid employee data rejection.
4. Successful task creation with an Active employee.
5. Rejection of assignment to an Inactive employee.
6. Rejection of assignment during an applicable leave period, including the boundary dates.
7. Acceptance when the task starts outside the leave period, subject to the Active status requirement.
8. Rejection when due date precedes start date.
9. Rejection of invalid task status transitions.
10. Successful Todo → In Progress transition.
11. Successful In Progress → Completed transition.
12. Successful Todo → Cancelled transition.
13. Successful In Progress → Cancelled transition.
14. Rejection of edits to Completed or Cancelled tasks.
15. Server-generated completion date.
16. Enforcement of the three-active-task capacity limit.
17. Correct capacity calculation when changing assignees.
18. Rejection of employee deletion with Todo or In Progress tasks.
19. Preservation of historical employee information after permitted deletion.
20. Correct overdue calculation, including due-date boundaries and excluded statuses.
21. Server-side filtering, sorting, and pagination.
22. CSV exports containing all matching records across pages.
23. Proper 400, 404, and 409 error responses.

Use an isolated test database and ensure tests do not damage production or development data.

## 12. README Requirements

Write a complete `README.md` containing:

### Project overview
Explain the application and its main features.

### Technology stack
List the technologies and important dependencies.

### Prerequisites
Explain required Node.js, npm, and MongoDB setup.

### Installation
Provide exact commands to install dependencies and run the frontend and backend.

### Environment variables
Document every required environment variable, including MongoDB connection string, server port, frontend API URL, and CORS configuration as applicable.

### API documentation
Document endpoints, HTTP methods, required fields, query parameters, example requests, successful responses, and important error responses.

### Business-rule explanations
Explain:

1. Assignment validation and leave-period boundaries.
2. Allowed status transitions.
3. Server-generated completion dates.
4. Active-task capacity.
5. Overdue calculation and timezone conventions.
6. Employee deletion and preservation of historical employee details.
7. Task deletion policy.
8. Validation and error-handling strategy.

### Search and filtering
Explain the URL query parameters and how filters, sorting, and pagination work.

### CSV export
Explain which filters are supported and why exports include all matching records instead of only the visible page.

### Testing
Provide commands for running automated tests.

### Deployment
Explain how to deploy the frontend, backend, and database, including CORS and environment configuration.

### Assumptions and trade-offs
Document any assumptions, concurrency limitations, and decisions made where the assessment leaves implementation details open.

## 13. Implementation Workflow

Follow this sequence:

**Phase 1 — Inspect and plan**
- Inspect the repository and screenshots.
- Identify existing code and dependencies.
- Outline the frontend, backend, schemas, API, and business rules.
- Identify ambiguities and choose sensible, documented defaults.

**Phase 2 — Backend**
- Configure Express and MongoDB.
- Implement Mongoose models and indexes.
- Implement validation and business-rule services.
- Build all required API endpoints.
- Implement filtering, sorting, pagination, dashboard statistics, and CSV export.
- Add centralized error handling.

**Phase 3 — Frontend**
- Set up routing and the application layout.
- Implement the dashboard, employee pages, and task pages.
- Connect every page to real API endpoints.
- Implement URL-persisted filters, sorting, and pagination.
- Add responsive layouts, validation, loading states, and notifications.

**Phase 4 — Testing and verification**
- Run backend and frontend tests.
- Verify all mandatory business rules.
- Test API endpoints and edge cases.
- Verify the UI on mobile, tablet, and desktop.
- Check that no major buttons or flows are broken.
- Fix all important errors before declaring the project complete.

**Phase 5 — Delivery**
- Verify that the application builds successfully.
- Ensure `.env.example` is complete and no secrets are committed.
- Finish the README and deployment instructions.
- Provide the final repository structure and exact run commands.

Do not stop after creating the initial files. Continue implementing and testing until the application is complete.

## 14. Final Acceptance Checklist

Before declaring completion, verify that:

- [ ] Employee CRUD works.
- [ ] Task CRUD works within the specified restrictions.
- [ ] Employee IDs and task IDs are generated on the server.
- [ ] Email uniqueness is enforced after normalization.
- [ ] All five departments and permitted enum values are enforced.
- [ ] Assignment availability and leave-period rules work.
- [ ] Date validation works on both frontend and backend.
- [ ] Status transitions follow the exact permitted state machine.
- [ ] Status changes happen only through the dedicated endpoint.
- [ ] Completion dates are generated exclusively by the backend.
- [ ] The three-active-task limit is enforced.
- [ ] Overdue status is calculated consistently.
- [ ] Employee deletion preserves historical task information.
- [ ] Search, filters, sorting, and pagination work on the server.
- [ ] URL state survives refreshes and copied links.
- [ ] Dashboard statistics reflect actual database records.
- [ ] CSV exports respect filters and include all matching records.
- [ ] Responsive UI, notifications, loading states, and error states work.
- [ ] Automated tests cover the important rules.
- [ ] README documents setup, APIs, assumptions, and deployment.
- [ ] Frontend and backend build and run successfully.

**Important:** Prioritize correctness of business rules, clean architecture, maintainability, and a polished working UI. Do not fake functionality, bypass backend validation, hardcode dashboard statistics, or mark incomplete features as completed.

When finished, provide a concise summary of what was implemented, commands to run it locally, test results, deployment status, and any remaining limitations. Never claim a test or deployment succeeded unless you actually verified it.