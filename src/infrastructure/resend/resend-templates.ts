export class AccountCreatedTemplate {
  name: string = '';
  provider: string = '';
  username: string = '';
  password: string = '';
}

export class BookingConfirmationTemplate {
  provider: string = '';
  vehicle: string = '';
  startDate: string = '';
  endDate: string = '';
  total: string = '';
  pickupTime: string = '';
  pickupLocation: string = '';
  providerPhone: string = '';
  providerEmail: string = '';
  bookingCode: string = '';
  invoiceUrl?: string;
  agreementUrl?: string;
}

export class WelcomeEmailTemplate {
  tenantName: string = '';
  name: string = '';
  username: string = '';
}

export class PaymentReceiptTemplate {
  amount: string;
  bookingCode: string;
  handledBy: string;
  notes: string;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber: string;
}
