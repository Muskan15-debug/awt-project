# FreelanceHub — Full Project Documentation

A full-stack freelance project management platform connecting **Recruiters**, **Freelancers**, **Agencies**, and **Project Managers** under a single admin-governed system.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [How to Run](#how-to-run)
5. [User Roles](#user-roles)
6. [Complete Project Flow](#complete-project-flow)
7. [Data Models](#data-models)
8. [API Endpoints](#api-endpoints)
9. [Authentication Flow](#authentication-flow)
10. [Payment & Escrow Flow](#payment--escrow-flow)
11. [Dispute Resolution Flow](#dispute-resolution-flow)
12. [Agency Flow](#agency-flow)
13. [Frontend Routes](#frontend-routes)
14. [Middleware & Security](#middleware--security)

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Tokens (JWT) | Authentication (access + refresh tokens) |
| bcryptjs | Password hashing |
| Zod | Request body validation |
| cookie-parser | HTTP-only cookie handling |
| helmet | HTTP security headers |
| morgan | Request logging |
| cors | Cross-origin resource sharing |
| dotenv | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI library |
| Vite | Build tool & dev server |
| React Router DOM v6 | Client-side routing |
| Axios | HTTP client with interceptors |
| React Icons | Icon library |

---

## Project Structure

```
awt-project/
├── client/                        # React frontend (Vite)
│   └── src/
│       ├── api/
│       │   ├── axios.js           # Axios instance + token refresh interceptor
│       │   └── index.js           # All API call functions grouped by domain
│       ├── components/
│       │   ├── auth/
│       │   │   └── ProtectedRoute.jsx
│       │   └── layout/
│       │       ├── PublicLayout.jsx
│       │       └── DashboardLayout.jsx
│       ├── context/
│       │   ├── AuthContext.jsx    # Global auth state
│       │   └── ToastContext.jsx   # Global toast notifications
│       ├── pages/                 # One page per role/feature
│       └── App.jsx                # Route definitions
│
└── server/                        # Express backend
    ├── config/
    │   └── db.js                  # MongoDB connection
    ├── controllers/               # Business logic per domain
    ├── middleware/
    │   ├── auth.js                # JWT authentication
    │   ├── roles.js               # Role-based access control
    │   ├── validate.js            # Zod schema validation
    │   └── errorHandler.js        # Global error handler
    ├── models/                    # Mongoose schemas
    ├── routes/                    # Express routers
    ├── utils/
    │   ├── helpers.js             # JWT generation, cookie helpers
    │   ├── ApiError.js            # Custom error class
    │   └── constants.js
    ├── validators/                # Zod schemas per domain
    ├── seedAdmin.js               # Script to seed first admin user
    └── server.js                  # App entry point
```

---

## Environment Setup

Create a `.env` file inside the `server/` directory:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/freelancehub

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRY=2d
JWT_REFRESH_EXPIRY=7d
```

---

## How to Run

### 1. Seed the Admin User (first time only)
```bash
cd server
npm run seed:admin
```

### 2. Start the Backend
```bash
cd server
npm run dev        # development (auto-restart on file change)
# or
npm start          # production
```
Server runs on `http://localhost:5001`

### 3. Start the Frontend
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

> Vite proxies `/api` requests to the backend automatically.

---

## User Roles

| Role | Description |
|---|---|
| `admin` | Platform superuser — manages users, agencies, disputes, views analytics |
| `recruiter` | Posts projects by sending invites to freelancers/agencies, assigns PMs |
| `projectManager` | Manages active projects — creates milestones, tasks, approves work |
| `freelancer` | Receives invites, works on tasks, submits work, earns payments |
| `agency` | A group of freelancers — receives invites, owner distributes tasks to members |

---

## Complete Project Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE PROJECT LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────────────┘

1. DISCOVERY
   Recruiter ──[searches talent]──► TalentSearch page
   Recruiter ──[shortlists]──────► Shortlist (toggle save/unsave)

2. INVITE
   Recruiter ──[sends invite]────► Freelancer / Agency
                                    │
                              ┌─────▼──────┐
                              │  pending   │
                              └─────┬──────┘
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                accepted         declined        (no action)
                    │
                    ▼
         Project auto-created (status: active)
         Invite linked to Project via inviteId

3. PM ASSIGNMENT (optional handoff)
   Recruiter ──[assigns PM]──────► Project.pmId set, handedOff = true
   Invite.assignedPM updated

4. PROJECT EXECUTION (PM manages)
   PM ──[creates Milestone]──────► Milestone created
                                    Payment auto-created (status: held) ← ESCROW

   PM ──[creates Tasks]──────────► Tasks linked to Milestone + Project
                                    Tasks assigned to Freelancer / Agency member

5. TASK LIFECYCLE
   Freelancer ──[todo → in-progress]──► updateTaskStatus
   Freelancer ──[in-progress → submitted]──► submitTask (with note/file)
   PM ──[submitted → approved]──────────► approveTask
   PM ──[submitted → revision-requested]► approveTask (sends back)
   Freelancer ──[revision-requested → in-progress]──► updateTaskStatus

6. MILESTONE APPROVAL
   PM ──[approves milestone]──────► All tasks must be approved first (enforced)
                                    Payment status: held → released
                                    If ALL milestones approved → Project status: completed

7. DISPUTE (if conflict arises)
   Any party ──[raises dispute]──► Dispute created (status: open)
   Admin ──[resolves dispute]────► resolution: refund | release | split
                                    Payments updated accordingly
                                    Project status → disputed

8. REVIEW (after completion)
   Any party ──[leaves review]──► Review created (1 per direction per project)
                                    User.rating.average updated

9. EARNINGS
   Freelancer/Agency ──[views earnings]──► All payments for their projects
```

---

## Data Models

### User
```
_id, name, email, password (hashed), avatar, profilePhoto
role: admin | recruiter | projectManager | freelancer | agency
title, bio, skills[], hourlyRate, experienceLevel
availability: available | busy | unavailable
location: { city, country }
portfolioLinks[]
rating: { average, count }
isVerified, isBanned
agencyId (ref: Agency)
```

### Project
```
_id, title, description
recruiterId (ref: User)
pmId (ref: User)
freelancerOrAgencyId (ref: User)
receiverType: freelancer | agency
status: active | on-hold | completed | disputed | cancelled
inviteId (ref: Invite)
handedOff: boolean
```

### Invite
```
_id
recruiterId (ref: User)
receiverId (ref: User)
receiverType: freelancer | agency
projectTitle, message
status: pending | accepted | declined
projectId (ref: Project)       ← set when accepted
assignedPM (ref: User)         ← set when recruiter assigns PM
```

### Milestone
```
_id, title, dueDate, amount
projectId (ref: Project)
status: pending | in-progress | submitted | approved | rejected
```

### Task
```
_id, title, description
milestoneId (ref: Milestone)
projectId (ref: Project)
assignedToId (ref: User)
status: todo | in-progress | submitted | approved | revision-requested
submissionNote, submissionFileUrl
```

### Payment
```
_id, amount
milestoneId (ref: Milestone)
projectId (ref: Project)
status: held | released | refunded
```
> One Payment is auto-created per Milestone with status `held` (escrow).

### Dispute
```
_id, reason, adminNote, resolution
projectId (ref: Project)
raisedById (ref: User)
status: open | under-review | resolved
resolution: refund | release | split
```

### Agency
```
_id, name, description, logo, website
owner (ref: User)
specializations[]
members[]: { user, role: owner|admin|member, status: pending|active|removed, joinedAt }
isApproved: boolean
rejectionReason
rating: { average, count }
```

### AgencyRequest
```
_id
initiatorId (ref: User)
proposedName, proposedDescription, proposedSpecializations[]
invitees[]: { user, status: pending|accepted|rejected, responseDate }
status: pending | executed | cancelled
createdAgencyId (ref: Agency)
```

### Review
```
_id, rating (1-5), comment
projectId (ref: Project)
fromId (ref: User)
toId (ref: User)
```
> Unique index on `{ projectId, fromId }` — one review per reviewer per project.

### Shortlist
```
_id
recruiterId (ref: User)
targetId (ref: User)
targetType: freelancer | agency
```
> Unique index on `{ recruiterId, targetId }` — toggle behavior.

### ActivityLog
```
_id, action (string), meta (mixed)
performedBy (ref: User)
targetType: User | Project | Milestone | Task | Dispute | Agency | Payment
targetId
```

### InviteMessage
```
_id, content
inviteId (ref: Invite)
senderId (ref: User)
```

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, sets HTTP-only cookies |
| POST | `/logout` | Public | Clears auth cookies |
| POST | `/refresh` | Public | Refresh access token using refresh cookie |
| PATCH | `/password` | Authenticated | Change password |

---

### Users — `/api/users`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Search users (query: `search`, `role`, `skills`, etc.) |
| GET | `/me` | Authenticated | Get own profile |
| PUT | `/me` | Authenticated | Update own profile |
| GET | `/:id` | Authenticated | Get any user's public profile |

---

### Projects — `/api/projects`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get projects relevant to current user |
| GET | `/:id` | Authenticated | Get single project detail |
| PATCH | `/:id/assign-pm` | Authenticated | Assign PM to project |
| PATCH | `/:id/status` | Authenticated | Update project status |

---

### Invites — `/api/invites`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Recruiter | Send invite to freelancer/agency |
| GET | `/` | Authenticated | Get my invites (sent or received based on role) |
| PATCH | `/:id/respond` | Freelancer, Agency | Accept or decline invite |
| PATCH | `/:id/assign-pm` | Recruiter | Assign PM to accepted invite |
| GET | `/:id/messages` | Invite parties | Get message thread for invite |
| POST | `/:id/messages` | Invite parties | Send message in invite thread |

---

### Milestones — `/api/milestones`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/project/:projectId` | PM | Create milestone (auto-creates held payment) |
| GET | `/project/:projectId` | Project members | Get all milestones for a project |
| PATCH | `/:id/status` | PM | Update milestone status (approve triggers payment release) |

---

### Tasks — `/api/tasks`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | PM | Create task under a milestone |
| GET | `/my` | Authenticated | Get my assigned tasks |
| GET | `/project/:projectId` | Project members | Get all tasks for a project |
| PATCH | `/:id/status` | Assignee | Move task to `in-progress` |
| PATCH | `/:id/submit` | Assignee | Submit task with note/file |
| PATCH | `/:id/approve` | PM | Approve or request revision |
| PATCH | `/:id/reassign` | Agency owner | Reassign task to agency member |

---

### Payments — `/api/payments`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/earnings` | Freelancer, Agency | View all earnings across projects |
| GET | `/project/:projectId` | Project members | View payments for a specific project |

---

### Disputes — `/api/disputes`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Raise a dispute on a project |
| GET | `/` | Authenticated | Get disputes (filtered by role) |
| GET | `/:id` | Authenticated | Get single dispute |
| PATCH | `/:id/resolve` | Admin | Resolve dispute (refund/release/split) |

---

### Reviews — `/api/reviews`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Leave a review for a user on a project |
| GET | `/user/:userId` | Authenticated | Get all reviews for a user |

---

### Shortlists — `/api/shortlists`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Recruiter, Admin | Toggle shortlist (add/remove) |
| GET | `/` | Recruiter, Admin | Get my shortlisted users |

---

### Agencies — `/api/agencies`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Create a new agency |
| GET | `/:id` | Authenticated | Get agency details with members |
| PUT | `/:id` | Agency owner | Update agency info |
| POST | `/:id/members` | Agency owner | Invite or assign member |
| PATCH | `/:id/members/:uid` | Owner / Member | Accept invite or remove member |

---

### Agency Requests — `/api/agency-requests`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Freelancer | Create agency formation request |
| GET | `/my` | Freelancer | Get my agency requests |
| PATCH | `/:id/respond` | Freelancer | Respond to agency request invite |

---

### Admin — `/api/admin` *(Admin only)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics` | Platform-wide stats (users, projects, payments, disputes) |
| GET | `/activity-log` | Paginated activity feed (filterable by action, targetType) |
| GET | `/users` | All users (filterable by role, search) |
| PATCH | `/users/:id` | Ban / unban / verify / change role |
| GET | `/agencies/pending` | Agencies awaiting approval |
| PATCH | `/agencies/:id` | Approve or reject agency |
| GET | `/disputes` | All disputes |
| PATCH | `/disputes/:id/resolve` | Resolve dispute with outcome |
| GET | `/projects` | All projects |

---

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |

---

## Authentication Flow

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│  Client  │         │  Express API │         │   MongoDB    │
└────┬─────┘         └──────┬───────┘         └──────┬───────┘
     │                      │                        │
     │  POST /auth/login     │                        │
     │─────────────────────►│                        │
     │                      │  findOne({ email })    │
     │                      │───────────────────────►│
     │                      │◄───────────────────────│
     │                      │  bcrypt.compare()      │
     │                      │  generateAccessToken() │
     │                      │  generateRefreshToken()│
     │◄─────────────────────│                        │
     │  Set-Cookie:          │                        │
     │  accessToken (2d)     │                        │
     │  refreshToken (7d)    │                        │
     │  (both httpOnly)      │                        │
     │                      │                        │
     │  GET /api/protected   │                        │
     │─────────────────────►│                        │
     │  (cookie sent auto)   │  jwt.verify()          │
     │                      │  User.findById()       │
     │                      │  req.user = user       │
     │◄─────────────────────│                        │
     │  200 OK               │                        │
     │                      │                        │
     │  [Token Expired]      │                        │
     │  401 TOKEN_EXPIRED   ◄│                        │
     │  POST /auth/refresh   │                        │
     │─────────────────────►│                        │
     │  (refreshToken cookie)│  jwt.verify(refresh)  │
     │                      │  new tokens issued     │
     │◄─────────────────────│                        │
     │  Retry original req   │                        │
```

- Tokens are stored in **HTTP-only cookies** (not localStorage) — XSS safe
- The Axios interceptor in `axios.js` automatically handles 401 → refresh → retry
- Concurrent requests during refresh are queued and replayed after token refresh

---

## Payment & Escrow Flow

```
PM creates Milestone (amount: $500)
         │
         ▼
Payment auto-created: { status: "held", amount: 500 }
         │                    ← funds in escrow
         ▼
PM creates Tasks under Milestone
         │
         ▼
Freelancer completes all Tasks (todo → in-progress → submitted → approved)
         │
         ▼
PM approves Milestone
  ├── Checks: all tasks must be "approved" (enforced server-side)
  └── Payment updated: "held" → "released"
         │
         ▼
If ALL milestones approved → Project.status = "completed"
```

**Dispute overrides:**
```
Dispute resolved with "refund"  → all held payments → "refunded"
Dispute resolved with "release" → all held payments → "released"
Dispute resolved with "split"   → alternating released/refunded
```

---

## Dispute Resolution Flow

```
Any project party raises dispute
         │
         ▼
Dispute { status: "open", projectId, raisedById, reason }
         │
         ▼
Admin reviews → PATCH /api/admin/disputes/:id/resolve
         │
         ├── resolution: "refund"  → all held payments refunded
         ├── resolution: "release" → all held payments released
         └── resolution: "split"   → alternating release/refund
         │
         ▼
Dispute.status = "resolved"
ActivityLog entry created
```

---

## Agency Flow

```
Option A — Direct Agency Creation:
  User ──[POST /agencies]──► Agency created (isApproved: false)
  Admin ──[PATCH /admin/agencies/:id]──► approve / reject
  Agency owner ──[POST /agencies/:id/members]──► invite freelancers
  Freelancer ──[PATCH /agencies/:id/members/:uid]──► accept invite

Option B — Agency Request (group formation):
  Freelancer ──[POST /agency-requests]──► AgencyRequest with invitees[]
  Invitees ──[PATCH /agency-requests/:id/respond]──► accept/reject
  On execution → Agency auto-created

Agency receiving a project:
  Recruiter sends invite to agency owner (receiverType: "agency")
  Agency owner accepts → Project created
  PM creates tasks → assigns to agency owner
  Agency owner ──[PATCH /tasks/:id/reassign]──► reassigns to active member
```

---

## Frontend Routes

| Path | Component | Role Required |
|---|---|---|
| `/` | Landing | Public |
| `/talent` | TalentSearch | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/admin` | AdminDashboard | admin |
| `/admin/users` | AdminUsers | admin |
| `/admin/agencies` | AdminAgencies | admin |
| `/admin/disputes` | AdminDisputes | admin |
| `/admin/projects` | AdminProjects | admin |
| `/admin/activity` | AdminActivity | admin |
| `/admin/profile` | Profile | admin |
| `/recruiter` | TalentSearch | recruiter |
| `/recruiter/pipeline` | RecruiterDashboard | recruiter |
| `/recruiter/profile` | Profile | recruiter |
| `/pm` | PMDashboard | projectManager |
| `/pm/projects/:id` | PMProjectDetail | projectManager |
| `/pm/profile` | Profile | projectManager |
| `/freelancer` | Dashboard | freelancer |
| `/freelancer/invites` | FreelancerInvites | freelancer |
| `/freelancer/earnings` | Earnings | freelancer |
| `/freelancer/profile` | Profile | freelancer |
| `/agency` | AgencyDashboard | agency |
| `/agency/invites` | AgencyInvites | agency |
| `/agency/earnings` | Earnings | agency |
| `/agency/team` | AgencyTeam | agency |
| `/agency/profile` | Profile | agency |
| `*` | Redirect to `/` | — |

> `ProtectedRoute` checks `AuthContext` for the user's role and redirects unauthorized access.

---

## Middleware & Security

### `authenticate` (auth.js)
- Reads `accessToken` from HTTP-only cookie
- Verifies JWT with `JWT_ACCESS_SECRET`
- Attaches `req.user` to the request
- Returns `401` if token missing/invalid, `403` if user is banned
- Returns `{ code: 'TOKEN_EXPIRED' }` on expiry so the client can refresh

### `requireRole(...roles)` (roles.js)
- Checks `req.user.role` against allowed roles
- Returns `403` if role doesn't match

### `validate(schema)` (validate.js)
- Runs Zod schema validation on `req.body`
- Attaches `req.validatedBody` on success
- Returns `400` with field-level errors on failure

### `errorHandler` (errorHandler.js)
- Global Express error handler
- Catches all `next(error)` calls
- Returns structured JSON error responses

### Helmet
- Sets secure HTTP headers (CSP, HSTS, etc.)
- `crossOriginResourcePolicy: cross-origin` for avatar/image support

### CORS
- Restricted to `CLIENT_URL` (default: `http://localhost:5173`)
- `credentials: true` to allow cookie transmission
