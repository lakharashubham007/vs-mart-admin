import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";

/// Layout
import MainLayout from '../layouts/MainLayout';
import Footer from '../layouts/Footer';
import ScrollToTop from '../layouts/ScrollToTop';

/// Pages
import Dashboard from "../pages/Dashboard";
import ListEmployee from "../pages/employee/ListEmployee";
import CreateEmployee from "../pages/employee/CreateEmployee";
import EditEmployee from "../pages/employee/EditEmployee";
import AccessControl from "../pages/AccessControl";
import Profile from "../pages/Profile";

import ListProducts from "../pages/products/ListProducts";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";
import MasterManagement from "../pages/masters/MasterManagement";
import ListCategory from "../pages/category/ListCategory";
import CreateCategory from "../pages/category/CreateCategory";
import EditCategory from "../pages/category/EditCategory";
import ListBanner from "../pages/banner/ListBanner";
import CreateBanner from "../pages/banner/CreateBanner";
import EditBanner from "../pages/banner/EditBanner";
import ListOffer from "../pages/offers/ListOffer";
import CreateOffer from "../pages/offers/CreateOffer";
import EditOffer from "../pages/offers/EditOffer";
import ListSubcategory from "../pages/subcategory/ListSubcategory";
import ListBrand from "../pages/brand/ListBrand";
import ListUnit from "../pages/unit/ListUnit";
import ListTax from "../pages/tax/ListTax";
import ListVariantAttribute from "../pages/variant/ListVariantAttribute";
import ListVariantValue from "../pages/variant/ListVariantValue";
import ListOrders from "../pages/orders/ListOrders";
import ListSupport from "../pages/support/ListSupport";
import SupportForm from "../pages/support/SupportForm";
import ListStock from "../pages/stock/ListStock";
import StockInForm from "../pages/stock/StockInForm";
import CMSList from "../pages/cms/CMSList";
import CMSForm from "../pages/cms/CMSForm";
import TermsList from "../pages/terms/TermsList";
import TermsForm from "../pages/terms/TermsForm";
import PrivacyList from "../pages/privacy/PrivacyList";
import PrivacyForm from "../pages/privacy/PrivacyForm";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import ListCustomer from "../pages/customer/ListCustomer";
import DeliveryBoyList from "../pages/deliveryBoy/DeliveryBoyList";
import AddDeliveryBoy from "../pages/deliveryBoy/AddDeliveryBoy";
import EditDeliveryBoy from "../pages/deliveryBoy/EditDeliveryBoy";
import DeliveryAssignmentList from "../pages/deliveryBoy/DeliveryAssignmentList";



/// Error Pages (Stubs for now)
const Error404 = () => <div className="p-5"><h1>404</h1><p>Page Not Found</p></div>;

const Markup = () => {
    const allroutes = [
        /// Dashboard
        { url: "/", component: <Dashboard /> },
        { url: "dashboard", component: <Dashboard /> },

        // Profile
        { url: "profile", component: <Profile /> },

        // Employees
        { url: "admins/get-admins", component: <ListEmployee /> },
        { url: "admins/create-admin", component: <CreateEmployee /> },
        { url: "admins/edit-employee/:id", component: <EditEmployee /> },
        { url: "employees", component: <ListEmployee /> }, // Legacy support
        { url: "employees/create", component: <CreateEmployee /> }, // Legacy support

        // Roles
        { url: "roles/get-roles", component: <AccessControl /> },
        { url: "roles/create-role", component: <AccessControl /> },
        { url: "roles", component: <AccessControl /> }, // Legacy support
        { url: "roles/create", component: <AccessControl /> }, // Legacy support

        // Products
        { url: "products/list-products", component: <ListProducts /> },
        { url: "products/add-product", component: <AddProduct /> },
        { url: "products/edit-product/:id", component: <EditProduct /> },
        { url: "products/master-management", component: <MasterManagement /> },
        { url: "categories", component: <ListCategory /> },
        { url: "categories/create-category", component: <CreateCategory /> },
        { url: "categories/edit-category/:id", component: <EditCategory /> },
        { url: "subcategories", component: <ListSubcategory /> },
        { url: "brands", component: <ListBrand /> },
        { url: "units", component: <ListUnit /> },
        { url: "taxes", component: <ListTax /> },
        { url: "variants", component: <ListVariantAttribute /> },
        { url: "variants/values/:attributeId", component: <ListVariantValue /> },

        // Banners
        { url: "banners-list", component: <ListBanner /> },
        { url: "banners/create", component: <CreateBanner /> },
        { url: "banners/edit/:id", component: <EditBanner /> },

        // Offers
        { url: "offers-list", component: <ListOffer /> },
        { url: "offers/create", component: <CreateOffer /> },
        { url: "offers/edit/:id", component: <EditOffer /> },

        // Orders
        { url: "orders", component: <ListOrders /> },

        // Support Us (formerly Contact Us)
        { url: "cms/support-us", component: <ListSupport /> },
        { url: "cms/support-us/create", component: <SupportForm /> },
        { url: "cms/support-us/edit/:id", component: <SupportForm /> },

        // CMS (Terms & Privacy)
        { url: "cms", component: <CMSList /> },
        { url: "cms/terms", component: <TermsList /> },
        { url: "cms/terms/create", component: <TermsForm /> },
        { url: "cms/terms/edit/:id", component: <TermsForm /> },
        { url: "cms/privacy-policy", component: <PrivacyList /> },
        { url: "cms/privacy-policy/create", component: <PrivacyForm /> },
        { url: "cms/privacy-policy/edit/:id", component: <PrivacyForm /> },
        { url: "cms/privacy", component: <CMSForm /> },
        { url: "cms/create", component: <CMSForm /> },
        { url: "cms/edit/:type", component: <CMSForm /> },

        // Stock Management
        { url: "stock", component: <ListStock /> },
        { url: "stock/add", component: <StockInForm /> },
        { url: "stock/add/:productId", component: <StockInForm /> },
        { url: "stock/edit/:batchId", component: <StockInForm /> },
        { url: "stock/history/:productId", component: <ListStock /> }, // Placeholder for now or separate component

        // Notifications
        { url: "notifications", component: <NotificationsPage /> },

        // Customers
        { url: "customers", component: <ListCustomer /> },

        // Delivery Boys
        { url: "delivery-boy/list", component: <DeliveryBoyList /> },
        { url: "delivery-boy/add", component: <AddDeliveryBoy /> },
        { url: "delivery-boy/edit/:id", component: <EditDeliveryBoy /> },
        { url: "delivery-boy/assignments", component: <DeliveryAssignmentList /> },
    ]





    return (
        <>
            <Routes>
                <Route element={<MainLayout />} >
                    {allroutes.map((data, i) => (
                        <Route
                            key={i}
                            path={`${data.url}`}
                            element={data.component}
                        />
                    ))}
                </Route>
                <Route path='*' element={<Error404 />} />
            </Routes>
            <ScrollToTop />
            <Footer />
        </>
    )
}

export default Markup;
