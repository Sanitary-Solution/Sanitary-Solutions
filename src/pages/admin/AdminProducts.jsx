import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table, TBody, Td, Th, THead } from "../../components/ui/Table";
import { ProductDialog } from "../../components/admin/ProductDialog";
import { Modal } from "../../components/ui/Modal";
import { formatCurrency } from "../../utils/currency";
import {
  createProductApi,
  deleteProductApi,
  getBrandsApi,
  getCategoriesApi,
  getProductsApi,
  updateProductApi,
} from "../../services/adminApi";

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const categoryOptions = useMemo(() => categories.map((category) => category.name), [categories]);
  const brandOptions = useMemo(() => brands.map((brand) => brand.name), [brands]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.brand} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [products, searchQuery]
  );

  const fetchProductsAndOptions = async () => {
    try {
      setLoading(true);
      setError("");

      const [{ data: productsData }, categoriesData, brandsData] = await Promise.all([
        getProductsApi({ page: 1, limit: 500 }),
        getCategoriesApi(),
        getBrandsApi(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (apiError) {
      setError(apiError.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndOptions();
  }, []);

  const handleSave = async (productData) => {
    setError("");
    setFeedback("");

    try {
      if (selectedProduct) {
        const updated = await updateProductApi(selectedProduct._id, productData);
        setProducts((prev) => prev.map((item) => (item._id === selectedProduct._id ? updated : item)));
        setFeedback("Product updated successfully.");
      } else {
        const created = await createProductApi(productData);
        setProducts((prev) => [created, ...prev]);
        setFeedback("Product added successfully.");
      }

      setDialogOpen(false);
      setSelectedProduct(null);
    } catch (apiError) {
      setError(apiError.message || "Failed to save product.");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete product "${product.name}"?`);
    if (!confirmed) return;

    setError("");
    setFeedback("");

    try {
      await deleteProductApi(product._id);
      setProducts((prev) => prev.filter((item) => item._id !== product._id));
      setFeedback("Product deleted successfully.");
    } catch (apiError) {
      setError(apiError.message || "Failed to delete product.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">
            Add, view, edit, delete, and search products in your catalog.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setDialogOpen(true);
          }}
          disabled={categoryOptions.length === 0 || brandOptions.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {categoryOptions.length === 0 || brandOptions.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-amber-700">
            Add at least one category and one brand before creating products.
          </p>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            className="w-full text-sm text-gray-700 outline-none"
            placeholder="Search products"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading products...</p> : null}
        {feedback ? <p className="mb-4 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <Table>
          <THead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Stock</Th>
              <Th>Price</Th>
              <Th></Th>
            </tr>
          </THead>
          <TBody>
            {filteredProducts.map((product) => (
              <tr key={product._id} className="border-b border-gray-100">
                <Td>
                  <div>
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.brand}</p>
                  </div>
                </Td>
                <Td>{product.category}</Td>
                <Td>{product.quantity}</Td>
                <Td>{formatCurrency(product.price)}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(product)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={selectedProduct}
        onSave={handleSave}
        categoryOptions={categoryOptions}
        brandOptions={brandOptions}
      />

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={selectedProduct?.name || "Product details"}
        description="Product details and catalog information."
      >
        {selectedProduct ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="space-y-3">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="h-56 w-full rounded-xl object-cover"
              />
              {(selectedProduct.images || []).length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {(selectedProduct.images || []).map((image, index) => (
                    <img
                      key={`${selectedProduct._id}-thumb-${index}`}
                      src={image}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <p>
              <span className="font-semibold">Category:</span> {selectedProduct.category}
            </p>
            <p>
              <span className="font-semibold">Brand:</span> {selectedProduct.brand}
            </p>
            <p>
              <span className="font-semibold">Price:</span> {formatCurrency(selectedProduct.price)}
            </p>
            <p>
              <span className="font-semibold">Stock:</span> {selectedProduct.quantity}
            </p>
            {(selectedProduct.sizes || []).length > 0 ? (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Variants</p>
                <div className="mt-3 space-y-2">
                  {selectedProduct.sizes.map((size, index) => (
                    <div
                      key={`${selectedProduct._id}-size-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-gray-600">{size.label}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(size.price)}</span>
                      <span className="text-gray-500">{size.quantity} in stock</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <p>
              <span className="font-semibold">Description:</span> {selectedProduct.description}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
