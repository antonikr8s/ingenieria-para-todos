import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

@Pipe({
  name: 'mathRender',
  standalone: true,
})
export class MathRenderPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(texto: string | undefined | null): SafeHtml {
    if (!texto) return '';

    // ============================================================
    // TEOREMA
    // Ahora requiere marcador de cierre explícito [/TEOREMA],
    // igual que DEFINICION y PREGUNTAS. Ya no captura "hasta el
    // siguiente marcador", así que no se traga texto/ejemplos
    // que vienen después del teorema.
    // ============================================================
    const conMarcadores = texto.replace(
      /\[TEOREMA\]([\s\S]*?)\[\/TEOREMA\]/g,
      (_match, contenidoTeorema) => {
        contenidoTeorema = contenidoTeorema.replace(/^\s*\n/, '');
        return `[TEOREMA_INICIO]${contenidoTeorema}[TEOREMA_FIN]`;
      }
    );

    // ============================================================
    // DEFINICIÓN
    // Marcador con apertura y cierre explícitos [DEFINICION]...[/DEFINICION]
    // ============================================================
    const conDefiniciones = conMarcadores.replace(
      /\[DEFINICION\]([\s\S]*?)\[\/DEFINICION\]/g,
      (_match, contenidoDefinicion) => {
        contenidoDefinicion = contenidoDefinicion.replace(/^\s*\n/, '');
        return `[DEFINICION_INICIO]${contenidoDefinicion}[DEFINICION_FIN]`;
      }
    );

    // ============================================================
    // PREGUNTAS
    // Marcador para crear un recuadro blanco.
    // NO afecta los teoremas, definiciones ni fórmulas existentes.
    // ============================================================
    const conPreguntas = conDefiniciones.replace(
      /\[PREGUNTAS\]([\s\S]*?)\[\/PREGUNTAS\]/g,
      (_match, contenidoPreguntas) => {
        contenidoPreguntas = contenidoPreguntas.replace(/^\s*\n/, '');
        return `[PREGUNTAS_INICIO]${contenidoPreguntas}[PREGUNTAS_FIN]`;
      }
    );

    // ============================================================
    // RENDERIZAR TEXTO Y FÓRMULAS
    // Convierte $formula$ / $$formula$$ a HTML de KaTeX, y escapa
    // el resto del texto. Los saltos de línea internos de un mismo
    // párrafo siguen usando <br> (esto no afecta el espaciado entre
    // párrafos, que ahora se maneja aparte, ver renderParrafosComoPiezas).
    // ============================================================
    const renderParrafo = (contenido: string): string => {
      const partes = contenido.split(
        /(\$\$(?:\\.|[^$\\])+\$\$|\$(?:\\.|[^$\\])+\$)/g
      );

      return partes
        .map(parte => {
          const esBloque =
            parte.startsWith('$$') &&
            parte.endsWith('$$');

          const esInline =
            !esBloque &&
            parte.startsWith('$') &&
            parte.endsWith('$');

          // Fórmula en bloque
          if (esBloque) {
            const formula = parte.slice(2, -2).trim();

            try {
              return katex.renderToString(formula, {
                throwOnError: false,
                displayMode: true,
              });
            } catch {
              return parte;
            }
          }

          // Fórmula dentro del texto
          else if (esInline) {
            const formula = parte.slice(1, -1).trim();

            try {
              return katex.renderToString(formula, {
                throwOnError: false,
                displayMode: false,
              });
            } catch {
              return parte;
            }
          }

          // Texto normal
          else {
            const escapado = parte
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

            return escapado.replace(/\n/g, '<br>');
          }
        })
        .join('');
    };

    // ============================================================
    // TEOREMA + DEFINICIÓN + PREGUNTAS
    // Se separa el texto completo en segmentos: los bloques
    // especiales (ya envueltos en _INICIO/_FIN) y el texto normal
    // que queda entre ellos.
    // ============================================================
    const segmentos = conPreguntas.split(
      /(\[TEOREMA_INICIO\][\s\S]*?\[TEOREMA_FIN\]|\[DEFINICION_INICIO\][\s\S]*?\[DEFINICION_FIN\]|\[PREGUNTAS_INICIO\][\s\S]*?\[PREGUNTAS_FIN\])/g
    );

