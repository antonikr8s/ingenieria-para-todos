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

    // Reemplazamos [TEOREMA]...contenido... hasta el próximo doble salto de línea (o fin del texto)
    // envolviéndolo en un <div> con borde, ANTES de procesar las fórmulas.
    const conMarcadores = texto.replace(
      /\[TEOREMA\]([\s\S]*?)(\n\s*\n|$)/g,
      (_match, contenidoTeorema, separador) => {
        return `[TEOREMA_INICIO]${contenidoTeorema}[TEOREMA_FIN]${separador}`;
      }
    );

    const renderParrafo = (contenido: string): string => {
      const partes = contenido.split(
        /(\$\$(?:\\.|[^$\\])+\$\$|\$(?:\\.|[^$\\])+\$)/g
      );

      return partes
        .map(parte => {
          const esBloque = parte.startsWith('$$') && parte.endsWith('$$');
          const esInline = !esBloque && parte.startsWith('$') && parte.endsWith('$');

          if (esBloque) {
            const formula = parte.slice(2, -2).trim();
            try {
              return katex.renderToString(formula, { throwOnError: false, displayMode: true });
            } catch {
              return parte;
            }
          } else if (esInline) {
            const formula = parte.slice(1, -1).trim();
            try {
              return katex.renderToString(formula, { throwOnError: false, displayMode: false });
            } catch {
              return parte;
            }
          } else {
            const escapado = parte
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            return escapado.replace(/\n/g, '<br>');
          }
        })
        .join('');
    };

    // Dividimos por el marcador de teorema para procesar cada tramo por separado
    const segmentos = conMarcadores.split(/(\[TEOREMA_INICIO\][\s\S]*?\[TEOREMA_FIN\])/g);

    const html = segmentos
      .map(segmento => {
        const match = segmento.match(/^\[TEOREMA_INICIO\]([\s\S]*)\[TEOREMA_FIN\]$/);
        if (match) {
          const contenidoRenderizado = renderParrafo(match[1]);
          return `<div style="border-left: 4px solid #000; padding-left: 12px; margin: 12px 0;">${contenidoRenderizado}</div>`;
        }
        return renderParrafo(segmento);
      })
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}