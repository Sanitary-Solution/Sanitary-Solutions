import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { PriceDisplay } from "../../components/common/PriceDisplay";
import { useAuth } from "../../contexts/AuthContext";
import { createQuoteRequestApi, getStoreProductsApi } from "../../services/storeApi";
import { formatCurrency } from "../../utils/currency";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  projectType: "",
};

const getProductId = (product) => product?.id || product?._id || "";

const buildVariantOptions = (product) => {
  const sourceVariants =
    Array.isArray(product?.sizes) && product.sizes.length > 0
      ? product.sizes
      : [
          {
            label: "Default variant",
            price: product?.price ?? 0,
            quantity: product?.quantity ?? 0,
            inStock: product?.inStock ?? true,
          },
        ];

  return sourceVariants.map((variant, index) => {
    const label = String(variant?.label || "Default variant").trim();
    const price = Number(variant?.price ?? product?.price ?? 0);
    const quantity = Number(variant?.quantity ?? product?.quantity ?? 0);

    return {
      key: `${label.toLowerCase()}-${index}`,
      label,
      price,
      quantity,
      inStock: Boolean(variant?.inStock ?? quantity > 0),
    };
  });
};

const createSelectedVariant = (variant) => ({
  key: variant.key,
  label: variant.label,
  unitPrice: Number(variant.price || 0),
  quantity: 1,
});

