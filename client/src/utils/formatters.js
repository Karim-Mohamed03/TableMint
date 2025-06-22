/**
 * Formats a currency amount according to the specified locale and currency.
 * @param {number} amount - The amount in cents/pence
 * @param {string} [currency='GBP'] - The currency code (e.g., 'GBP', 'USD')
 * @param {string} [locale='en-GB'] - The locale to use for formatting
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currency = 'GBP', locale = 'en-GB') => {
  if (!amount && amount !== 0) return '£0.00';
  
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  
  return formatter.format(amount / 100);
};

/**
 * Converts a decimal amount to cents/pence
 * @param {number} amount - The amount in decimal (e.g., 10.99)
 * @returns {number} The amount in cents/pence
 */
export const toCents = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Converts an amount from cents/pence to decimal
 * @param {number} amount - The amount in cents/pence
 * @returns {number} The amount in decimal
 */
export const fromCents = (amount) => {
  return amount / 100;
}; 