export const formatPrice = (price) => {
  if (price === undefined || price === null) return '₹0';
  // Standard Indian numbering system (e.g., 18,999)
  const num = Number(price);
  return `₹${num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })}`;
};

export const formatPriceWithDecimals = (price) => {
  if (price === undefined || price === null) return '₹0.00';
  const num = Number(price);
  return `₹${num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })}`;
};
