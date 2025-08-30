import { PurchaseOrderItemRequest } from "../types";

export interface PurchaseOrderModel {
  id: string;
  orderNumber: string;
  supplierId: string;
  storeId: string;
  storeName: string;
  orderDate: Date;
  expectedDate?: Date;
  deliveryDate?: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status:
    | "DRAFT"
    | "SENT"
    | "CONFIRMED"
    | "PARTIAL"
    | "DELIVERED"
    | "CANCELLED";
  urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notes?: string;
  terms?: string;
  createdBy: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseOrderItemModel[];
}

export interface PurchaseOrderItemModel extends PurchaseOrderItemRequest {
  id: string;
  purchaseOrderId: string;
  receivedQuantity: number;
  totalCost: number;
  status: "PENDING" | "PARTIAL" | "RECEIVED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}
