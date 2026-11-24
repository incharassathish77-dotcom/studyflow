import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

interface FirebaseAppletConfig {
  projectId?: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function loadProjectId(): string | undefined {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return undefined;
    }
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as FirebaseAppletConfig;
    if (!parsed.projectId || parsed.projectId === 'remixed-project-id') {
      return undefined;
    }
    return parsed.projectId;
  } catch {
    return undefined;
  }
}

export function getFirebaseProjectId(): string | undefined {
  return loadProjectId();
}

function getAdminAuth() {
  const projectId = loadProjectId();
  if (!projectId) {
    throw new Error('Firebase project configuration is missing.');
  }
  const app = getApps().length > 0 ? getApp() : initializeApp({ projectId });
  return getAuth(app);
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Empty token.' });
    return;
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: Boolean(decoded.email_verified),
      name: typeof decoded.name === 'string' ? decoded.name : null,
      picture: typeof decoded.picture === 'string' ? decoded.picture : null,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
