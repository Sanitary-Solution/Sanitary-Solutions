import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { ImageWithFallback } from "../common/ImageWithFallback";
import { PriceDisplay } from "../common/PriceDisplay";
import { useCart } from "../../contexts/CartContext";

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const productId = product.id || product._id;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product);
  };

  return (
    <Link to={`/products/${productId}`} className="group">
      <Card className="h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {product.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  product.inStock
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between px-4 py-3">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            discountEnabled={product.discountEnabled}
            priceClassName="text-lg font-semibold text-blue-600"
          />
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="shadow"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
