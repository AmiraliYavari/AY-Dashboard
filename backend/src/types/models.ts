export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: CustomerStatus;
  created_at: string;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: number;
  invoice_no: string;
  customer_id: number;
  amount: string; // numeric columns come back as strings from pg
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  created_at: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  category: string;
  amount: string;
  customer_id: number | null;
  description: string | null;
  txn_date: string;
  created_at: string;
}

export interface JwtPayload {
  id: number;
  role: UserRole;
  name: string;
}
