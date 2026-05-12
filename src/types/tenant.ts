import {
  Customer,
  TenantLocation,
  TenantVendor,
  Vehicle,
} from '../generated/prisma/client.js';

export interface TenantExtra {
  id?: string;
  name?: string;
  price?: number;
  coverageAmount?: number;
  quantity?: number;
  type: 'insurance' | 'service' | 'equipment';
  [key: string]: unknown;
}

export type ActivityType =
  | 'pickup'
  | 'return'
  | 'maintenance'
  | 'inspection'
  | 'meeting'
  | 'payment';
export interface Activity {
  id: string;
  type: ActivityType;
  time: string;
  title: string;
  description: string;
  vehicle?: Vehicle;
  customer?: Customer;
  status?: string;
  location?: TenantLocation;
  vendor?: TenantVendor;
}
