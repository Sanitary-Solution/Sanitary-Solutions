import { formatCurrency } from "../../utils/currency";

export const PriceDisplay = ({
  price,
  originalPrice,
  discountEnabled = false,
  className = "",
  originalClassName = "text-sm text-gray-500 line-through",
  priceClassName = "text-lg font-semibold text-blue-600",
}) => {
  const effectivePrice = Number(price || 0);
  const effectiveOriginalPrice = Number(originalPrice || 0);
  const hasDiscount = discountEnabled && effectiveOriginalPrice > effectivePrice;

  if (!hasDiscount) {
    return <span className={priceClassName}>{formatCurrency(effectivePrice)}</span>;
  }

  return (
    <span className={`flex flex-col gap-0.5 ${className}`.trim()}>
      <span className={originalClassName}>{formatCurrency(effectiveOriginalPrice)}</span>
      <span className={priceClassName}>{formatCurrency(effectivePrice)}</span>
    </span>
  );
};
