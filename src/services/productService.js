import apiClient from './apiClient';

const productService = {
    // Products
    getProducts: async (params) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return await apiClient(`/private/products/get-products?${query}`);
    },
    getProductById: async (id) => {
        return await apiClient(`/private/products/get-products/${id}`);
    },
    createProduct: async (formData) => {
        return await apiClient('/private/products/create-product', {
            method: 'POST',
            body: formData // apiClient handles FormData automatically
        });
    },
    updateProduct: async (id, formData) => {
        return await apiClient(`/private/products/edit-product/${id}`, {
            method: 'PATCH',
            body: formData
        });
    },
    deleteProduct: async (id) => {
        return await apiClient(`/private/products/delete-product/${id}`, {
            method: 'DELETE'
        });
    },
    updateProductStatus: async (id, status) => {
        return await apiClient(`/private/products/update-product-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },

    // Masters
    getCategories: async () => {
        return await apiClient('/private/categories/get-categories');
    },
    getCategoryById: async (id) => {
        return await apiClient(`/private/categories/get-category/${id}`);
    },
    createCategory: async (data) => {
        return await apiClient('/private/categories/create-category', {
            method: 'POST',
            body: data
        });
    },
    updateCategoryStatus: async (id, status) => {
        return await apiClient(`/private/categories/${id}/status`, {
            method: 'PATCH',
            body: { status }
        });
    },
    updateCategory: async (id, data) => {
        return await apiClient(`/private/categories/update-category/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    deleteCategory: async (id) => {
        return await apiClient(`/private/categories/delete-category/${id}`, {
            method: 'DELETE'
        });
    },

    // Subcategories
    getSubcategories: async () => {
        return await apiClient('/private/subcategories');
    },
    getSubcategoryById: async (id) => {
        return await apiClient(`/private/subcategories/${id}`);
    },
    createSubcategory: async (data) => {
        return await apiClient('/private/subcategories', {
            method: 'POST',
            body: data
        });
    },
    updateSubcategory: async (id, data) => {
        return await apiClient(`/private/subcategories/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    deleteSubcategory: async (id) => {
        return await apiClient(`/private/subcategories/${id}`, {
            method: 'DELETE'
        });
    },
    updateSubcategoryStatus: async (id, status) => {
        return await apiClient(`/private/subcategories/${id}/status`, {
            method: 'PATCH',
            body: { status }
        });
    },

    getBrands: async () => {
        return await apiClient('/private/brands/get-brands');
    },
    getBrandById: async (id) => {
        return await apiClient(`/private/brands/get-brand/${id}`);
    },
    createBrand: async (data) => {
        return await apiClient('/private/brands/create-brand', {
            method: 'POST',
            body: data
        });
    },
    updateBrand: async (id, data) => {
        return await apiClient(`/private/brands/update-brand/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    deleteBrand: async (id) => {
        return await apiClient(`/private/brands/delete-brand/${id}`, {
            method: 'DELETE'
        });
    },
    updateBrandStatus: async (id, status) => {
        return await apiClient(`/private/brands/update-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },


    getAttributes: async () => {
        return await apiClient('/private/attributes/get-attributes');
    },
    createAttribute: async (data) => {
        return await apiClient('/private/attributes/create-attribute', {
            method: 'POST',
            body: data
        });
    },
    deleteAttribute: async (id) => {
        return await apiClient(`/private/attributes/delete-attribute/${id}`, {
            method: 'DELETE'
        });
    },

    getVariantTypes: async () => {
        return await apiClient('/private/variant-types/get-variant-types');
    },
    createVariantType: async (data) => {
        return await apiClient('/private/variant-types/create-variant-type', {
            method: 'POST',
            body: data
        });
    },
    deleteVariantType: async (id) => {
        return await apiClient(`/private/variant-types/delete-variant-type/${id}`, {
            method: 'DELETE'
        });
    },

    getUnits: async () => {
        return await apiClient('/private/units/get-units');
    },
    getUnitById: async (id) => {
        return await apiClient(`/private/units/get-unit/${id}`);
    },
    createUnit: async (data) => {
        return await apiClient('/private/units/create-unit', {
            method: 'POST',
            body: data
        });
    },
    updateUnit: async (id, data) => {
        return await apiClient(`/private/units/update-unit/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    updateUnitStatus: async (id, status) => {
        return await apiClient(`/private/units/update-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },
    deleteUnit: async (id) => {
        return await apiClient(`/private/units/delete-unit/${id}`, {
            method: 'DELETE'
        });
    },


    getAddons: async () => {
        return await apiClient('/private/addons/get-addons');
    },
    createAddon: async (data) => {
        return await apiClient('/private/addons/create-addon', {
            method: 'POST',
            body: data
        });
    },
    deleteAddon: async (id) => {
        return await apiClient(`/private/addons/delete-addon/${id}`, {
            method: 'DELETE'
        });
    },

    // Taxes
    getTaxes: async () => {
        return await apiClient('/private/taxes/get-taxes');
    },
    createTax: async (data) => {
        return await apiClient('/private/taxes/create-tax', {
            method: 'POST',
            body: data
        });
    },
    updateTax: async (id, data) => {
        return await apiClient(`/private/taxes/update-tax/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    updateTaxStatus: async (id, status) => {
        return await apiClient(`/private/taxes/update-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },
    deleteTax: async (id) => {
        return await apiClient(`/private/taxes/delete-tax/${id}`, {
            method: 'DELETE'
        });
    },

    // Variant Attributes (VariantTypes)
    getVariantAttributes: async () => {
        return await apiClient('/private/variant-types/get-variant-types');
    },
    createVariantAttribute: async (data) => {
        return await apiClient('/private/variant-types/create-variant-type', {
            method: 'POST',
            body: data
        });
    },
    updateVariantAttribute: async (id, data) => {
        return await apiClient(`/private/variant-types/update-variant-type/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    updateVariantAttributeStatus: async (id, status) => {
        return await apiClient(`/private/variant-types/update-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },
    deleteVariantAttribute: async (id) => {
        return await apiClient(`/private/variant-types/delete-variant-type/${id}`, {
            method: 'DELETE'
        });
    },

    // Variant Values
    getVariantValues: async (variantTypeId) => {
        const query = variantTypeId ? `?variantTypeId=${variantTypeId}` : '';
        return await apiClient(`/private/variant-types/get-variant-values${query}`);
    },
    createVariantValue: async (data) => {
        return await apiClient('/private/variant-types/create-variant-value', {
            method: 'POST',
            body: data
        });
    },
    updateVariantValue: async (id, data) => {
        return await apiClient(`/private/variant-types/update-variant-value/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    updateVariantValueStatus: async (id, status) => {
        return await apiClient(`/private/variant-types/update-value-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },
    deleteVariantValue: async (id) => {
        return await apiClient(`/private/variant-types/delete-variant-value/${id}`, {
            method: 'DELETE'
        });
    },
};



export default productService;