    // ============================================================
    // ESPACIADO UNIFORME ENTRE ELEMENTOS
    // En vez de que cada bloque/párrafo cargue su propio margen
    // (lo cual hacía que el espacio final dependiera de CUÁNTOS
    // párrafos había entre dos marcadores, sumando márgenes de
    // forma impredecible), armamos un array plano de "piezas" ya
    // renderizadas -uno por cada bloque especial y uno por cada
    // párrafo suelto de texto normal- y luego envolvemos cada
    // pieza con el MISMO margin-bottom. Así el espacio entre
    // cualquier par de elementos consecutivos es siempre el mismo,
    // sin importar si son texto-texto, texto-bloque o bloque-texto.
    // ============================================================
    const ESPACIO_ENTRE_PIEZAS = '10mm';

    const piezas: string[] = [];

    segmentos.forEach(segmento => {

      // --------------------------------------------------------
      // TEOREMA
      // --------------------------------------------------------
      const matchTeorema = segmento.match(
        /^\[TEOREMA_INICIO\]([\s\S]*)\[TEOREMA_FIN\]$/
      );

      if (matchTeorema) {
        const contenidoRenderizado = renderParrafo(matchTeorema[1]);

        piezas.push(`
          <div
            style="
              border-left: 4px solid #000;
              padding-left: 12px;
            "
          >
            ${contenidoRenderizado}
          </div>
        `);
        return;
      }

      // --------------------------------------------------------
      // DEFINICIÓN
      // --------------------------------------------------------
      const matchDefinicion = segmento.match(
        /^\[DEFINICION_INICIO\]([\s\S]*)\[DEFINICION_FIN\]$/
      );

      if (matchDefinicion) {
        const contenidoRenderizado = renderParrafo(matchDefinicion[1]);

        piezas.push(`
          <div
            style="
              background-color: #eeeeee;
              padding: 16px 20px;
              border-radius: 2px;
              line-height: 1.55;
            "
          >
            ${contenidoRenderizado}
          </div>
        `);
        return;
      }

      // --------------------------------------------------------
      // PREGUNTAS
      // Recuadro blanco.
      // --------------------------------------------------------
      const matchPreguntas = segmento.match(
        /^\[PREGUNTAS_INICIO\]([\s\S]*)\[PREGUNTAS_FIN\]$/
      );

      if (matchPreguntas) {
        const contenidoRenderizado = renderParrafo(matchPreguntas[1]);

        piezas.push(`
          <div
            style="
              background-color: #ffffff;
              border: 1px solid #d0d0d0;
              padding: 16px 20px;
              border-radius: 2px;
              line-height: 1.55;
            "
          >
            ${contenidoRenderizado}
          </div>
        `);
        return;
      }

      // --------------------------------------------------------
      // TEXTO NORMAL
      // Se ignoran los segmentos que son solo saltos de línea
      // (separadores entre marcadores). El resto se divide por
      // párrafo (\n\s*\n) y cada párrafo se agrega como una pieza
      // independiente, para que reciba el mismo espaciado uniforme.
      // --------------------------------------------------------
      if (segmento.trim() === '') {
        return;
      }

      segmento
        .split(/\n\s*\n/)
        .map(parrafo => parrafo.trim())
        .filter(parrafo => parrafo.length > 0)
        .forEach(parrafo => {
          piezas.push(renderParrafo(parrafo));
        });
    });

    // ============================================================
    // ARMADO FINAL
    // Cada pieza (bloque especial o párrafo normal) se envuelve
    // con el mismo margin-bottom, garantizando espacio consistente
    // entre cualquier combinación de elementos.
    // ============================================================
    const html = piezas
      .map(pieza => `<div style="margin-bottom: ${ESPACIO_ENTRE_PIEZAS};">${pieza}</div>`)
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}