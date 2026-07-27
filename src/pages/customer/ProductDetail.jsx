import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import { Button } from "../../components/ui/Button";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency } from "../../utils/currency";
import { getStoreProductByIdApi } from "../../services/storeApi";

export const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSizeLabel, setSelectedSizeLabel] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getStoreProductByIdApi(id);
        setProduct(data);
      } catch (apiError) {
        setError(apiError.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const images = useMemo(
    () => (product?.images?.length > 0 ? product.images : product?.image ? [product.image] : []),
    [product]
  );

  const sizes = useMemo(() => (Array.isArray(product?.sizes) ? product.sizes : []), [product]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedSizeLabel(sizes[0]?.label || "");
  }, [product, sizes]);

  const selectedSize = useMemo(
    () => sizes.find((size) => size.label === selectedSizeLabel) || sizes[0] || null,
    [sizes, selectedSizeLabel]
  );

  const activePrice = selectedSize?.price ?? product?.price ?? 0;
  const activeStock = selectedSize?.quantity ?? product?.quantity ?? 0;
  const activeImage = images[selectedImageIndex] || product?.image || "";
  const activeSizeLabel = selectedSize?.label || "Default";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">{error || "Product not found."}</p>
          <Link to="/products">
            <Button className="mt-4">Back to products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (sizes.length > 0 && selectedSize) {
      addToCart(product, { size: selectedSize });
      return;
    }

    addToCart(product);
  };

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <ImageWithFallback
            src={activeImage}
            alt={product.name}
            className="h-[420px] w-full rounded-2xl object-cover"
          />
          {images.length > 1 ? (
            <div className="flex flex-wrap gap-3">
              {images.map((image, index) => (
                <button
                  key={`${product._id}-image-${index}`}
                  type="button"
                  aria-pressed={selectedImageIndex === index}
                  className={`overflow-hidden rounded-xl border-2 bg-white transition ${
                    selectedImageIndex === index
                      ? "border-blue-600 shadow-sm ring-2 ring-blue-600/10"
                      : "border-gray-200 hover:border-blue-200"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">{product.category}</p>
            <h1 className="text-3xl font-semibold text-gray-900">{product.name}</h1>
          </div>

          <p className="text-gray-600">{product.description}</p>

          {sizes.length > 0 ? (
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Choose a variant</p>
                  <p className="text-xs text-gray-500">
                    Price and stock update as soon as you select a variant.
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {sizes.length} options
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {sizes.map((size) => (
                  <button
                    key={size.label}
                    type="button"
                    onClick={() => setSelectedSizeLabel(size.label)}
                    aria-pressed={selectedSizeLabel === size.label}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      selectedSizeLabel === size.label
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-600/10"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{size.label}</span>
                      <span className="text-xs font-semibold">{formatCurrency(size.price)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {size.quantity > 0 ? `${size.quantity} in stock` : "Out of stock"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Selected variant</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{activeSizeLabel}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">Price</p>
            <p className="text-3xl font-semibold text-blue-600">{formatCurrency(activePrice)}</p>
            <p className="mt-2 text-sm text-gray-500">
              Stock status: {activeStock > 0 ? "Available" : "Out of stock"}
            </p>
            <Button
              className="mt-4 w-full"
              onClick={handleAddToCart}
              disabled={activeStock <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Brand</p>
              <p className="text-sm font-semibold text-gray-900">{product.brand}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Inventory {selectedSize ? `(${selectedSize.label})` : ""}
              </p>
              <p className="text-sm font-semibold text-gray-900">{activeStock} units</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
