// ─────────────────────────────────────────────────────────────────────────────
//  FANASA SSO — Validación en backend Node.js / Express
//  npm install jwks-rsa jsonwebtoken
// ─────────────────────────────────────────────────────────────────────────────

import jwt       from 'jsonwebtoken';
import jwksRsa   from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const TENANT_ID = 'TU_TENANT_ID';
const CLIENT_ID = 'TU_CLIENT_ID';

// Microsoft publica sus llaves públicas aquí (se cachean automáticamente)
const jwksClient = jwksRsa({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache:   true,
  rateLimit: true,
});

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClient.getSigningKey(header.kid!, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

// ─── Middleware de autenticación ─────────────────────────────────────────────

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(
    token,
    getSigningKey,
    {
      audience: CLIENT_ID,
      issuer:   `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      algorithms: ['RS256'],
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido', detail: err.message });
      }
      // Agregar claims al request para usarlos en los controllers
      (req as any).user = decoded;
      next();
    }
  );
}

// ─── Uso en Express ──────────────────────────────────────────────────────────
//
//  import express from 'express';
//  const app = express();
//
//  // Proteger rutas con el middleware
//  app.get('/api/productos', authMiddleware, (req, res) => {
//    const user = (req as any).user;
//    res.json({ mensaje: `Hola ${user.name}`, email: user.preferred_username });
//  });
