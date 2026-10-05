export type TemplateId = 'classic' | 'modern' | 'minimal' | 'shop' | 'electrical' | 'fertilizer';

export interface UserProfile {
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
}

export interface BusinessProfile {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  taxRegistrationNumber: string; // GSTIN
  pan?: string;
  state?: string;
  stateCode?: string;
  msme?: string;
  tagline?: string;
  logoUrl?: string;
  signatureUrl?: string;
  defaultCurrency?: string;
  businessType?: 'standard' | 'electrical' | 'fertilizer';
  paymentInstructions?: string;
  bankDetails?: string;
  defaultTerms?: string;
}

export interface ClientDetails {
  id?: string;
  clientName: string;
  email: string;
  phone: string;
  address: string;
  taxRegistrationNumber: string; // GSTIN
  pan?: string;
  state?: string;
  stateCode?: string;
}

export interface ProductDetails {
  id?: string;
  name: string;
  description: string;
  unitPrice: number;
  hsn?: string;
  unit?: string;
  taxRate?: number;
  taxInclusive?: boolean;
}

export interface LineItem {
  id: string;
  productId?: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  hsn?: string;
  unit?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  
  // Electrical fields
  modelNumber?: string;
  serialNumber?: string;
  
  // Fertilizer fields
  company?: string;
  technicalName?: string;
  crop?: string;
  batchNumber?: string;
  mfgDate?: string;
  expDate?: string;
  packs?: number;
  weightPerPack?: number;
  billingUnit?: 'pack' | 'weight' | 'unit';
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
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
  template?: TemplateId;
  placeOfSupply?: string;
  invoiceMode?: 'standard' | 'electrical' | 'fertilizer';
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  roundOff: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
}

export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';

export interface InvoiceData {
  id?: string;
  userId: string;
  status: InvoiceStatus;
  business: BusinessProfile;
  client: ClientDetails;
  details: InvoiceDetails;
  items: LineItem[];
  totals: InvoiceTotals;
  payments: PaymentRecord[];
  createdAt?: string;
  updatedAt?: string;
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
