const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { list, create, updateStatus, remove } = require('../controllers/invoices.controller');

router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

module.exports = router;
