// Shared types for Unified Service Management

export type ServiceRequestType =
  | "PREVENTIVE"
  | "REPAIR"
  | "INSPECTION"
  | "RECALL"
  | "WARRANTY"
  | "EMERGENCY";
export type ServiceRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type ServiceRequestPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ServiceRequestPart {
  id?: string;
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isRequired: boolean;
  specifications?: string;
}

export interface ServiceRequest {
  id?: string;
  ticketNumber?: string;
  vehicleId: string;
  serviceType: ServiceRequestType;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  title: string;
  description: string;
  issueReported?: string;
  symptoms?: string[];
  requestedDate?: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  serviceLocation?: string;
  estimatedDuration?: number;
  customerApprovalRequired: boolean;
  tags?: string[];
  notes?: string;
  parts?: ServiceRequestPart[];
  totalEstimatedCost?: number;
  totalActualCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
  vehicle?: {
    registrationNumber: string;
    model: {
      name: string;
      oem: { name: string };
    };
  };
}

export interface ServiceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  totalCost: number;
}

export interface UnifiedServiceRequestFormProps {
  vehicleId?: string;
  initialData?: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (request?: ServiceRequest) => void;
}
