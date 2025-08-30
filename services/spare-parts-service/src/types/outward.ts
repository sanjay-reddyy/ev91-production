// Types for spare parts outward flow and lifecycle management

export interface SparePartRequest {
  id: string;
  serviceRequestId: string;
  sparePartId: string;
  requestedBy: string;
  requestedQuantity: number;
  urgency: "Normal" | "Urgent" | "Emergency";
  justification: string;
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Issued"
    | "Installed"
    | "Returned";
  approvedBy?: string;
  approvedAt?: Date;
  issuedQuantity?: number;
  issuedAt?: Date;
  returnedQuantity?: number;
  returnReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SparePartRequestInput {
  serviceRequestId: string;
  sparePartId: string;
  requestedQuantity: number;
  urgency: "Normal" | "Urgent" | "Emergency";
  justification: string;
  technicianId: string;
}

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  vehicleId: string;
  technicianId: string;
  type: "Maintenance" | "Repair" | "Damage";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Waiting Parts" | "Completed" | "Closed";
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstalledPart {
  id: string;
  serviceRequestId: string;
  sparePartId: string;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  installedBy: string;
  installedAt: Date;
  warrantyExpiry: Date;
  removalDate?: Date;
  removalReason?: string;
  replacedPartId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartInstallationInput {
  serviceRequestId: string;
  sparePartId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  serialNumber?: string;
  technicianId: string;
  replacedPartId?: string;
  installationNotes?: string;
}

export interface PartReturnInput {
  sparePartId: string;
  quantity: number;
  unitCost: number;
  returnReason: string;
  technicianId: string;
  condition: "Good" | "Damaged" | "Defective";
}

export interface StockReservation {
  id: string;
  sparePartId: string;
  storeId: string;
  requestId: string;
  reservedQuantity: number;
  reservedBy: string;
  reservedAt: Date;
  expiresAt: Date;
  status: "Active" | "Expired" | "Released" | "Consumed";
}

export interface ServiceCostBreakdown {
  partsCost: number;
  laborCost: number;
  overheadCost: number;
  taxAmount: number;
  discountAmount: number;
  totalCost: number;
  margin: number;
  marginPercent: number;
}

export interface TechnicianLimit {
  technicianId: string;
  categoryId?: string;
  sparePartId?: string;
  maxValuePerRequest: number;
  maxQuantityPerRequest: number;
  requiresApproval: boolean;
  approverLevel: number;
}

export interface ApprovalWorkflow {
  id: string;
  requestId: string;
  level: number;
  approverId: string;
  status: "Pending" | "Approved" | "Rejected";
  comments?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface StockAvailability {
  sparePartId: string;
  storeId: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalStock: number;
  available: boolean;
  suggestedAlternatives?: string[];
}

export interface BatchInfo {
  batchNumber: string;
  quantity: number;
  unitCost: number;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplierId: string;
  receivedDate: Date;
}

// Filter interfaces
export interface PartRequestFilters {
  serviceRequestId?: string;
  technicianId?: string;
  status?: string;
  urgency?: string;
  sparePartId?: string;
  categoryId?: string;
  storeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ServiceAnalyticsFilters {
  technicianId?: string;
  storeId?: string;
  vehicleId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  costFrom?: number;
  costTo?: number;
}

export interface InstallationFilters {
  serviceRequestId?: string;
  vehicleId?: string;
  technicianId?: string;
  sparePartId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  warrantyStatus?: "Active" | "Expired" | "Expiring";
}

// Analytics interfaces
export interface PartUsageAnalytics {
  sparePartId: string;
  partName: string;
  totalUsage: number;
  totalCost: number;
  totalRevenue: number;
  margin: number;
  averageUsagePerService: number;
  usageFrequency: number;
  fastMoving: boolean;
}

export interface TechnicianUsageAnalytics {
  technicianId: string;
  technicianName: string;
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvalRate: number;
  totalPartsCost: number;
  averageRequestValue: number;
  topUsedParts: string[];
}

export interface ServiceCostAnalytics {
  period: string;
  totalServices: number;
  totalPartsCost: number;
  totalServiceCost: number;
  averagePartsPerService: number;
  averageCostPerService: number;
  topCostCategories: {
    categoryId: string;
    categoryName: string;
    totalCost: number;
  }[];
}

// Response interfaces
export interface PartRequestResponse {
  success: boolean;
  data?: SparePartRequest | SparePartRequest[];
  message: string;
  requestId?: string;
  approvalRequired?: boolean;
  stockAvailability?: StockAvailability;
}

export interface InstallationResponse {
  success: boolean;
  data?: InstalledPart;
  message: string;
  costImpact?: number;
  warrantyInfo?: {
    warrantyPeriod: number;
    warrantyExpiry: Date;
    terms: string;
  };
}

export interface ServiceCostResponse {
  success: boolean;
  data?: ServiceCostBreakdown;
  message: string;
  breakdown?: {
    parts: {
      sparePartId: string;
      partName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[];
    labor: { hours: number; ratePerHour: number; totalCost: number };
    overhead: { percentage: number; amount: number };
  };
}
