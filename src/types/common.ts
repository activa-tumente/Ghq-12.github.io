/**
 * Common TypeScript type definitions used across the application
 */

// Base utility types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface TimestampedEntity extends BaseEntity {
  created_by?: string;
  updated_by?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  field?: string;
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error' | 'network_error';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Loading and async states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: number;
}

export interface AsyncAction<T> {
  execute: (...args: any[]) => Promise<T>;
  loading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
}

// Form types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
  disabled?: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
}

export interface ValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
}

export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

// Filter and sort types
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: any;
}

export interface SearchConfig {
  query: string;
  fields: string[];
  caseSensitive?: boolean;
}

// UI Component types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: MenuItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// Theme and styling types
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

export interface ThemeConfig {
  colors: Record<ColorVariant, string>;
  spacing: Record<Size, string>;
  borderRadius: Record<Size, string>;
  fontSize: Record<Size, string>;
}

// Permission and role types
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: Role[];
  preferences?: UserPreferences;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

// File and upload types
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Analytics and tracking types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp: number;
  tags?: Record<string, string>;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    [key: string]: boolean;
  };
  limits: {
    maxFileSize: number;
    maxFilesPerUpload: number;
    sessionTimeout: number;
  };
  integrations: {
    supabase: {
      url: string;
      anonKey: string;
    };
    analytics?: {
      trackingId: string;
      enabled: boolean;
    };
  };
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type NonNullable<T> = T extends null | undefined ? never : T;

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type ChangeHandler<T = any> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;

// Hook return type helpers
export interface UseAsyncReturn<T, P extends any[] = []> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: P) => Promise<T>;
  reset: () => void;
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  reset: (values?: Partial<T>) => void;
  handleSubmit: (onSubmit: SubmitHandler<T>) => EventHandler;
}

// Export commonly used React types
export type { 
  ReactNode, 
  ReactElement, 
  ComponentType, 
  FC, 
  PropsWithChildren 
} from 'react';