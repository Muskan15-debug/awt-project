// User roles
export const ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  PROJECT_MANAGER: 'projectManager',
  FREELANCER: 'freelancer',
  AGENCY: 'agency',
};

// Project statuses
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
};

// Milestone statuses
export const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Task statuses
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REVISION_REQUESTED: 'revision-requested',
};

// Payment statuses
export const PAYMENT_STATUS = {
  HELD: 'held',
  RELEASED: 'released',
  REFUNDED: 'refunded',
};

// Dispute statuses
export const DISPUTE_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under-review',
  RESOLVED: 'resolved',
};

// Dispute resolution types
export const DISPUTE_RESOLUTION = {
  REFUND: 'refund',
  RELEASE: 'release',
  SPLIT: 'split',
};

// User availability
export const AVAILABILITY = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable',
};
