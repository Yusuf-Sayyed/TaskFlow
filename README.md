# TaskFlow — Employee & Task Management System

A production-grade MERN Stack application for enterprise workforce management and task lifecycle tracking with strict backend business rule enforcement.

---

## 1. Project Overview

TaskFlow is an administrative dashboard built for enterprise workforce and task lifecycle operations. It provides end-to-end management of employees across five core departments (`Development`, `Design`, `QA`, `HR`, `Sales`) and enforces critical operational constraints directly in the backend architecture.

### Key Capabilities:
- **Employee Lifecycle Management**: Full CRUD operations with normalized lowercase email uniqueness, sequential atomic ID generation (`EMP-0001`), and active task protection upon deletion.
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
- **Runtime**: Node.js (v18+ / v22+)
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose 8.x
- **Testing**: Vitest & Supertest with `mongodb-memory-server`
- **Data Safety**: Custom sanitization & spreadsheet formula injection mitigation

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS & Vanilla CSS (custom design system)
- **Icons**: Lucide React
- **HTTP Client**: Axios with centralized error interceptors

---

## 3. Database Schemas & Employee → Task Relationship

The application models two primary business entities (`Employee` and `Task`) and a helper entity (`Counter`) for atomic sequential ID generation.

```mermaid
erDiagram
    EMPLOYEE ||--o{ TASK : "assigned to (1:N)"
    EMPLOYEE {
        ObjectId _id PK
        string employeeId UK "EMP-XXXX (Server generated)"
        string fullName
        string email UK "Normalized lowercase"
        string phone
        enum department "Development, Design, QA, HR, Sales"
        string role
        date joiningDate
        enum status "Active, Inactive, On Leave"
        array skills
        date leaveStartDate "Required when On Leave"
        date leaveEndDate "Required when On Leave"
        date createdAt
        date updatedAt
    }
    TASK {
        ObjectId _id PK
        string taskId UK "TSK-XXXX (Server generated)"
        string title
        string description
        ObjectId assignedEmployee FK "Ref: Employee (null on delete)"
        object assignedEmployeeSnapshot "Historical snapshot"
        enum department "Development, Design, QA, HR, Sales"
        enum priority "Low, Medium, High, Critical"
        enum status "Todo, In Progress, Completed, Cancelled"
        date startDate
        date dueDate
        date completedDate "Server-authoritative timestamp"
        date createdAt
        date updatedAt
    }
```

### Relationship Details:
1. **Referencing (1-to-N)**: Each task contains an `assignedEmployee` field storing the Mongoose `ObjectId` referencing the `Employee` model. Queries populate this field to display live assignee details.
2. **Historical Snapshot (`assignedEmployeeSnapshot`)**:
   - Each task embeds a static subdocument containing:
     ```json
     {
       "employeeId": "EMP-0001",
       "fullName": "Sarah Jenkins",
       "department": "Development",
       "email": "sarah.jenkins@company.com",
       "role": "Lead Full Stack Engineer"
     }
     ```
   - When an employee is deleted, the active reference `assignedEmployee` is set to `null`, while the embedded snapshot remains permanently intact.
   - This ensures completed and cancelled audit records retain the assignee's identity for compliance and reporting without dangling pointer errors, missing names, or `[object Object]` artifacts.

---

## 4. How Employee Deletion is Handled

Employee deletion enforces strict data integrity and historical preservation through a 3-step validation pipeline:

1. **Active Task Guard**:
   - Before allowing deletion, the backend queries for any active tasks (`status: 'Todo'` or `status: 'In Progress'`) assigned to the employee's `_id`.
   - If active tasks exist, deletion is immediately **rejected with `HTTP 409 Conflict`**:
     ```json
     {
       "status": "fail",
       "message": "Cannot delete employee. Employee currently has 2 active task(s) in progress. Reassign or resolve these tasks before deleting."
     }
     ```
