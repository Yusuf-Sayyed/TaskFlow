# TaskFlow Pro — Employee & Task Management System
A production-quality MERN Stack application for managing enterprise workforces and tracking task deliverables with strict backend business rule enforcement.

---

## 1. Project Overview

TaskFlow Pro is an administrative dashboard built for enterprise workforce and task lifecycle operations. It provides end-to-end management of employees across five core departments (`Development`, `Design`, `QA`, `HR`, `Sales`) and enforces critical operational constraints directly in the backend architecture.

### Key Capabilities:
- **Employee Lifecycle Management**: CRUD operations with normalized email uniqueness, sequential atomic ID generation (`EMP-0001`), and active task protection upon deletion.
- **Workflow State Machine**: Strict status transitions (`Todo` → `In Progress` → `Completed`/`Cancelled`) managed exclusively through a dedicated transition endpoint.
- **Workload Capacity Safeguard**: Hard limit of at most 3 active tasks (`Todo` or `In Progress`) per employee.
- **Leave Availability Validation**: Prevents assigning tasks whose start dates fall within an employee's inclusive leave window (`leaveStartDate` to `leaveEndDate`).
- **Dynamic Overdue Detection**: Timezone-safe calendar-day calculation that distinguishes overdue tasks without prematurely flagging items on their deadline date.
- **Audit-Safe Archival**: Completed and Cancelled records are immutable and permanent; employee deletion preserves historical snapshots to prevent broken references or `[object Object]` displays.
- **URL-Persisted Query State**: Full synchronization of search (debounced), department/status/priority filters, sorting, and pagination across browser refreshes and shared links.
- **RFC 4180 CSV Export**: Server-side CSV streaming across all matching records with Spreadsheet Formula Injection mitigation.

---

## 2. Technology Stack

### Backend
- **Runtime**: Node.js (v22+)
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose 8.x
- **Testing**: Vitest & Supertest with `mongodb-memory-server`
- **Data Safety**: Custom sanitization & formula neutralization

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS & Vanilla CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios with centralized error formatting

---

## 3. Prerequisites

- **Node.js**: `v18.0.0` or higher (recommended: `v22.x`)
- **npm**: `v9.x` or higher
- **MongoDB**: Either a local MongoDB instance (`mongodb://localhost:27017`), Docker container, or MongoDB Atlas connection string.

---

## 4. Installation & Local Setup

### Step 1: Clone or navigate to the project
```bash
cd /path/to/Assessment
```

### Step 2: Set up and start the Backend
```bash
cd server
npm install
cp .env.example .env

# (Optional) Seed realistic demo workforce and tasks
node src/utils/seed.js

# Start backend server (runs on port 5000)
npm run dev
# or: npm start
```

### Step 3: Set up and start the Frontend
```bash
cd ../client
npm install

# Start Vite development server (runs on port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 5. Environment Variables

### Backend (`server/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP Server port | `5000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/assessment` |
| `CLIENT_URL` | Allowed CORS frontend origin | `http://localhost:5173` |
| `NODE_ENV` | Application environment (`development` / `production` / `test`) | `development` |

### Frontend (`client/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base REST API URL | `http://localhost:5000/api` |

---

## 6. Business Rule Implementations

### Rule 1: Employee Assignment & Leave Boundaries
- **Active Only**: Tasks may only be assigned to employees with `status: 'Active'`. Any attempt to assign to an `Inactive` employee returns `HTTP 400`.
- **Leave Inclusive Comparison**: When an employee is `On Leave`, assignments are rejected if the task's `startDate` falls within the employee's `leaveStartDate` and `leaveEndDate` inclusively:
  $$\text{leaveStartDate} \le \text{task.startDate} \le \text{leaveEndDate}$$
- Assignments starting strictly outside the leave window are permitted for Active employees.
- Validation is enforced upon task creation, assignee change, and task start date updates.

### Rule 2: Task Date Order
- `dueDate` cannot be earlier than `startDate` (evaluated by calendar day).
- Enforced on creation and date modifications with `HTTP 400`.

### Rule 3: Allowed Status Transitions
- New tasks always start in `Todo`.
- Status transitions can **only** be triggered via `PUT /api/tasks/:id/status`. Attempts to change status via `PUT /api/tasks/:id` are rejected with `HTTP 400`.
- Exact allowed state transitions:
  - `Todo` → `In Progress`, `Cancelled`
  - `In Progress` → `Completed`, `Cancelled`
  - `Completed` → None (terminal state)
  - `Cancelled` → None (terminal state)
- Completed and Cancelled tasks are immutable historical records; edits or reopening attempts return `HTTP 400`.

### Rule 4: Server-Authoritative Completion Date
- When a task transitions to `Completed`, the server records `completedDate = new Date()`.
- Client-supplied `completedDate` values are rejected upon creation and update. Tasks not in `Completed` status have `completedDate: null`.

