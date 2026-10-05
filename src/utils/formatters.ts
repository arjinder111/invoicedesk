export const formatCurrency = (value: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}-${random}`;
};