2. **Audit Record Preservation**:
   - If the employee only has terminal tasks (`Completed` or `Cancelled`), deletion is **permitted**.
   - The employee document is removed from the `employees` collection.
3. **Reference Unlinking with Snapshot Intact**:
   - The server updates all historical tasks assigned to that employee, setting `assignedEmployee = null` while preserving the frozen `assignedEmployeeSnapshot`.
   - The UI displays an `Archived` badge next to the employee name on historical tasks, indicating the record is preserved from an archived staff member.

---

## 5. Architectural & Design Questions

### (1) Where do you validate status transitions and why?
* **Where**: Validated exclusively in the **backend service layer (`server/src/services/taskService.js`)** and exposed via a dedicated endpoint **`PUT /api/tasks/:id/status`**. The general task update endpoint (`PUT /api/tasks/:id`) strictly strips or rejects status modifications.
* **Why**:
  1. **Enforce Single Responsibility**: Decoupling lifecycle transitions from arbitrary field edits prevents clients from bypassing business rules (e.g., jumping from `Todo` directly to `Completed` without passing through `In Progress`).
  2. **Atomic Side Effects**: Transitioning to `Completed` requires setting the server-authoritative `completedDate = new Date()`. Centralizing transitions in a dedicated handler guarantees that side effects execute atomically with the state transition.
  3. **Immutability Enforcement**: Terminal states (`Completed`, `Cancelled`) are permanent. Reopening or editing these records is completely blocked at the service boundary.

### (2) Why does Completed Date come from the backend?
* **Why**:
  1. **Single Source of Truth**: Client machines have untrusted system clocks that may be skewed, running in inconsistent timezones, or intentionally manipulated.
  2. **SLA & Audit Integrity**: In an enterprise compliance system, completion dates govern employee performance metrics, SLA deadlines, and audit trails. Allowing clients to supply this date would enable users to record completion dates before task start dates or falsify on-time delivery.
  3. **Rule Enforcement**: The backend records `completedDate = new Date()` at the exact millisecond the task status transitions to `Completed`. If a task is not in `Completed` status, `completedDate` is always `null`.

### (3) How do you block inactive / on-leave assignment?
* **How**:
  * Implemented inside `validateEmployeeForTask` in `taskService.js`:
    1. **Inactive Check**: If `employee.status === 'Inactive'`, the request is rejected with `HTTP 400 Bad Request` ("Cannot assign task to employee. Employee is Inactive").
    2. **On Leave Inclusive Window Check**: If `employee.status === 'On Leave'`, the system validates whether the task's `startDate` falls within the employee's leave window using inclusive calendar-day boundaries:
       $$\text{leaveStartDate} \le \text{task.startDate} \le \text{leaveEndDate}$$
       If `startDate` falls on or between those dates, the request is rejected with `HTTP 400 Bad Request` citing the exact leave window.
    3. **Outside Leave Window**: If `task.startDate` starts strictly after `leaveEndDate` (or before `leaveStartDate`), the assignment is permitted.
  * Revalidation triggers on **task creation**, **assignee reassignment**, and **task start date modification**.

### (4) Why are filtering and pagination on the backend?
* **Why**:
  1. **Scalability & Memory Footprint**: In production, an enterprise dataset can grow to tens of thousands of tasks and employees. Loading all records into client memory causes large payload transfers, high memory usage, and UI lag.
  2. **Network Efficiency**: Backend pagination transmits only the requested page (e.g., 10 records, ~2KB) rather than multi-megabyte payloads, keeping initial page load fast on mobile and low-bandwidth connections.
  3. **Database Indexing**: MongoDB utilizes B-Tree indexes on fields like `status`, `department`, `priority`, and `createdAt`, executing complex searches, filters, and multi-key sorts in sub-millisecond query times.