### Rule 5: Active Task Capacity (Max 3 Tasks)
- An employee can hold at most **3 active tasks** (`Todo` or `In Progress`).
- When assigning or moving a task, the server verifies current active count (excluding the current task when reassigning) and rejects excess with `HTTP 409 Conflict`.
- Completed and Cancelled tasks do not consume capacity.

### Rule 6: Overdue Definition & Timezone Strategy
- A task is overdue if:
  1. `dueDate < currentDate` (calendar-day comparison); AND
  2. `status` is neither `Completed` nor `Cancelled`.
- Date-only deadlines are evaluated up to end-of-day (23:59:59.999 UTC/local), ensuring that tasks due today are not flagged overdue prematurely during normal working hours.

### Rule 7: Employee Deletion & Historical Snapshot Archival
- Deletion is blocked with `HTTP 409 Conflict` if the employee has any `Todo` or `In Progress` tasks.
- If all assigned tasks are `Completed` or `Cancelled`, deletion is permitted.
- Historical tasks preserve an embedded `assignedEmployeeSnapshot` (`fullName`, `employeeId`, `department`, `email`, `role`). Unlinking the deleted ObjectId leaves historical records fully readable with no broken references, blank labels, or `[object Object]` artifacts.

### Rule 8: Task Deletion Policy
- `Completed` and `Cancelled` tasks cannot be deleted as they serve as permanent audit records.
- Only active (`Todo` and `In Progress`) tasks may be deleted.

---

## 7. REST API Documentation

### Employee Endpoints
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/employees` | Create employee (server generates `EMP-XXXX`) | `201`, `400`, `409` |
| `GET` | `/api/employees` | List employees (search, filters, sort, pagination) | `200` |
| `GET` | `/api/employees/:id` | Get employee by MongoDB ID or Employee ID | `200`, `404` |
| `PUT` | `/api/employees/:id` | Update employee details (immutable `employeeId`) | `200`, `400`, `409`, `404` |
| `DELETE` | `/api/employees/:id` | Delete employee (blocked if active tasks exist) | `200`, `404`, `409` |
| `GET` | `/api/employees/export` | Download filtered employees as RFC 4180 CSV | `200` |

### Task Endpoints
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/tasks` | Create task with initial status `Todo` | `201`, `400`, `404`, `409` |
| `GET` | `/api/tasks` | List tasks (search, filters, custom priority sort) | `200` |
| `GET` | `/api/tasks/:id` | Get task details by MongoDB ID or Task ID | `200`, `404` |
| `PUT` | `/api/tasks/:id` | Update task details (excludes status & completedDate) | `200`, `400`, `404`, `409` |
| `PUT` | `/api/tasks/:id/status`| Advance task status via state machine | `200`, `400`, `404` |
| `DELETE` | `/api/tasks/:id` | Delete task (blocked if Completed or Cancelled) | `200`, `400`, `404` |
| `GET` | `/api/tasks/export` | Download filtered tasks as RFC 4180 CSV | `200` |

### Dashboard & Health Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Real-time aggregate statistics & workload distribution |
| `GET` | `/api/health` | Service health status check |

---

## 8. Automated Testing

The backend includes comprehensive test coverage for all 23 mandatory assessment scenarios using Vitest, Supertest, and `mongodb-memory-server`.

To execute the test suite:
```bash
cd server
npm test
```

### Test Coverage Highlights:
- Employee creation, email normalization, and duplicate email `409` rejection.
- Invalid data and date order validation (`400`).
- Active employee assignment vs. Inactive rejection.
- Leave period boundary testing (`leaveStartDate`, `leaveEndDate`, inside, and outside).
- Strict state machine transitions (`Todo` → `In Progress` → `Completed`/`Cancelled`) and reopening blocks.
- Server-authoritative completion dates.
- Maximum 3 active task capacity limits and assignee transfer calculations.
- Deletion protection with active tasks and preservation of historical snapshots.
- Timezone-safe overdue calculation.
- CSV export formula injection sanitization (`=`, `+`, `-`, `@`).

---

## 9. Deployment Strategy

### Frontend Deployment (Vercel or Netlify)
1. Push repository to GitHub/GitLab.
2. In Netlify or Vercel, set Root Directory to `client`.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Configure environment variable: `VITE_API_URL=https://your-backend-api.com/api`

### Backend Deployment (Render, Railway, or AWS EC2)
1. Set Root Directory to `server`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Configure environment variables:
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/assessment`
   - `CLIENT_URL=https://your-frontend-domain.netlify.app`
   - `NODE_ENV=production`

---

## 10. Concurrency & Architectural Trade-offs

1. **Capacity Limit Concurrency**:
   - Sequential ID counters use atomic `$inc` via `findByIdAndUpdate`.
   - Task assignment verifies active task count before saving. In exceptionally high-concurrency environments, MongoDB multi-document transactions (`session.startTransaction()`) with snapshot isolation can be enabled where replica sets are provisioned.
2. **Formula Injection Sanitization**:
   - Untrusted text starting with formula triggers (`=`, `+`, `-`, `@`) is safely neutralized by prepending a single quote `'` in generated CSV streams.
