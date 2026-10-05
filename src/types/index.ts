export interface BusinessProfile {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  taxRegistrationNumber: string;
}

export interface ClientDetails {
  clientName: string;
  email: string;
  phone: string;
  address: string;
  taxRegistrationNumber: string;
}

export interface LineItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  paymentInstructions: string;
  terms: string;
  taxPercentage: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface InvoiceData {
  id?: string; // Firestore document ID
  userId: string;
  business: BusinessProfile;
  client: ClientDetails;
  details: InvoiceDetails;
  items: LineItem[];
  totals: InvoiceTotals;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

export interface SharedInvoiceRecord {
  id: string;
  invoiceId: string;
  userId: string;
  snapshot: Omit<InvoiceData, 'id' | 'userId'>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
