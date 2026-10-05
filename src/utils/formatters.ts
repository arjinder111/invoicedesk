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

export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num || 0) === 0) return '';
  const n = num.toString().split('.')[0]; // ignores decimals
  const numString = n.padStart(9, '0'); // pad to 9 digits (crores)

  const crores = parseInt(numString.substring(0, 2), 10);
  const lakhs = parseInt(numString.substring(2, 4), 10);
  const thousands = parseInt(numString.substring(4, 6), 10);
  const hundreds = parseInt(numString.substring(6, 7), 10);
  const tens = parseInt(numString.substring(7, 9), 10);

  let str = '';
  if (crores > 0) str += (a[crores] || b[Math.floor(crores / 10)] + ' ' + a[crores % 10]) + 'Crore ';
  if (lakhs > 0) str += (a[lakhs] || b[Math.floor(lakhs / 10)] + ' ' + a[lakhs % 10]) + 'Lakh ';
  if (thousands > 0) str += (a[thousands] || b[Math.floor(thousands / 10)] + ' ' + a[thousands % 10]) + 'Thousand ';
  if (hundreds > 0) str += a[hundreds] + 'Hundred ';
  if (tens > 0) str += (str !== '' ? 'and ' : '') + (a[tens] || b[Math.floor(tens / 10)] + ' ' + a[tens % 10]);

  return str.trim() + ' Only';
};
