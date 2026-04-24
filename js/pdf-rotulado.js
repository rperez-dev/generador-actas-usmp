window.PDFGeneratorRotulado = (() => {
  function drawBox(doc, x, y, w, h, text = "", align = "left", bold = false) {
    doc.rect(x, y, w, h);

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);

    const textX =
      align === "center" ? x + w / 2 : align === "right" ? x + w - 2 : x + 2;

    doc.text(text, textX, y + h / 2 + 2, {
      align,
      baseline: "middle",
      maxWidth: w - 4,
    });
  }

  function generate({ curso, indicador, fecha, total }) {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const width = 180;

    const startX = (pageWidth - width) / 2;

    let y = 60;

    const rowH = 12;

    drawBox(
      doc,
      startX,
      y,
      130,
      rowH,
      "FORMATO DE ENTREGA DE EXAMENES",
      "center",
      true,
    );
    drawBox(doc, startX + 130, y, 20, rowH, "FECHA:", "center", true);
    drawBox(doc, startX + 150, y, 30, rowH, fecha, "center");

    y += rowH;

    drawBox(
      doc,
      startX,
      y,
      width,
      rowH,
      `${curso} - ${indicador}`,
      "center",
      true,
    );

    y += rowH;

    drawBox(doc, startX, y, 40, rowH, "ENTREGA:");
    drawBox(doc, startX + 40, y, 90, rowH);
    drawBox(doc, startX + 130, y, 20, rowH, "FIRMA:");
    drawBox(doc, startX + 150, y, 30, rowH);

    y += rowH;

    drawBox(doc, startX, y, 40, rowH, "RECEPCIONA:");
    drawBox(doc, startX + 40, y, 90, rowH);
    drawBox(doc, startX + 130, y, 20, rowH, "FIRMA:");
    drawBox(doc, startX + 150, y, 30, rowH);

    y += rowH;

    drawBox(doc, startX, y, 40, rowH, "TIPO A:");
    drawBox(doc, startX + 40, y, 50, rowH);
    drawBox(doc, startX + 90, y, 40, rowH, "TIPO B:");
    drawBox(doc, startX + 130, y, 50, rowH, "-", "center");

    y += rowH;

    drawBox(doc, startX, y, 90, rowH, "FICHA CLAVE A");
    drawBox(doc, startX + 90, y, 90, rowH, "FICHA CLAVE B");

    y += rowH;

    drawBox(
      doc,
      startX,
      y,
      width,
      rowH,
      `TOTAL DE ESTUDIANTES: ${total}`,
      "center",
      true,
    );

    y += rowH;

    drawBox(doc, startX, y, 60, rowH, "N° PRESENTES");
    drawBox(doc, startX + 60, y, 30, rowH);
    drawBox(doc, startX + 90, y, 60, rowH, "N° AUSENTES:");
    drawBox(doc, startX + 150, y, 30, rowH);

    y += rowH;

    drawBox(doc, startX, y, 40, rowH, "JURADO:");
    drawBox(doc, startX + 40, y, 90, rowH);
    drawBox(doc, startX + 130, y, 20, rowH, "FIRMA:");
    drawBox(doc, startX + 150, y, 30, rowH);

    const nombreArchivo = `ROTULADO_${curso}_${fecha}.pdf`;

    doc.save(nombreArchivo);
  }

  return { generate };
})();
