export interface BookingCompletedEmailDto {
  bookingId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  pickupTime: string;
  totalPrice: string;
  tenantName: string;
  phone: string;
  vehicle: string;
  email: string;
}

export interface NewBookingEmailDto {
  bookingId: string;
  bookingDate: string;
  vehicle: string;
  bookingStatus: string;
  totalPrice: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  driverLicense: string;
  customerAddress: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  pickupTime: string;
  returnTime: string;
  returnLocation: string;
  rentalDuration: string;
  vehiclePrice: string;
  additionsTotal: string;
  securityDeposit: string;
}

export interface BookingConfirmationEmailDto {
  bookingId: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  pickupLocation: string;
  totalPrice: string;
  tenantName: string;
  phone: string;
  vehicle: string;
  email: string;
  invoiceUrl?: string;
  agreementUrl?: string;
}

export interface BookingDeclinedEmailDto {
  bookingId: string;
  startDate: string;
  endDate: string;
  vehicle: string;
  tenantName: string;
  declineReason?: string;
}

export interface BookingDocumentsEmailDto {
  bookingId: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  pickupLocation: string;
  totalPrice: string;
  tenantName: string;
  phone: string;
  vehicle: string;
  email: string;
  documents: DocumentDto[];
}

interface DocumentDto {
  fileName: string;
  url: string;
}

interface BookingAddition {
  name: string;
  quantity: number;
  price: string;
  total: string;
}

interface PasswordResetEmailDto {
  verificationCode: token;
}

interface NewUserEmailDto {
  name: string;
  username: string;
  password: string;
  tenantName: string;
}

interface UserPasswordResetEmailDto {
  name: string;
  username: string;
  password: string;
  tenantName: string;
}

interface UserPasswordResetVerificationEmailDto {
  verificationCode: string;
}

interface VerificationEmailDto {
  verificationCode: string;
}
