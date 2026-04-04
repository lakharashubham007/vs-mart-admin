import axios from 'axios';
import { BASE_URL } from '../config/env';

const BASE = `${BASE_URL}/private/analytics`;

const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const analyticsService = {
    getSummary:          () => axios.get(`${BASE}/summary`, getHeaders()).then(r => r.data),
    getRevenueTrend:     (days = 7) => axios.get(`${BASE}/revenue-trend?days=${days}`, getHeaders()).then(r => r.data),
    getBestSellers:      (limit = 5) => axios.get(`${BASE}/best-sellers?limit=${limit}`, getHeaders()).then(r => r.data),
    getLowStock:         (threshold = 10, limit = 6) => axios.get(`${BASE}/low-stock?threshold=${threshold}&limit=${limit}`, getHeaders()).then(r => r.data),
    getRecentOrders:     (limit = 5) => axios.get(`${BASE}/recent-orders?limit=${limit}`, getHeaders()).then(r => r.data),
    getOrderDistribution:() => axios.get(`${BASE}/order-distribution`, getHeaders()).then(r => r.data),
    getWeeklySales:      () => axios.get(`${BASE}/sales/weekly`, getHeaders()).then(r => r.data),
    getMonthlySales:     () => axios.get(`${BASE}/sales/monthly`, getHeaders()).then(r => r.data),
    getYearlySales:      () => axios.get(`${BASE}/sales/yearly`, getHeaders()).then(r => r.data),
    getStockDynamics:    () => axios.get(`${BASE}/products/stock`, getHeaders()).then(r => r.data),
};

export default analyticsService;
