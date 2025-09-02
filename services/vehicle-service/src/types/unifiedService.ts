/**
 * Unified Service Request System
 * This file defines a comprehensive service request system that integrates
 * vehicle service scheduling with spare parts requests to avoid conflicts
 */

import {
  ServiceRequestType,
  ServiceRequestStatus,
  ServiceRequestPriority,
  ApprovalType,
  ApprovalStatus,
  PartUrgency,
  PartRequestStatus,
} from "@prisma/client";

// Re-export Prisma enums for convenience
export {
  ServiceRequestType,
  ServiceRequestStatus,
  ServiceRequestPriority,
  ApprovalType,
  ApprovalStatus,
  PartUrgency,
  PartRequestStatus,
};

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  vehicleId: string;
  requestedBy: string; // User ID who created the request
  assignedTo?: string; // Technician ID assigned to the service
  serviceType: ServiceRequestType;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;

  // Service Details
  title: string;
  description: string;
  issueReported?: string;
  symptoms?: string[];

  // Scheduling Information
  requestedDate?: Date;
  scheduledDate?: Date;
  estimatedDuration?: number; // in hours
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Location and Resources
  serviceLocation?: string;
  serviceCenter?: string;
  serviceBay?: string;

  // Cost Information
  estimatedLaborCost?: number;
  estimatedPartsCost?: number;
  estimatedTotalCost?: number;
  actualLaborCost?: number;
  actualPartsCost?: number;
  actualTotalCost?: number;

  // Work Details
  workPerformed?: string;
  completionNotes?: string;
  qualityCheckNotes?: string;
  customerApprovalRequired: boolean;
  customerApproved?: boolean;
  customerComments?: string;

  // Parts and Inventory
  partsRequests: ServicePartsRequest[];
  partsUsed: ServicePartsUsed[];

  // Service Record Integration
  serviceRecordId?: string; // Links to actual service record when work is completed

  // Workflow and Approvals
  approvals: ServiceApproval[];

  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;

  // Additional Metadata
  tags?: string[];
  notes?: string;
  attachments?: ServiceAttachment[];
}

export interface ServicePartsRequest {
  id: string;
  serviceRequestId: string;
  sparePartId: string;
  partName: string;
  partNumber: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  issuedQuantity?: number;
  unitCost?: number;
  totalCost?: number;
  urgency: PartUrgency;
  justification: string;
  status: PartRequestStatus;
  requestedBy: string;
  approvedBy?: string;
  issuedBy?: string;
  requestedAt: Date;
  approvedAt?: Date;
  issuedAt?: Date;
  notes?: string;
}

export interface ServicePartsUsed {
  id: string;
  serviceRequestId: string;
  sparePartId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  serialNumber?: string;
  installedBy: string;
  installedAt: Date;
  warrantyPeriod?: number; // in months
  warrantyExpiry?: Date;
  notes?: string;
}

export interface ServiceApproval {
  id: string;
  serviceRequestId: string;
  approvalType: ApprovalType;
  requiredFor: string; // What this approval is for
  status: ApprovalStatus;
  approverRole: string;
  approvedBy?: string;
  approvedAt?: Date;
  comments?: string;
  conditions?: string;
}

export interface ServiceAttachment {
  id: string;
  serviceRequestId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  category: "Photo" | "Document" | "Video" | "Audio" | "Report" | "Other";
}

// Input/Output Types for API
export interface CreateServiceRequestInput {
  vehicleId: string;
  serviceType: ServiceRequestType;
  priority: ServiceRequestPriority;
  title: string;
  description: string;
  issueReported?: string;
  symptoms?: string[];
  requestedDate?: string;
  serviceLocation?: string;
  estimatedDuration?: number;
  customerApprovalRequired?: boolean;
  partsRequests?: Omit<
    ServicePartsRequest,
    "id" | "serviceRequestId" | "requestedAt" | "requestedBy"
  >[];
  tags?: string[];
  notes?: string;
}

export interface UpdateServiceRequestInput {
  serviceType?: ServiceRequestType;
  priority?: ServiceRequestPriority;
  status?: ServiceRequestStatus;
  title?: string;
  description?: string;
  assignedTo?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  serviceLocation?: string;
  serviceCenter?: string;
  serviceBay?: string;
  estimatedLaborCost?: number;
  estimatedPartsCost?: number;
  workPerformed?: string;
  completionNotes?: string;
  customerApproved?: boolean;
  customerComments?: string;
  tags?: string[];
  notes?: string;
}

export interface ServiceRequestFilters {
  vehicleId?: string;
  assignedTo?: string;
  serviceType?: ServiceRequestType;
  priority?: ServiceRequestPriority;
  status?: ServiceRequestStatus;
  serviceCenter?: string;
  requestedDateFrom?: string;
  requestedDateTo?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  createdBy?: string;
  search?: string; // Search in title, description, ticket number
}

export interface ServiceRequestResponse {
  success: boolean;
  data?: ServiceRequest | ServiceRequest[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics and Reporting Types
export interface ServiceRequestAnalytics {
  totalRequests: number;
  requestsByStatus: Record<ServiceRequestStatus, number>;
  requestsByPriority: Record<ServiceRequestPriority, number>;
  requestsByType: Record<ServiceRequestType, number>;
  averageCompletionTime: number; // in hours
  onTimeCompletionRate: number; // percentage
  totalCost: number;
  averageCost: number;
  partsUtilization: {
    totalPartsRequested: number;
    totalPartsUsed: number;
    utilizationRate: number;
  };
  technicianWorkload: {
    technicianId: string;
    technicianName: string;
    activeRequests: number;
    completedRequests: number;
    averageTime: number;
  }[];
}

// Workflow Management
export interface ServiceWorkflowStep {
  id: string;
  serviceRequestId: string;
  stepName: string;
  stepType: "Approval" | "Task" | "Checkpoint" | "Notification";
  status: "Pending" | "In Progress" | "Completed" | "Skipped" | "Failed";
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  order: number;
}

// Integration with existing service records
export interface ServiceRequestToRecordMapping {
  serviceRequestId: string;
  serviceRecordId: string;
  mappedAt: Date;
  mappedBy: string;
  notes?: string;
}

// Template system for common service requests
export interface ServiceRequestTemplate {
  id: string;
  name: string;
  description: string;
  serviceType: ServiceRequestType;
  defaultPriority: ServiceRequestPriority;
  estimatedDuration: number;
  requiredParts: {
    sparePartId: string;
    partName: string;
    estimatedQuantity: number;
  }[];
  workSteps: string[];
  checklistItems: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
