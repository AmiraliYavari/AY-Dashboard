import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { list, create, remove } from '../controllers/transactions.controller';

const router = Router();

router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

export default router;