export const Quote = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductsError("");
        const response = await getStoreProductsApi({ page: 1, limit: 500 });
        setProducts(response.data || []);
      } catch (apiError) {
        setProductsError(apiError.message || "Failed to load products for quote.");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (!user || user.role !== "customer") return;

    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const brandOptions = useMemo(() => {
    const brands = new Set();
    products.forEach((product) => {
      if (product?.brand) {
        brands.add(product.brand);
      }
    });

    Object.values(selectedItems).forEach((item) => {
      if (item?.brand) {
        brands.add(item.brand);
      }
    });

    return Array.from(brands).sort((left, right) => left.localeCompare(right));
  }, [products, selectedItems]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query)
    );
  }, [products, productSearch]);

  const selectedQuoteItems = useMemo(() => {
    return Object.values(selectedItems).flatMap((item) =>
      (item.variants || [])
        .filter((variant) => variant.selected && Number.parseInt(variant.quantity, 10) > 0)
        .map((variant) => ({
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          size: variant.label,
          quantity: Number.parseInt(variant.quantity, 10),
          unitPrice: Number(variant.unitPrice || 0),
          originalPrice: item.showDiscount ? Number(item.originalPrice || 0) : null,
          discountEnabled: Boolean(item.showDiscount),
        }))
    );
  }, [selectedItems]);

  const selectedVariantCount = useMemo(() => selectedQuoteItems.length, [selectedQuoteItems]);

  const selectedQuantityCount = useMemo(
    () => selectedQuoteItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedQuoteItems]
  );

  const selectedTotal = useMemo(
    () =>
      selectedQuoteItems.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0
      ),
    [selectedQuoteItems]
  );

  const setItemChecked = (product, checked) => {
    const productId = getProductId(product);
    if (!productId) return;

    setSelectedItems((prev) => {
      if (!checked) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }

      if (prev[productId]) {
        return prev;
      }

      const variantOptions = buildVariantOptions(product);
      const initialVariant = variantOptions[0];

      return {
        ...prev,
        [productId]: {
          productId,
          productName: product.name,
          brand: product.brand || "",
          originalPrice: product.originalPrice ?? null,
          discountEnabled: Boolean(product.discountEnabled),
          hasSizes: Array.isArray(product.sizes) && product.sizes.length > 0,
          showDiscount: Boolean(product.discountEnabled && !(Array.isArray(product.sizes) && product.sizes.length > 0)),
          variants: initialVariant ? [{ ...createSelectedVariant(initialVariant), selected: true }] : [],
        },
      };
    });
  };

  const setProductBrand = (productId, brand) => {
    setSelectedItems((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;

      return {
        ...prev,
        [productId]: {
          ...existing,
          brand,
        },
      };
    });
  };

  const toggleVariantSelection = (product, variant, checked) => {
    const productId = getProductId(product);
    if (!productId) return;

    setSelectedItems((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;

      const variants = existing.variants || [];
      const existingVariant = variants.find((item) => item.key === variant.key);

      if (checked) {
        if (existingVariant) {
          return {
            ...prev,
            [productId]: {
              ...existing,
              variants: variants.map((item) =>
                item.key === variant.key ? { ...item, selected: true } : item
              ),
            },
          };
        }

        return {
          ...prev,
          [productId]: {
            ...existing,
            variants: [...variants, { ...createSelectedVariant(variant), selected: true }],
          },
        };
      }

      const nextVariants = variants
        .map((item) => (item.key === variant.key ? { ...item, selected: false } : item))
        .filter((item) => item.selected);

      if (nextVariants.length === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }

      return {
        ...prev,
        [productId]: {
          ...existing,
          variants: nextVariants,
        },
      };
    });
  };

  const setVariantQuantity = (productId, variantKey, value) => {
    setSelectedItems((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;

      return {
        ...prev,
        [productId]: {
          ...existing,
          variants: (existing.variants || []).map((variant) =>
            variant.key === variantKey ? { ...variant, quantity: value } : variant
          ),
        },
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (selectedQuoteItems.length === 0) {
      setSubmitting(false);
      setError("Please select at least one product variant for the quote.");
      return;
    }

    const productsNeeded = selectedQuoteItems
      .map(
        (item) =>
          `${item.productName}${item.size ? ` - Variant: ${item.size}` : ""}${
            item.brand ? ` (${item.brand})` : ""
          } x ${item.quantity}`
      )
      .join(", ");

    try {
      await createQuoteRequestApi({
        ...formData,
        productsNeeded,
        productsCount: selectedQuantityCount,
        total: Number(selectedTotal.toFixed(2)),
        quoteItems: selectedQuoteItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          size: item.size,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice || 0),
        })),
      });

      setSubmitted(true);
      setFormData(INITIAL_FORM);
      setSelectedItems({});
    } catch (apiError) {
      setError(apiError.message || "Failed to submit quote request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Request a quote</h1>
            <p className="text-sm text-gray-500">
              Select products, choose one or more variants, and pick the brand you want quoted.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                Quote request received. Our sales team will reach out within 24 hours.
              </div>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <Label>Full name</Label>
                <Input
                  required
                  placeholder="Muhammad Usman"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    required
                    placeholder="usman@email.com"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    required
                    placeholder="+92 333 444 7788"
                    value={formData.phone}
                    onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Project type (optional)</Label>
                <Input
                  placeholder="Residential renovation"
                  value={formData.projectType}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, projectType: event.target.value }))
                  }
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Label>Products needed</Label>
                  <Input
                    className="max-w-xs"
                    placeholder="Search products"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                  />
                </div>

                <div className="max-h-[380px] space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
                  {loadingProducts ? <p className="text-sm text-gray-500">Loading products...</p> : null}
                  {productsError ? <p className="text-sm text-red-600">{productsError}</p> : null}

                  {!loadingProducts && !productsError && filteredProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">No products match your search.</p>
                  ) : null}

                  {filteredProducts.map((product) => {
                    const productId = getProductId(product);
                    const selectedProduct = selectedItems[productId];
                    const variantOptions = buildVariantOptions(product);
                    const showProductDiscount = Boolean(
                      product.discountEnabled && (!Array.isArray(product.sizes) || product.sizes.length === 0)
                    );

                    return (
                      <div key={productId} className="rounded-lg border border-gray-200 p-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={Boolean(selectedProduct)}
                            onChange={(event) => setItemChecked(product, event.target.checked)}
                          />
                          <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <PriceDisplay
                                  price={product.price}
                                  originalPrice={product.originalPrice}
                                  discountEnabled={product.discountEnabled}
                                  priceClassName="text-sm font-semibold text-blue-600"
                                  originalClassName="text-xs text-gray-400 line-through"
                                />
                              </div>
                            <p className="text-xs text-gray-500">
                              {product.category} | Brand: {product.brand}
                            </p>
                          </div>
                        </label>

                        {selectedProduct ? (
                          <div className="mt-3 space-y-4 border-t border-gray-100 pt-3">
                            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                              <div>
                                <Label>Brand</Label>
                                <Select
                                  value={selectedProduct.brand}
                                  onChange={(event) => setProductBrand(productId, event.target.value)}
                                >
                                  {brandOptions.length === 0 ? (
                                    <option value="">No brands available</option>
                                  ) : (
                                    brandOptions.map((brand) => (
                                      <option key={brand} value={brand}>
                                        {brand}
                                      </option>
                                    ))
                                  )}
                                </Select>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                                Select the brand and one or more variants you want quoted.
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-900">Variants</p>
                              <p className="text-xs text-gray-500">
                                Choose one or more variants and set the quantities you need.
                              </p>
                              <div className="mt-3 space-y-3">
                                {variantOptions.map((variant) => {
                                  const selectedVariant = (selectedProduct.variants || []).find(
                                    (item) => item.key === variant.key
                                  );
                                  const isSelected = Boolean(selectedVariant);

                                  return (
                                    <div key={variant.key} className="rounded-xl border border-gray-200 p-3">
                                      <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                          type="checkbox"
                                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          checked={isSelected}
                                          onChange={(event) =>
                                            toggleVariantSelection(product, variant, event.target.checked)
                                          }
                                        />
                                        <div className="flex-1">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-gray-900">{variant.label}</p>
                                            <PriceDisplay
                                              price={variant.price}
                                              originalPrice={product.originalPrice}
                                              discountEnabled={showProductDiscount}
                                              priceClassName="text-sm font-semibold text-blue-600"
                                              originalClassName="text-xs text-gray-400 line-through"
                                            />
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            {variant.quantity > 0
                                              ? `${variant.quantity} available`
                                              : "Out of stock"}
                                          </p>
                                        </div>
                                      </label>

                                      {isSelected ? (
                                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
                                          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                                            Variant: {variant.label}
                                          </div>
                                          <div>
                                            <Label>Quantity</Label>
                                            <Input
                                              type="number"
                                              min={1}
                                              value={selectedVariant.quantity}
                                              onChange={(event) =>
                                                setVariantQuantity(
                                                  productId,
                                                  variant.key,
                                                  event.target.value
                                                )
                                              }
                                              required
                                            />
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting || loadingProducts}>
                {submitting ? "Submitting..." : "Submit request"}
              </Button>
            </form>
          </Card>

          <Card className="h-fit p-6">
            <h2 className="text-lg font-semibold text-gray-900">Quote summary</h2>
            <p className="mt-2 text-sm text-gray-600">
              Selected variants: <span className="font-semibold">{selectedVariantCount}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Total quantity: <span className="font-semibold">{selectedQuantityCount}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Estimated total: <span className="font-semibold">{formatCurrency(selectedTotal)}</span>
            </p>
            {selectedQuoteItems.length > 0 ? (
              <div className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Selected variants</p>
                <div className="space-y-3">
                  {selectedQuoteItems.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.size}-${index}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">
                          {item.brand ? `${item.brand} - ` : ""}
                          Variant: {item.size}
                        </p>
                        <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <PriceDisplay
                          price={item.unitPrice}
                          originalPrice={item.originalPrice}
                          discountEnabled={item.discountEnabled}
                          priceClassName="font-semibold text-gray-900"
                          originalClassName="text-xs text-gray-400 line-through"
                        />
                        <p className="text-xs text-gray-500">
                          Line total: {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
              Admin can update quote status. You can track it from the tracking page after login.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
