const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const {
  summary,
  revenueTrend,
  categoryBreakdown,
  recentTransactions,
  topCustomers,
} = require('../controllers/dashboard.controller');

router.use(requireAuth);
router.get('/summary', summary);
router.get('/revenue-trend', revenueTrend);
router.get('/category-breakdown', categoryBreakdown);
router.get('/recent-transactions', recentTransactions);
router.get('/top-customers', topCustomers);

module.exports = router;
