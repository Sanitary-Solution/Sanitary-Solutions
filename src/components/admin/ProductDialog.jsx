import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";

const EMPTY_SIZE = { label: "", price: 0, quantity: 0 };

const getDefaultFormData = (categoryOptions, brandOptions) => ({
  name: "",
  description: "",
  price: 0,
  discountEnabled: false,
  discountedPrice: 0,
  category: categoryOptions[0] || "",
  brand: brandOptions[0] || "",
  image: "",
  images: [""],
  quantity: 0,
  inStock: true,
  rating: 4.5,
  reviews: 10,
  sizes: [],
});

const normalizeSizesForForm = (sizes = []) =>
  sizes.length > 0
    ? sizes.map((size) => ({
        label: size.label || "",
        price: Number(size.price || 0),
        quantity: Number(size.quantity || 0),
      }))
    : [];

const pickEditableFields = (product, fallback) => ({
  name: product?.name ?? fallback.name,
  description: product?.description ?? fallback.description,
  price: product?.originalPrice ?? product?.price ?? fallback.price,
  discountEnabled: Boolean(product?.discountEnabled),
  discountedPrice: product?.discountedPrice ?? product?.price ?? fallback.discountedPrice,
  category: product?.category ?? fallback.category,
  brand: product?.brand ?? fallback.brand,
  image: product?.image ?? fallback.image,
  images:
    product?.images?.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : fallback.images,
  quantity: product?.quantity ?? fallback.quantity,
  inStock: product?.inStock ?? fallback.inStock,
  rating: product?.rating ?? fallback.rating,
  reviews: product?.reviews ?? fallback.reviews,
  sizes: normalizeSizesForForm(product?.sizes),
});

const normalizeImageList = (images = []) =>
  images
    .map((image) => String(image || "").trim())
    .filter(Boolean);

