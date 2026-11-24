import { Router } from 'express';
import { getFirebaseProjectId } from '../middleware/auth.ts';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'STUDYFLOW API',
    timestamp: new Date().toISOString(),
    projectId: getFirebaseProjectId() ?? null,
  });
});

export default router;
