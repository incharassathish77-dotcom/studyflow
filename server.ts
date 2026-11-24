import http from 'node:http';
import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './server/routes/health.ts';
import tasksRouter from './server/routes/tasks.ts';
import academicRouter from './server/routes/academic.ts';

dotenv.config();

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '512kb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/academic', academicRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`STUDYFLOW server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start STUDYFLOW server:', err);
  process.exit(1);
});
