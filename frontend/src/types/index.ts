export type UserRole = 'admin' | 'manager' | 'viewer';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}

export interface ApiError {
  message?: string;
}

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: CustomerStatus;
}

export interface CustomerForm {
  id: number | '';
  name: string;
  company: string;
  email: string;
  phone: string;
  status: CustomerStatus;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: number;
  invoice_no: string;
  customer_id: number;
  customer_name: string;
  amount: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
}

export interface InvoiceForm {
  invoice_no: string;
  customer_id: string;
  amount: string;
  issue_date: string;
  due_date: string;
}

export type TransactionType = 'income' | 'expense';

export interface RecentTransaction {
  id: number;
  type: TransactionType;
  category: string;
  amount: string;
  description: string | null;
  txn_date: string;
  customer_name: string | null;
}

export interface DashboardSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  outstanding: { amount: number; count: number };
  activeCustomers: number;
}

export interface TrendPoint {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryPoint {
  category: string;
  total: number;
}

export interface TopCustomer {
  id: number;
  name: string;
  company: string | null;
  total_billed: number;
}

export interface Transaction extends RecentTransaction {
  customer_id: number | null;
}

export interface TransactionForm {
  type: TransactionType;
  category: string;
  amount: string;
  customer_id: string;
  description: string;
  txn_date: string;
}
