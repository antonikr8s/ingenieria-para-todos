// POST /api/auth-email — envía con diseño de IPT los correos de Firebase Auth.
//
//   { "type": "reset",  "email": "..." }            sin sesión (desde el login)
//   { "type": "verify" } + Authorization: Bearer <ID token>  (usuario recién registrado)
//
// Respuestas: 200 { sent: true } · 400 correo inválido · 401 sin sesión · 429 espera
// un minuto · 500 fallo de envío (la app usa entonces el correo estándar de Firebase).
//
// Variables de entorno en Vercel (Settings › Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT  JSON completo de la cuenta de servicio (Firebase › Configuración › Cuentas de servicio)
//   GMAIL_USER                cuenta de Gmail que envía
//   GMAIL_APP_PASSWORD        contraseña de aplicación de esa cuenta (16 letras)
//   APP_URL                   opcional; por defecto https://ingenieria-para-todos.vercel.app

import { createHash } from 'node:crypto';
import { correoRestablecer, correoVerificar, enlaceIPT } from './_lib/plantillas.mjs';

// Librerías cargadas al usarse: si alguna falla, el GET de diagnóstico sigue respondiendo.
let libs;
async function cargarLibs() {
  if (!libs) {
    const [app, authMod, fs, mailer] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/auth'),
      import('firebase-admin/firestore'),
      import('nodemailer'),
    ]);
    libs = { ...app, getAuth: authMod.getAuth, FieldValue: fs.FieldValue, getFirestore: fs.getFirestore, nodemailer: mailer.default };
  }
  return libs;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_URL = process.env.APP_URL || 'https://ingenieria-para-todos.vercel.app';
const ESPERA_MS = 60_000; // un correo por minuto por dirección
const MAX_POR_IP_HORA = 10;

/** Qué falta en la configuración (nunca devuelve valores, solo nombres). */
function configuracionFaltante() {
  const faltan = ['FIREBASE_SERVICE_ACCOUNT', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'].filter((k) => !process.env[k]?.trim());
  if (!faltan.includes('FIREBASE_SERVICE_ACCOUNT')) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (!sa.private_key || !sa.client_email) faltan.push('FIREBASE_SERVICE_ACCOUNT (JSON sin private_key o client_email)');
    } catch {
      faltan.push('FIREBASE_SERVICE_ACCOUNT (no es un JSON válido)');
    }
  }
  return faltan;
}

async function admin() {
  const { getApps, initializeApp, cert, getAuth, getFirestore } = await cargarLibs();
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return { auth: getAuth(), db: getFirestore() };
}

/** Los enlaces vuelven al mismo despliegue (producción o vista previa de este proyecto). */
function baseDesde(req) {
  const origin = String(req.headers.origin || '');
  if (/^https:\/\/ingenieria-para-todos[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
  return APP_URL;
}

const hash = (v) => createHash('sha256').update(v).digest('hex');

/** Reserva el envío; lanza 429 si se pidió hace menos de un minuto o la IP abusa. */
async function reservar(db, email, ip) {
  const { FieldValue } = await cargarLibs();
  const correoRef = db.doc(`mailThrottle/${hash(email)}`);
  const ipRef = db.doc(`mailThrottle/ip-${hash(ip)}-${new Date().toISOString().slice(0, 13)}`);
  await db.runTransaction(async (tx) => {
    const [c, i] = await Promise.all([tx.get(correoRef), tx.get(ipRef)]);
    const ultimo = c.exists ? c.get('lastSentAt')?.toMillis?.() ?? 0 : 0;
    if (Date.now() - ultimo < ESPERA_MS) throw Object.assign(new Error('espera'), { status: 429 });
    if ((i.exists ? i.get('count') : 0) >= MAX_POR_IP_HORA) throw Object.assign(new Error('ip'), { status: 429 });
    tx.set(correoRef, { lastSentAt: FieldValue.serverTimestamp() });
    tx.set(ipRef, { count: FieldValue.increment(1) }, { merge: true });
  });
  return correoRef;
}

async function enviar(to, mail) {
  const { nodemailer } = await cargarLibs();
  const user = process.env.GMAIL_USER;
  await nodemailer
    .createTransport({ service: 'gmail', auth: { user, pass: process.env.GMAIL_APP_PASSWORD } })
    .sendMail({ from: `Ingeniería para Todos <${user}>`, to, ...mail });
}

export default async function handler(req, res) {
  // GET: diagnóstico sin datos sensibles (solo dice qué configuración falta).
  if (req.method === 'GET') {
    const faltan = configuracionFaltante();
    let librerias = 'ok';
    try { await cargarLibs(); } catch (e) { librerias = String(e).slice(0, 200); }
    return res.status(200).json({ ok: faltan.length === 0 && librerias === 'ok', faltan, librerias });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const faltan = configuracionFaltante();
  if (faltan.length) {
    console.error('auth-email sin configurar', { faltan });
    return res.status(503).json({ error: 'not-configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return res.status(400).json({ error: 'invalid-body' });
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  let throttleRef;

  try {
    const { auth, db } = await admin();
    if (body.type === 'reset') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'invalid-email' });
      throttleRef = await reservar(db, email, ip);

      let usuario;
      try {
        usuario = await auth.getUserByEmail(email);
      } catch (e) {
        // No revela qué correos tienen cuenta.
        if (e?.code === 'auth/user-not-found') return res.status(200).json({ sent: true });
        throw e;
      }
      const enlace = enlaceIPT(await auth.generatePasswordResetLink(email), baseDesde(req));
      await enviar(email, correoRestablecer({ email, nombre: usuario.displayName, enlace }));
      return res.status(200).json({ sent: true });
    }

    if (body.type === 'verify') {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({ error: 'unauthenticated' });
      let decoded;
      try {
        decoded = await auth.verifyIdToken(token);
      } catch {
        return res.status(401).json({ error: 'unauthenticated' });
      }
      const usuario = await auth.getUser(decoded.uid);
      if (!usuario.email) return res.status(400).json({ error: 'no-email' });
      if (usuario.emailVerified) return res.status(200).json({ sent: false, alreadyVerified: true });
      throttleRef = await reservar(db, usuario.email.toLowerCase(), ip);

      const enlace = enlaceIPT(await auth.generateEmailVerificationLink(usuario.email), baseDesde(req));
      await enviar(usuario.email, correoVerificar({ email: usuario.email, nombre: usuario.displayName, enlace }));
      return res.status(200).json({ sent: true });
    }

    return res.status(400).json({ error: 'invalid-type' });
  } catch (e) {
    if (e?.status === 429) return res.status(429).json({ error: 'resource-exhausted' });
    console.error('auth-email falló', { type: body.type, error: String(e) });
    // No salió: el siguiente intento no tiene que esperar un minuto.
    if (throttleRef) await throttleRef.delete().catch(() => {});
    return res.status(500).json({ error: 'internal' });
  }
}
