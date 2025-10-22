import { User } from "../types/auth";
import {
  DepartmentType,
  DEPARTMENT_CODES,
  DEPARTMENT_PERMISSIONS,
} from "../types/department";

/**
 * Determine the user's department type from their profile
 */
export function getUserDepartment(user: User | null): DepartmentType | null {
  if (!user) return null;

  // Check if user has department info
  if (user.department?.code) {
    // Map department code to DepartmentType
    const code = user.department.code.toUpperCase();

    // Find matching department type
    for (const [key, value] of Object.entries(DEPARTMENT_CODES)) {
      if (value === code) {
        return key as DepartmentType;
      }
    }
  }

  // Check by department name as fallback
  if (user.department?.name) {
    const name = user.department.name.toLowerCase();

    if (name.includes("sales")) return DepartmentType.SALES;
    if (name.includes("supply") || name.includes("logistics"))
      return DepartmentType.SUPPLY;
    if (name.includes("finance") || name.includes("accounting"))
      return DepartmentType.FINANCE;
    if (name.includes("vehicle") || name.includes("fleet"))
      return DepartmentType.EV_VEHICLE_TEAM;
    if (name.includes("inventory") || name.includes("warehouse"))
      return DepartmentType.INVENTORY_TEAM;
    if (name.includes("operation")) return DepartmentType.OPERATIONS;
    if (name.includes("management") || name.includes("executive"))
      return DepartmentType.MANAGEMENT;
  }

  // Check by user roles (role-based department detection)
  const roles = user.roles?.map((r) => r.name.toLowerCase()) || [];

  if (
    roles.some(
      (r) =>
        r.includes("admin") ||
        r.includes("super") ||
        r.includes("ceo") ||
        r.includes("director")
    )
  ) {
    return DepartmentType.MANAGEMENT;
  }

  if (roles.some((r) => r.includes("sales") || r.includes("account"))) {
    return DepartmentType.SALES;
  }

  if (roles.some((r) => r.includes("finance") || r.includes("accountant"))) {
    return DepartmentType.FINANCE;
  }

  if (roles.some((r) => r.includes("operations") || r.includes("dispatcher"))) {
    return DepartmentType.OPERATIONS;
  }

  // Default to operations if no specific department found
  return DepartmentType.OPERATIONS;
}

/**
 * Check if user has permission to view specific dashboard
 */
export function canViewDashboard(
  user: User | null,
  department: DepartmentType
): boolean {
  if (!user) return false;

  // Management can view all dashboards
  const userDept = getUserDepartment(user);
  if (userDept === DepartmentType.MANAGEMENT) return true;

  // Check if user's department matches requested dashboard
  if (userDept === department) return true;

  // Check user permissions
  const requiredPermissions = DEPARTMENT_PERMISSIONS[department];
  const userPermissions =
    user.roles?.flatMap(
      (role) =>
        role.permissions?.map((p) =>
          typeof p === "object" && "permission" in p
            ? `${p.permission.resource}:${p.permission.action}`
            : `${p.resource}:${p.action}`
        ) || []
    ) || [];

  // Check if user has any of the required permissions
  return requiredPermissions.some(
    (required) =>
      userPermissions.includes(required) ||
      userPermissions.includes("*:read") ||
      userPermissions.includes("dashboard:*:view")
  );
}

/**
 * Get list of dashboards user can access
 */
export function getAccessibleDashboards(user: User | null): DepartmentType[] {
  if (!user) return [];

  const userDept = getUserDepartment(user);

  // Management can access all dashboards
  if (userDept === DepartmentType.MANAGEMENT) {
    return Object.values(DepartmentType);
  }

  // Return user's primary dashboard
  if (userDept) {
    return [userDept];
  }

  return [];
}

/**
 * Get dashboard route for department
 */
export function getDashboardRoute(department: DepartmentType): string {
  const routes: Record<DepartmentType, string> = {
    [DepartmentType.SALES]: "/dashboard/sales",
    [DepartmentType.SUPPLY]: "/dashboard/supply",
    [DepartmentType.FINANCE]: "/dashboard/finance",
    [DepartmentType.EV_VEHICLE_TEAM]: "/dashboard/vehicles",
    [DepartmentType.INVENTORY_TEAM]: "/dashboard/inventory",
    [DepartmentType.OPERATIONS]: "/dashboard/operations",
    [DepartmentType.MANAGEMENT]: "/dashboard/management",
  };

  return routes[department] || "/dashboard";
}

/**
 * Get default dashboard for user
 */
export function getDefaultDashboard(user: User | null): string {
  const department = getUserDepartment(user);

  if (department) {
    return getDashboardRoute(department);
  }

  return "/dashboard";
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with abbreviations (K, L, Cr)
 */
export function formatNumber(num: number): string {
  if (num >= 10000000) {
    // 1 Crore
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    // 1 Lakh
    return `₹${(num / 100000).toFixed(2)}L`;
  }
  if (num >= 1000) {
    // 1 Thousand
    return `₹${(num / 1000).toFixed(1)}K`;
  }
  return `₹${num.toFixed(0)}`;
}

/**
 * Calculate trend direction
 */
export function getTrendDirection(value: number): "up" | "down" | "neutral" {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
}

/**
 * Get status color based on value and thresholds
 */
export function getStatusColor(
  value: number,
  thresholds: { good: number; warning: number; critical: number }
): "success" | "warning" | "error" | "info" {
  if (value >= thresholds.good) return "success";
  if (value >= thresholds.warning) return "warning";
  if (value >= thresholds.critical) return "error";
  return "error";
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get time-based greeting
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
