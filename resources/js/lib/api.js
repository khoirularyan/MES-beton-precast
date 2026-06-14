import axios from 'axios';

const backendOrigin = import.meta.env.VITE_API_BASE_URL
  || (window.location.port === '5173' ? 'http://127.0.0.1:8000' : window.location.origin);

// Base axios instance with CSRF token handling
const api = axios.create({
  baseURL: `${backendOrigin}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

// CSRF token setup for Laravel
api.interceptors.request.use(
  (config) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
      config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// MASTER DATA - PRODUCTS
// ============================================

const buildFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    let value = data[key];
    if (value === null || value === undefined) {
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        formData.append(`${key}[]`, item);
      });
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

export const productApi = {
  getAll: (params = {}) => api.get('/products', { params }),
  getOne: (id)          => api.get(`/products/${id}`),
  create: (data)        => {
    const formData = buildFormData(data);
    return api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data)    => {
    const formData = buildFormData(data);
    formData.append('_method', 'PUT');
    return api.post(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id)          => api.delete(`/products/${id}`),
};

// ============================================
// MASTER DATA - MATERIALS
// ============================================

export const materialApi = {
  getAll: (params = {}) => api.get('/materials', { params }),
  getOne: (id)          => api.get(`/materials/${id}`),
  create: (data)        => api.post('/materials', data),
  update: (id, data)    => api.put(`/materials/${id}`, data),
  delete: (id)          => api.delete(`/materials/${id}`),
};

// ============================================
// INVENTORY OVERVIEW (FINISHED GOODS, MOVEMENTS, WAREHOUSES)
// ============================================

export const inventoryApi = {
  getOverview: () => api.get('/inventory'),
};

// ============================================
// MATERIAL INVENTORY
// ============================================

export const materialInventoryApi = {
  getAll: (params = {}) => api.get('/material-inventory', { params }),
  getDashboard: ()      => api.get('/material-inventory/dashboard'),
  adjust: (data)        => api.post('/material-inventory/adjustment', data),
};

// ============================================
// MASTER DATA - BOM
// ============================================

export const bomApi = {
  getAll:       (params = {}) => api.get('/boms', { params }),
  getOne:       (id)          => api.get(`/boms/${id}`),
  create:       (data)        => api.post('/boms', data),
  update:       (id, data)    => api.put(`/boms/${id}`, data),
  delete:       (id)          => api.delete(`/boms/${id}`),
  activate:     (id)          => api.post(`/boms/${id}/activate`),
  archive:      (id)          => api.post(`/boms/${id}/archive`),
  unarchive:    (id)          => api.post(`/boms/${id}/unarchive`),
  clone:        (id, data = {}) => api.post(`/boms/${id}/clone`, data),
  getByProduct: (productId) => api.get(`/products/${productId}/boms`),
  getActiveBom: (productId) => api.get(`/products/${productId}/active-bom`),
};

// ============================================
// MASTER DATA - WORK CENTERS
// ============================================

export const workCenterApi = {
  getAll: (params = {}) => api.get('/work-centers', { params }),
  getOne: (id)          => api.get(`/work-centers/${id}`),
  create: (data)        => api.post('/work-centers', data),
  update: (id, data)    => api.put(`/work-centers/${id}`, data),
  delete: (id)          => api.delete(`/work-centers/${id}`),
};

// ============================================
// SALES ORDERS
// ============================================

export const salesOrderApi = {
  getAll:          (params = {}) => api.get('/sales-orders', { params }),
  getOne:          (id)          => api.get(`/sales-orders/${id}`),
  getItems:        (id)          => api.get(`/sales-orders/${id}/items`),
  create:          (data)        => api.post('/sales-orders', data),
  update:          (id, data)    => api.put(`/sales-orders/${id}`, data),
  delete:          (id)          => api.delete(`/sales-orders/${id}`),
  submit:          (id)          => api.post(`/sales-orders/${id}/submit`),
  confirm:         (id)          => api.post(`/sales-orders/${id}/confirm`),
  reject:          (id, data)    => api.post(`/sales-orders/${id}/reject`, data),
  cancel:          (id)          => api.post(`/sales-orders/${id}/cancel`),
  generateDemands: (id)          => api.post(`/sales-orders/${id}/generate-demands`),
  getAuditLogs:    (id)          => api.get(`/sales-orders/${id}/audit-logs`),
  checkStock:      (id)          => api.post(`/sales-orders/${id}/check-stock`),
  lockBom:         (id)          => api.post(`/sales-orders/${id}/lock-bom`),
};

// ============================================
// PRODUCTION PLANNING
// ============================================

export const productionPlanApi = {
  getAll: (params = {}) => api.get('/production-plans', { params }),
  getOne: (id)          => api.get(`/production-plans/${id}`),
  create: (data)        => api.post('/production-plans', data),
  update: (id, data)    => api.put(`/production-plans/${id}`, data),
  delete: (id)          => api.delete(`/production-plans/${id}`),
};

export const productionDemandApi = {
  getAll: (params = {}) => api.get('/production-demands', { params }),
  getOne: (id)          => api.get(`/production-demands/${id}`),
  create: (data)        => api.post('/production-demands', data),
  update: (id, data)    => api.put(`/production-demands/${id}`, data),
  delete: (id)          => api.delete(`/production-demands/${id}`),
};

export const productionBatchApi = {
  getAll:    (params = {}) => api.get('/production-batches', { params }),
  getOne:    (id)          => api.get(`/production-batches/${id}`),
  create:    (data)        => api.post('/production-batches', data),
  update:    (id, data)    => api.put(`/production-batches/${id}`, data),
  delete:    (id)          => api.delete(`/production-batches/${id}`),
  release:   (id)          => api.post(`/production-batches/${id}/release`),
  start:     (id)          => api.post(`/production-batches/${id}/start`),
  complete:  (id)          => api.post(`/production-batches/${id}/complete`),
  transition: (id, data)   => api.post(`/production-batches/${id}/transition`, data),
};

// ============================================
// WORK ORDERS
// ============================================

export const workOrderApi = {
  getAll: (params = {}) => api.get('/work-orders', { params }),
  getOne: (id)          => api.get(`/work-orders/${id}`),
  create: (data)        => api.post('/work-orders', data),
  update: (id, data)    => api.put(`/work-orders/${id}`, data),
  delete: (id)          => api.delete(`/work-orders/${id}`),
};

// ============================================
// CURING
// ============================================

export const curingApi = {
  getAll: (params = {}) => api.get('/curing', { params }),
  getOne: (id)          => api.get(`/curing/${id}`),
  create: (data)        => api.post('/curing', data),
  update: (id, data)    => api.put(`/curing/${id}`, data),
  delete: (id)          => api.delete(`/curing/${id}`),
};

// ============================================
// QUALITY CONTROL
// ============================================

export const qcInspectionApi = {
  getAll: (params = {}) => api.get('/qc-inspections', { params }),
  getOne: (id)          => api.get(`/qc-inspections/${id}`),
  create: (data)        => api.post('/qc-inspections', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data)    => api.post(`/qc-inspections/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }), // Use POST with _method=PUT in FormData for file upload support
  delete: (id)          => api.delete(`/qc-inspections/${id}`),
};

