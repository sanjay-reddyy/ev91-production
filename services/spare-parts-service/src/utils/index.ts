import { PaginationParams, PaginationInfo, ApiResponse } from '../types';

/**
 * Utility functions for the Spare Parts Service
 */

// Pagination utilities
export const createPaginationInfo = (
  totalItems: number,
  page: number,
  limit: number
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  return {
    totalItems,
    totalPages,
    currentPage,
    pageSize: limit,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

export const getPaginationParams = (query: any): PaginationParams => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10));
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
};

export const getPrismaSkipTake = (page: number, limit: number) => {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};

// Response utilities
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  pagination?: PaginationInfo
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    pagination,
  };
};

export const createErrorResponse = (
  message: string,
  error?: string,
  errors?: Record<string, string[]>
): ApiResponse => {
  return {
    success: false,
    message,
    error,
    errors,
  };
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone);
};

export const validateGST = (gstNumber: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
};

export const validatePAN = (panNumber: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(panNumber);
};

// String utilities
export const generateCode = (prefix: string, length: number = 6): string => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, length - 2).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-IN').format(number);
};

// Date utilities
export const formatDate = (date: Date, format: string = 'dd/MM/yyyy'): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return format
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', year.toString());
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

// Business logic utilities
export const calculateMargin = (costPrice: number, sellingPrice: number): number => {
  if (costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
};

export const calculateMarkupPrice = (costPrice: number, markupPercent: number): number => {
  return costPrice * (1 + markupPercent / 100);
};

export const calculateDiscountedPrice = (price: number, discountPercent: number): number => {
  return price * (1 - discountPercent / 100);
};

export const getStockStatus = (currentStock: number, minimumStock: number, maximumStock: number): string => {
  if (currentStock === 0) return 'OUT_OF_STOCK';
  if (currentStock <= minimumStock * 0.5) return 'CRITICAL_STOCK';
  if (currentStock <= minimumStock) return 'LOW_STOCK';
  if (currentStock >= maximumStock) return 'EXCESS_STOCK';
  return 'NORMAL_STOCK';
};

export const getUrgencyLevel = (stockStatus: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  switch (stockStatus) {
    case 'OUT_OF_STOCK':
      return 'CRITICAL';
    case 'CRITICAL_STOCK':
      return 'HIGH';
    case 'LOW_STOCK':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
};

// Array utilities
export const groupBy = <T>(array: T[], keyGetter: (item: T) => string): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const key = keyGetter(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], keyGetter: (item: T) => any, order: 'asc' | 'desc' = 'asc'): T[] => {
  return array.sort((a, b) => {
    const aValue = keyGetter(a);
    const bValue = keyGetter(b);
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = <T>(array: T[], keyGetter?: (item: T) => any): T[] => {
  if (!keyGetter) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyGetter(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedTypes.some(type => type.includes(extension));
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await delay(delayMs);
      return retry(fn, retries - 1, delayMs);
    }
    throw error;
  }
};

// Security utilities
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim();
};

export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) return data;
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
};

// Export all utilities
export default {
  // Pagination
  createPaginationInfo,
  getPaginationParams,
  getPrismaSkipTake,
  
  // Response
  createSuccessResponse,
  createErrorResponse,
  
  // Validation
  validateEmail,
  validatePhone,
  validateGST,
  validatePAN,
  
  // String
  generateCode,
  slugify,
  formatCurrency,
  formatNumber,
  
  // Date
  formatDate,
  addDays,
  addMonths,
  isDateInRange,
  
  // Business
  calculateMargin,
  calculateMarkupPrice,
  calculateDiscountedPrice,
  getStockStatus,
  getUrgencyLevel,
  
  // Array
  groupBy,
  sortBy,
  unique,
  
  // File
  getFileExtension,
  isValidFileType,
  formatFileSize,
  
  // Async
  delay,
  retry,
  
  // Security
  sanitizeInput,
  maskSensitiveData,
};
