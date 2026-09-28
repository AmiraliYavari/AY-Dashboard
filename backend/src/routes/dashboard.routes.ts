import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  summary,
  revenueTrend,
  categoryBreakdown,
  recentTransactions,
  topCustomers,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);
router.get('/summary', summary);
router.get('/revenue-trend', revenueTrend);
router.get('/category-breakdown', categoryBreakdown);
router.get('/recent-transactions', recentTransactions);
router.get('/top-customers', topCustomers);

export default router;
