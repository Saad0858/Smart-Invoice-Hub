import { Router } from 'express';
import healthRoutes from '../health.routes';
import authRoutes from './auth.routes';
import companySettingsRoutes from './company-settings.routes';
import categoryRoutes from './category.routes';
import brandRoutes from './brand.routes';
import productRoutes from './product.routes';
import customerRoutes from './customer.routes';
import invoiceRoutes from './invoice.routes';
import storageRoutes from './storage.routes';
import dashboardRoutes from './dashboard.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/company', companySettingsRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/storage', storageRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
