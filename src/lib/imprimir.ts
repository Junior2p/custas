// ============================================================
// IMPRESSÃO
//
// O documento é impresso a partir de um iframe próprio, não da página.
// Depender de `@media print` sobre a aplicação inteira se mostrou
// frágil: o Safari gerava PDF em branco e deixava a tela apagada até
// recarregar, porque a folha de impressão escondia a interface real.
//
// Com o iframe, a página em que se está trabalhando não é tocada.
// ============================================================

const SELETOR = ".area-impressao";

/** Copia as folhas de estilo da aplicação para o iframe. */
function estilosDaPagina(): string {
  return [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((n) => n.outerHTML)
    .join("\n");
}

/** Resolve quando o recurso carrega, falha ou estoura o tempo. */
function aguardar(alvo: HTMLElement, jaPronto: boolean, limite = 3000): Promise<void> {
  if (jaPronto) return Promise.resolve();
  return new Promise((resolve) => {
    const terminar = () => resolve();
    alvo.addEventListener("load", terminar, { once: true });
    alvo.addEventListener("error", terminar, { once: true });
    setTimeout(terminar, limite);
  });
}

/**
 * Espera as folhas de estilo e as imagens do quadro. Sem isso o Safari
 * dispara o diálogo antes de ter o que desenhar — e o PDF sai em branco.
 */
async function aguardarRecursos(doc: Document) {
  const folhas = [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) =>
    aguardar(l, Boolean(l.sheet))
  );
  const imagens = [...doc.images].map((img) => aguardar(img, img.complete));

  await Promise.all([...folhas, ...imagens]);
}

export async function imprimirDocumento() {
  const documento = document.querySelector(SELETOR);
  if (!documento) {
    alert("Nada para imprimir nesta tela.");
    return;
  }

  // Fora da tela, mas com o tamanho de uma folha: com largura zero o
  // texto quebraria em outra medida e o layout sairia diferente do papel.
  const quadro = document.createElement("iframe");
  quadro.setAttribute("aria-hidden", "true");
  quadro.style.cssText =
    "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:0;";
  document.body.appendChild(quadro);

  const janela = quadro.contentWindow;
  const interno = quadro.contentDocument;
  if (!janela || !interno) {
    quadro.remove();
    return;
  }

  interno.open();
  interno.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    ${estilosDaPagina()}
    <style>
      @page { size: A4; margin: 16mm 15mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
      /* Aqui o documento é o único conteúdo: sempre visível. */
      ${SELETOR} { display: block !important; }
      table, ul, img, .bloco-assinatura { break-inside: avoid; }
      h1, h2, h3 { break-after: avoid; }
      thead { display: table-header-group; }
    </style>
  </head>
  <body>${documento.outerHTML}</body>
</html>`);
  interno.close();

  await aguardarRecursos(interno);
  // Um quadro para o layout assentar antes de disparar a impressão.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  janela.focus();
  janela.print();

  // O diálogo é síncrono na maioria dos navegadores, mas no Safari não:
  // a folga evita remover o iframe antes de o PDF ser gerado.
  setTimeout(() => quadro.remove(), 3000);
}