### (5) Why do filters live in the URL?
* **Why**:
  1. **Shareability & Collaboration**: Team members can copy and share an exact URL (e.g., `/tasks?department=Development&isOverdue=true&priority=Critical&page=1`) and recipient browsers will render the exact same filtered dataset.
  2. **Browser Navigation (Back / Forward)**: Users can navigate between different filtered views using the browser's Back and Forward buttons naturally without losing their place.
  3. **State Persistence**: Refreshing the browser page preserves active search terms, dropdown filters, sorting order, and pagination rather than resetting to defaults.

### (6) What can go wrong if two requests assign a 4th active task at the same time?
* **What Goes Wrong (Race Condition / Check-Then-Act Flaw)**:
  * In a standard multi-step operation:
    1. Request A queries MongoDB: "Count active tasks for Employee X". (Result: 2 active tasks).
    2. Request B queries MongoDB at the same instant: "Count active tasks for Employee X". (Result: 2 active tasks).
    3. Request A checks: `2 < 3` -> validation passes.
    4. Request B checks: `2 < 3` -> validation passes.
    5. Request A saves Task #3.
    6. Request B saves Task #4.
  * **Result**: Employee X now has **4 active tasks**, directly violating Business Rule 5.
* **Mitigation Strategies**:
  1. **MongoDB Multi-Document Transactions**: Wrap the capacity count and task creation within a replica-set transaction (`session.startTransaction()`) with snapshot isolation.
  2. **Atomic Counter on Employee**: Maintain an `activeTaskCount` integer on the `Employee` document, and assign tasks using an atomic conditional update:
     ```javascript
     const res = await Employee.updateOne(
       { _id: employeeId, activeTaskCount: { $lt: 3 } },
       { $inc: { activeTaskCount: 1 } }
     );
     if (res.matchedCount === 0) throw new ConflictError("Max capacity reached");
     ```
  3. **Distributed Lock**: Implement an in-memory or Redis-backed distributed lock (e.g. Redlock) on the employee's ID during task assignment.

---

## 6. Assumptions Made

1. **Departments**: Strictly restricted to the 5 enum values specified in the requirements: `Development`, `Design`, `QA`, `HR`, `Sales`.
2. **Initial Task State**: All newly created tasks must start in `Todo` status. Any client attempt to set another initial status is overridden.
3. **Terminal States**: `Completed` and `Cancelled` tasks are permanent audit records. They cannot be edited, deleted, or reopened.
4. **Calendar-Day Overdue Evaluation**: A task deadline is evaluated by calendar day (up to 23:59:59.999 local/UTC). A task due on the current day is not marked overdue until that day has fully elapsed.
5. **Capacity Definition**: Active tasks are strictly defined as tasks with status `Todo` or `In Progress`. `Completed` and `Cancelled` tasks do not consume an employee's capacity.
6. **Spreadsheet Formula Injection**: Untrusted CSV cell content beginning with formula triggers (`=`, `+`, `-`, `@`) is automatically sanitized by prepending a single quote `'` to prevent command execution in Microsoft Excel and Google Sheets.

---

## 7. Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP Server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas or Local connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/assessment` |
| `CLIENT_URL` | Allowed CORS frontend origin | `http://localhost:5173` |
| `NODE_ENV` | Application environment (`development` / `production` / `test`) | `development` |

### Frontend (`client/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base REST API URL | `http://localhost:5000/api` |

*(Refer to `.env.example`, `server/.env.example`, and `client/.env.example` for starter templates).*

---

## 8. Local Setup & Installation

### Step 1: Clone the repository
```bash
git clone <repository-url>
cd Assessment
```

### Step 2: Configure and Start the Backend Server
```bash
cd server
npm install
cp .env.example .env

# Edit .env with your MongoDB Atlas or local URI
# Start the server (runs on port 5000)
npm run dev
# or: npm start
```

*(Optional) Seed the database with initial realistic workforce and tasks:*
```bash
node src/utils/seed.js
```

