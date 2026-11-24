import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';

const router = Router();

function getConfiguredProjectId(): string | null {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as { projectId?: string };
    return typeof parsed.projectId === 'string' ? parsed.projectId : null;
  } catch {
    return null;
  }
}

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'STUDYFLOW API',
    timestamp: new Date().toISOString(),
    projectId: getConfiguredProjectId(),
  });
});

export default router;
