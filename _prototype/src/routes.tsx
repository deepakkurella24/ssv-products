import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import { COMPANY_LINKS } from "./data/site";

// Secondary routes are code-split; the root layout shows the emblem loading screen meanwhile.
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const CustomOrderPage = lazy(() => import("./pages/CustomOrderPage"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const OrdersPage = lazy(() => import("./pages/account/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/account/OrderDetailPage"));
const AddressesPage = lazy(() => import("./pages/account/AddressesPage"));
const RequestsPage = lazy(() => import("./pages/account/RequestsPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Admin app: separate layout, code-split from the storefront.
const AdminApp = lazy(() => import("./admin/AdminApp"));
const admin = <T extends string>(name: T) =>
  lazy(() =>
    import("./admin/screens").then((m) => ({
      default: m[name as keyof typeof m] as React.ComponentType,
    })),
  );
const OrdersSection = admin("OrdersSection");
const OrderDetailRoute = admin("OrderDetailRoute");
const RequestsSection = admin("RequestsSection");
const RequestDetailRoute = admin("RequestDetailRoute");
const ProductsSection = admin("ProductsSection");
const ProductEditRoute = admin("ProductEditRoute");
const CategoriesPage = admin("CategoriesPage");
const CouponsSection = admin("CouponsSection");
const CouponEditRoute = admin("CouponEditRoute");
const AnalyticsPage = admin("AnalyticsPage");
const MorePage = admin("MorePage");
const AdminNotFound = admin("AdminNotFound");

// Index of a split view: nothing is selected yet, so the detail pane shows a placeholder.
const NoSelection = () => null;

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const router = createBrowserRouter(
  [
    {
      path: "/admin",
      element: (
        <Suspense fallback={null}>
          <AdminApp />
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="orders" replace /> },
        {
          path: "orders",
          Component: OrdersSection,
          children: [
            { index: true, Component: NoSelection },
            { path: ":id", Component: OrderDetailRoute },
          ],
        },
        {
          path: "requests",
          Component: RequestsSection,
          children: [
            { index: true, Component: NoSelection },
            { path: ":id", Component: RequestDetailRoute },
          ],
        },
        {
          path: "products",
          Component: ProductsSection,
          children: [
            { index: true, Component: NoSelection },
            { path: ":id", Component: ProductEditRoute },
          ],
        },
        { path: "categories", Component: CategoriesPage },
        {
          path: "coupons",
          Component: CouponsSection,
          children: [
            { index: true, Component: NoSelection },
            { path: ":id", Component: CouponEditRoute },
          ],
        },
        { path: "analytics", Component: AnalyticsPage },
        { path: "more", Component: MorePage },
        { path: "*", Component: AdminNotFound },
      ],
    },
    {
      path: "/",
      Component: RootLayout,
      children: [
        { index: true, Component: HomePage },
        { path: "products", Component: ProductsPage },
        { path: "products/:slug", Component: ProductDetailPage },
        { path: "cart", Component: CartPage },
        { path: "checkout", Component: CheckoutPage },
        { path: "order-confirmation/:id", Component: OrderConfirmationPage },
        { path: "custom-order", Component: CustomOrderPage },
        {
          path: "account",
          Component: AccountLayout,
          children: [
            { index: true, element: <Navigate to="orders" replace /> },
            { path: "orders", Component: OrdersPage },
            { path: "orders/:id", Component: OrderDetailPage },
            { path: "addresses", Component: AddressesPage },
            { path: "custom-requests", Component: RequestsPage },
          ],
        },
        ...COMPANY_LINKS.map((link) => ({
          path: link.to.slice(1),
          element: <InfoPage title={link.label} />,
        })),
        { path: "*", Component: NotFoundPage },
      ],
    },
  ],
  { basename },
);