### Step 3: Configure and Start the Frontend Client
```bash
cd ../client
npm install
cp .env.example .env

# Start the Vite development server (runs on port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 9. Automated Testing

The backend includes a comprehensive test suite covering all 23 assessment rules and edge cases using Vitest, Supertest, and `mongodb-memory-server`.

```bash
cd server
npm test
```

### Test Suite Highlights (23/23 Passing):
* Sequential ID generation (`EMP-0001`, `TSK-0001`).
* Normalized lowercase email uniqueness and duplicate rejection (`409 Conflict`).
* Date validation (`dueDate >= startDate`).
* Active employee assignment vs. Inactive rejection (`400 Bad Request`).
* Leave period boundary checks (inclusive boundary edge-case testing).
* Strict workflow state machine (`Todo` → `In Progress` → `Completed`/`Cancelled`).
* Prevention of edits and reopening on Completed/Cancelled tasks.
* Server-authoritative `completedDate` assignment.
* Maximum 3 active tasks capacity limit and reassignment calculation.
* Employee deletion blocked when active tasks exist (`409 Conflict`).
* Preservation of historical employee snapshots on terminal tasks.
* Calendar-day overdue calculation.
* Server-side search, department filtering, priority sorting, and pagination.
* CSV export with spreadsheet formula injection mitigation.

---

## 10. REST API Documentation

### Employee Endpoints
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/employees` | Create employee with server-generated `employeeId` | `201`, `400`, `409` |
| `GET` | `/api/employees` | List employees (search, department/status filter, sort, pagination) | `200` |
| `GET` | `/api/employees/:id` | Get employee details by MongoDB `_id` or `employeeId` | `200`, `404` |
| `PUT` | `/api/employees/:id` | Update employee profile (immutable `employeeId`) | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/employees/:id` | Delete employee (blocked if active tasks exist) | `200`, `404`, `409` |
| `GET` | `/api/employees/export` | Export filtered matching employees to CSV | `200` |

### Task Endpoints
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/tasks` | Create task with initial status `Todo` and snapshot | `201`, `400`, `404`, `409` |
| `GET` | `/api/tasks` | List tasks (search, department/status/priority/overdue filters, pagination) | `200` |
| `GET` | `/api/tasks/:id` | Get task details by MongoDB `_id` or `taskId` | `200`, `404` |
| `PUT` | `/api/tasks/:id` | Update task details (excludes status and completedDate) | `200`, `400`, `404`, `409` |
| `PUT` | `/api/tasks/:id/status`| Transition status via finite state machine | `200`, `400`, `404` |
| `DELETE` | `/api/tasks/:id` | Delete task (blocked if Completed or Cancelled) | `200`, `400`, `404` |
| `GET` | `/api/tasks/export` | Export filtered matching tasks to CSV | `200` |

### Dashboard & Health Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Real-time aggregate statistics & workload distribution |
| `GET` | `/api/health` | System health check endpoint |

---

## 11. Deployment Guide

### Frontend Deployment (Vercel or Netlify)
1. Push the repository to GitHub/GitLab.
2. In **Vercel** or **Netlify**:
   - Set **Root Directory** to `client`.
   - Set **Build Command** to `npm run build`.
   - Set **Output / Publish Directory** to `dist`.
   - Set Environment Variable: `VITE_API_URL=https://<your-backend-domain>/api`.
3. SPA client-side routing rewrites are pre-configured in `client/vercel.json` and `client/public/_redirects`.

### Backend Deployment (Render, Railway, or AWS)
1. In **Render** or **Railway**:
   - Set **Root Directory** to `server` (or deploy using `server/render.yaml`).
   - Set **Build Command** to `npm install`.
   - Set **Start Command** to `npm start`.
   - Configure Environment Variables:
     - `PORT=5000`
     - `MONGODB_URI=<your-mongodb-atlas-uri>`
     - `CLIENT_URL=https://<your-frontend-domain>`
     - `NODE_ENV=production`
