// Plantillas de correo de Ingeniería para Todos (HTML + texto plano).
// Funciones puras: se prueban sin red ni Firebase.

const LOGO = 'https://ingenieria-para-todos.vercel.app/assets/logo-IPT.jpeg';

export function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function marco({ titulo, parrafos, boton, enlace, pie }) {
  const link = escapar(enlace);
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title></head>
<body style="margin:0;background:#f5f7fb">
<div style="background:#f5f7fb;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#172033">
  <div style="max-width:520px;margin:auto;background:#ffffff;border:1px solid #dbe2ec;border-top:5px solid #155dfc;border-radius:12px;padding:28px">
    <div style="text-align:center">
      <img src="${LOGO}" alt="Ingeniería para Todos" width="72" height="72" style="border-radius:12px">
      <p style="margin:12px 0 0;font-weight:bold;letter-spacing:1px">INGENIERÍA <span style="color:#155dfc">PARA TODOS</span></p>
      <h2 style="margin:20px 0 8px;font-size:22px">${escapar(titulo)}</h2>
    </div>
    ${parrafos.map((p) => `<p style="font-size:15px;line-height:1.55">${p}</p>`).join('\n    ')}
    <p style="text-align:center;margin:28px 0"><a href="${link}" style="display:inline-block;background:#155dfc;color:#ffffff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${escapar(boton)}</a></p>
    <p style="font-size:13px;color:#525c6b">Si el botón no abre, copia este enlace en tu navegador:</p>
    <p style="font-size:12px;overflow-wrap:anywhere;word-break:break-all"><a href="${link}" style="color:#155dfc">${link}</a></p>
    <p style="border-top:1px solid #dbe2ec;padding-top:16px;margin-top:24px;font-size:13px;color:#525c6b">${escapar(pie)}</p>
  </div>
</div>
</body></html>`;
}

function saludo(nombre) {
  const n = String(nombre ?? '').trim();
  return n ? `Hola, ${escapar(n)}:` : 'Hola:';
}

export function correoRestablecer({ email, nombre, enlace }) {
  const pie = 'Si tú no solicitaste el cambio, puedes ignorar este correo; tu contraseña seguirá igual.';
  return {
    subject: 'Restablece tu contraseña de Ingeniería para Todos',
    html: marco({
      titulo: 'Restablece tu contraseña',
      parrafos: [
        saludo(nombre),
        `Recibimos una solicitud para cambiar la contraseña de <strong>${escapar(email)}</strong>. Toca el botón para crear una nueva.`,
      ],
      boton: 'Crear nueva contraseña',
      enlace,
      pie,
    }),
    text: `${nombre ? `Hola, ${nombre}:` : 'Hola:'}\n\nRecibimos una solicitud para cambiar la contraseña de ${email}.\nAbre este enlace para crear una nueva:\n${enlace}\n\n${pie}\n\nIngeniería para Todos`,
  };
}

export function correoVerificar({ email, nombre, enlace }) {
  const pie = 'Si tú no creaste una cuenta en Ingeniería para Todos, puedes ignorar este correo.';
  return {
    subject: 'Confirma tu correo en Ingeniería para Todos',
    html: marco({
      titulo: 'Confirma tu correo',
      parrafos: [
        saludo(nombre),
        `Gracias por registrarte. Confirma que <strong>${escapar(email)}</strong> es tu correo para empezar a usar la plataforma.`,
      ],
      boton: 'Confirmar mi correo',
      enlace,
      pie,
    }),
    text: `${nombre ? `Hola, ${nombre}:` : 'Hola:'}\n\nGracias por registrarte. Confirma que ${email} es tu correo abriendo este enlace:\n${enlace}\n\n${pie}\n\nIngeniería para Todos`,
  };
}

/** Lleva el código de un solo uso de Firebase a la página propia /auth/action. */
export function enlaceIPT(enlaceFirebase, base) {
  const origen = new URL(enlaceFirebase);
  const mode = origen.searchParams.get('mode');
  const code = origen.searchParams.get('oobCode');
  if (!mode || !code) throw new Error('Enlace de Firebase inválido');
  const destino = new URL('/auth/action', base);
  destino.searchParams.set('mode', mode);
  destino.searchParams.set('oobCode', code);
  destino.searchParams.set('lang', 'es');
  return destino.toString();
}
