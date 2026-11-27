import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { NextFunction, Request, Response } from 'express'

function getFirebaseAuth() {
  const existing = getApps()[0]
  if (existing) return getAuth(existing)

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required')

  const serviceAccount = JSON.parse(serviceAccountJson) as {
    project_id: string
    client_email: string
    private_key: string
  }

  return getAuth(initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
  }))
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export async function requireFirebaseUser(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined

  if (!token) {
    res.status(401).json({ error: 'Missing Firebase ID token' })
    return
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token)
    req.userId = decodedToken.uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired Firebase ID token' })
  }
}