export const ProductDialog = ({
  open,
  onClose,
  product,
  onSave,
  categoryOptions = [],
  brandOptions = [],
}) => {
  const defaults = useMemo(
    () => getDefaultFormData(categoryOptions, brandOptions),
    [categoryOptions, brandOptions]
  );

  const [formData, setFormData] = useState(defaults);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      const nextData = pickEditableFields(product, defaults);
      setFormData(nextData);
      setImagePreview(nextData.images[0] || nextData.image || "");
      return;
    }

    setFormData(defaults);
    setImagePreview("");
  }, [product, open, defaults]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (index, value) => {
    setFormData((prev) => {
      const nextImages = [...prev.images];
      nextImages[index] = value;
      return {
        ...prev,
        images: nextImages,
        image: nextImages.find((image) => String(image || "").trim()) || "",
      };
    });
    setImagePreview(value);
  };

  const handleAddImage = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, imageIndex) => imageIndex !== index);
      const normalized = nextImages.length > 0 ? nextImages : [""];
      const primaryImage = normalized.find((image) => String(image || "").trim()) || "";
      setImagePreview(primaryImage);
      return {
        ...prev,
        images: normalized,
        image: primaryImage,
      };
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const fileUrls = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) {
              reject(new Error("File size should not exceed 5MB"));
              return;
            }
            if (!file.type.startsWith("image/")) {
              reject(new Error("Please upload image files only"));
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Unable to read image file"));
            reader.readAsDataURL(file);
          })
      )
    ).catch((error) => {
      alert(error.message || "Unable to upload image");
      return [];
    });

    if (fileUrls.length > 0) {
      setFormData((prev) => {
        const currentImages = normalizeImageList(prev.images);
        const nextImages = [...currentImages, ...fileUrls.filter(Boolean)];
        const primaryImage = nextImages[0] || "";
        setImagePreview(primaryImage);
        return {
          ...prev,
          images: nextImages.length > 0 ? nextImages : [""],
          image: primaryImage,
        };
      });
    }

    event.target.value = "";
  };

  const handleAddSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { ...EMPTY_SIZE, price: prev.price || 0 }],
    }));
  };

  const handleSizeChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, sizeIndex) =>
        sizeIndex === index ? { ...size, [field]: value } : size
      ),
    }));
  };

  const handleRemoveSize = (index) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, sizeIndex) => sizeIndex !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedImages = normalizeImageList(formData.images);
    if (normalizedImages.length === 0) {
      alert("Please add at least one product image.");
      return;
    }

    const normalizedSizes = formData.sizes
      .map((size) => ({
        label: String(size.label || "").trim(),
        price: Number(size.price || 0),
        quantity: Number.parseInt(size.quantity, 10) || 0,
      }))
      .filter((size) => size.label);

    const hasSizes = normalizedSizes.length > 0;
    const discountEnabled = Boolean(formData.discountEnabled);
    const originalPrice = Number(formData.price) || 0;
    const discountedPrice = discountEnabled ? Number(formData.discountedPrice) || 0 : null;

    if (discountEnabled && discountedPrice >= originalPrice) {
      alert("Discounted price must be lower than the original price.");
      return;
    }

    const primaryImage = normalizedImages[0];
    const totalQuantity = hasSizes
      ? normalizedSizes.reduce((sum, size) => sum + Number(size.quantity || 0), 0)
      : Number(formData.quantity) || 0;
    const derivedPrice = hasSizes
      ? Number(normalizedSizes[0]?.price || 0)
      : discountEnabled
      ? discountedPrice
      : originalPrice;

    onSave({
      ...formData,
      image: primaryImage,
      images: normalizedImages,
      originalPrice: discountEnabled ? originalPrice : null,
      discountedPrice: discountEnabled ? discountedPrice : null,
      discountEnabled,
      price: derivedPrice,
      quantity: totalQuantity,
      inStock: hasSizes ? totalQuantity > 0 : Boolean(formData.inStock) && totalQuantity > 0,
      sizes: normalizedSizes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Edit product" : "Add new product"}
      description="Add clear gallery images and variants so customers see the right product details."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Product name</Label>
          <Input
            required
            value={formData.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="Chrome Basin Faucet"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            required
            value={formData.description}
            onChange={(event) => handleChange("description", event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Select
              value={formData.category}
              onChange={(event) => handleChange("category", event.target.value)}
              required
            >
              {categoryOptions.length === 0 ? (
                <option value="">No category available</option>
              ) : (
                categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              )}
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select
              value={formData.brand}
              onChange={(event) => handleChange("brand", event.target.value)}
              required
            >
              {brandOptions.length === 0 ? (
                <option value="">No brand available</option>
              ) : (
                brandOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              )}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{formData.discountEnabled ? "Original price (Rs)" : "Price (Rs)"}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(event) => handleChange("price", Number(event.target.value) || 0)}
              required
            />
            {formData.discountEnabled ? (
              <p className="mt-1 text-xs text-gray-500">
                Enter the original price before the discount.
              </p>
            ) : formData.sizes.length > 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                When variants are added, the first variant price becomes the product price shown in the
                catalog.
              </p>
            ) : null}

            {formData.discountEnabled ? (
              <div className="mt-4">
                <Label>Discounted price (Rs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountedPrice}
                  onChange={(event) =>
                    handleChange("discountedPrice", Number(event.target.value) || 0)
                  }
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  The discounted price must be lower than the original price.
                </p>
              </div>
            ) : null}
          </div>
          <div>
            <Label>Stock quantity</Label>
            <Input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(event) => handleChange("quantity", Number.parseInt(event.target.value, 10) || 0)}
              required
            />
            {formData.sizes.length > 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                When variants are added, this becomes the total stock across all variants.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.discountEnabled}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                discountEnabled: event.target.checked,
                discountedPrice: event.target.checked
                  ? prev.discountedPrice || prev.price
                  : 0,
              }))
            }
          />
          <span className="text-sm text-gray-700">Enable discount</span>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <Label>Gallery images</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddImage}>
                <Plus className="h-4 w-4" />
                Add image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload files
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="mt-3 space-y-3">
            {formData.images.map((image, index) => (
              <div key={`image-${index}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="url"
                    value={image}
                    onChange={(event) => handleImageChange(index, event.target.value)}
                    placeholder="https://example.com/image.jpg"
                    required={index === 0}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveImage(index)}
                  disabled={formData.images.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {imagePreview ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img src={imagePreview} alt="Preview" className="h-48 w-full object-contain" />
            </div>
          ) : null}
          <p className="mt-2 text-xs text-gray-500">
            The first image becomes the primary product image everywhere else in the store.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Variants</Label>
              <p className="mt-1 text-xs text-gray-500">
                Optional. Add one row per variant with its own price and stock.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSize}>
              <Plus className="h-4 w-4" />
              Add variant
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {formData.sizes.map((size, index) => (
              <div key={`size-${index}`} className="rounded-xl border border-gray-200 p-4">
                <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                  <div>
                    <Label>Variant</Label>
                    <Input
                      value={size.label}
                      onChange={(event) => handleSizeChange(index, "label", event.target.value)}
                      placeholder="Small"
                      required
                    />
                  </div>
                  <div>
                    <Label>Price (Rs)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={size.price}
                      onChange={(event) => handleSizeChange(index, "price", Number(event.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={size.quantity}
                      onChange={(event) =>
                        handleSizeChange(index, "quantity", Number.parseInt(event.target.value, 10) || 0)
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSize(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {formData.sizes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                No variants yet. Add variants if this product needs different prices or stock by variant.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.inStock}
            onChange={(event) => handleChange("inStock", event.target.checked)}
          />
          <span className="text-sm text-gray-700">In stock</span>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={categoryOptions.length === 0 || brandOptions.length === 0}>
            {product ? "Update" : "Add"} product
          </Button>
        </div>
      </form>
    </Modal>
  );
};
