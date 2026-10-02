import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  summary,
  revenueTrend,
  categoryBreakdown,
  recentTransactions,
  topCustomers,
  cashflowCandles,
  invoiceStatus,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);
router.get('/summary', summary);
router.get('/revenue-trend', revenueTrend);
router.get('/category-breakdown', categoryBreakdown);
router.get('/recent-transactions', recentTransactions);
router.get('/top-customers', topCustomers);
router.get('/cashflow-candles', cashflowCandles);
router.get('/invoice-status', invoiceStatus);

export default router;
