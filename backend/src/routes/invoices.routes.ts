import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { list, create, updateStatus, remove } from '../controllers/invoices.controller';

const router = Router();

router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

export default router;