// ============================================
// DELIVERY ORDERS
// ============================================

export const deliveryOrderApi = {
  getAll: (params = {}) => api.get('/delivery-orders', { params }),
  getOne: (id)          => api.get(`/delivery-orders/${id}`),
  create: (data)        => api.post('/delivery-orders', data),
  update: (id, data)    => api.put(`/delivery-orders/${id}`, data),
  delete: (id)          => api.delete(`/delivery-orders/${id}`),
  checkFifo: (soId)     => api.get('/delivery-orders/fifo-check', { params: { sales_order_id: soId } }),
};

// ============================================
// DASHBOARD
// ============================================

export const dashboardApi = {
  getStats: (params = {}) => api.get('/dashboard', { params }),
  getOverview: () => api.get('/dashboard'),
};

// ============================================
// EXTENDED MASTER DATA (generic CRUD factory)
// ============================================

const crudApi = (endpoint) => ({
  getAll: (params = {}) => api.get(`/${endpoint}`, { params }),
  getOne: (id)          => api.get(`/${endpoint}/${id}`),
  create: (data)        => api.post(`/${endpoint}`, data),
  update: (id, data)    => api.put(`/${endpoint}/${id}`, data),
  delete: (id)          => api.delete(`/${endpoint}/${id}`),
});

export const supplierApi         = crudApi('suppliers');
export const customerApi         = crudApi('customers');
export const productCategoryApi  = crudApi('product-categories');
export const productTypeApi      = crudApi('product-types');
export const productSpecApi      = crudApi('product-specs');
export const concreteGradeApi    = crudApi('concrete-grades');
export const materialCategoryApi = crudApi('material-categories');
export const moldApi             = crudApi('molds');
export const warehouseApi        = crudApi('warehouses');
// export const machineApi          = crudApi('machines'); // REMOVED - Table dropped in refactor
// export const employeeApi         = crudApi('employees'); // REMOVED - Use users instead
export const userApi             = crudApi('users');
export const shiftApi            = crudApi('shifts');
export const batchStatusApi      = crudApi('batch-statuses');
export const qcParameterApi      = crudApi('qc-parameters');
export const defectCategoryApi   = crudApi('defect-categories');
export const productionStatusApi = crudApi('production-statuses');
export const deliveryStatusApi   = crudApi('delivery-statuses');

// ============================================
// ROLE & PERMISSION MANAGEMENT
// ============================================

export const roleApi = {
  getAll: (params = {}) => api.get('/roles', { params }),
  getOne: (id)          => api.get(`/roles/${id}`),
  create: (data)        => api.post('/roles', data),
  update: (id, data)    => api.put(`/roles/${id}`, data),
  delete: (id)          => api.delete(`/roles/${id}`),
  getPermissions: (id)  => api.get(`/roles/${id}/permissions`),
  updatePermissions: (id, data) => api.put(`/roles/${id}/permissions`, data),
};

export const moduleApi = {
  getAll: (params = {}) => api.get('/modules', { params }),
};

export const qcDashboardApi = {
  getOverview: () => api.get('/qc-dashboard'),
};

// Export default api instance for custom calls
export default api;
