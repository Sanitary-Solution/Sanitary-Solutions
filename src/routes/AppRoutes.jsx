import { Routes, Route } from "react-router-dom";
import { CustomerLayout } from "../components/layout/CustomerLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { AdminLayout } from "../components/admin/AdminLayout";
import { Home } from "../pages/customer/Home";
import { Products } from "../pages/customer/Products";
import { ProductDetail } from "../pages/customer/ProductDetail";
import { Cart } from "../pages/customer/Cart";
import { Checkout } from "../pages/customer/Checkout";
import { Quote } from "../pages/customer/Quote";
import { Contact } from "../pages/customer/Contact";
import { AdminProducts } from "../pages/admin/AdminProducts";
import { AdminOrders } from "../pages/admin/AdminOrders";
import { AdminQuotes } from "../pages/admin/AdminQuotes";
import { AdminCustomers } from "../pages/admin/AdminCustomers";
import { Feedback } from "../pages/admin/Feedback";
import { Categories } from "../pages/admin/Categories";
import { Brands } from "../pages/admin/Brands";
import { Reports } from "../pages/admin/Reports";
import { Settings } from "../pages/admin/Settings";
import { Dashboard } from "../pages/admin/Dashboard";
import { AdminLogin } from "../pages/auth/AdminLogin";
import { CustomerLogin } from "../pages/auth/CustomerLogin";
import { CustomerSignup } from "../pages/auth/CustomerSignup";
import { OrderTracking } from "../pages/customer/OrderTracking";
import { MyAccount } from "../pages/customer/MyAccount";
import { NotFound } from "../pages/NotFound";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<CustomerLayout />}>
      <Route index element={<Home />} />
      <Route path="products" element={<Products />} />
      <Route path="products/:id" element={<ProductDetail />} />
      <Route path="cart" element={<Cart />} />
      <Route
        path="checkout"
        element={
          <ProtectedRoute allowedRoles={["customer"]} redirectTo="/login">
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route path="quote" element={<Quote />} />
      <Route path="contact" element={<Contact />} />
      <Route path="login" element={<CustomerLogin />} />
      <Route path="signup" element={<CustomerSignup />} />
      <Route
        path="orders/track"
        element={
          <ProtectedRoute allowedRoles={["customer"]} redirectTo="/login">
            <OrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="account"
        element={
          <ProtectedRoute allowedRoles={["customer"]} redirectTo="/login">
            <MyAccount />
          </ProtectedRoute>
        }
      />
    </Route>
    <Route path="/admin/login" element={<AdminLogin />} />

    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["admin"]} redirectTo="/admin/login">
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="categories" element={<Categories />} />
      <Route path="brands" element={<Brands />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="feedback" element={<Feedback />} />
      <Route path="quotes" element={<AdminQuotes />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="reports" element={<Reports />} />
      <Route path="settings" element={<Settings />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);
