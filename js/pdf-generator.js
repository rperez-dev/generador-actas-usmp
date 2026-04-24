window.PDFGenerator = (() => {
  function drawAlignedPair(
    doc,
    label,
    value,
    labelRightX,
    valueLeftX,
    y,
    labelSize = 9,
    valueSize = 8,
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(labelSize);
    doc.text(String(label || ""), labelRightX, y, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(valueSize);
    doc.text(String(value || ""), valueLeftX, y, { align: "left" });
  }

  function drawWidePair(
    doc,
    label,
    value,
    labelRightX,
    valueLeftX,
    y,
    maxWidth,
    labelSize = 9,
    valueSize = 8,
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(labelSize);
    doc.text(String(label || ""), labelRightX, y, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(valueSize);
    doc.text(String(value || ""), valueLeftX, y, {
      align: "left",
      maxWidth,
    });
  }

  function drawWatermark(doc, text = "BORRADOR") {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.saveGraphicsState();

    if (doc.setGState) {
      doc.setGState(new doc.GState({ opacity: 0.15 }));
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(90);
    doc.setTextColor(80, 80, 80);

    const angle = 30;

    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    const textWidth = doc.getTextWidth(text);
    const textHeight = doc.getTextDimensions(text).h;

    const rad = (angle * Math.PI) / 140;

    const offsetX = (textHeight / 2) * Math.sin(rad);
    const offsetY = (textWidth / 2) * Math.sin(rad);

    const moveRight = 25;

    doc.text(text, centerX - offsetX + moveRight, centerY + offsetY, {
      align: "center",
      angle: angle,
      baseline: "middle",
    });

    doc.restoreGraphicsState();
  }

  function drawLogo(doc, logoBase64, logoFormat) {
    if (!logoBase64) return;

    try {
      let format = String(logoFormat || "").toUpperCase();

      if (!format) {
        if (logoBase64.startsWith("data:image/png")) format = "PNG";
        else if (
          logoBase64.startsWith("data:image/jpeg") ||
          logoBase64.startsWith("data:image/jpg")
        )
          format = "JPEG";
        else if (logoBase64.startsWith("data:image/webp")) format = "WEBP";
      }

      doc.addImage(logoBase64, format || "PNG", 12, 8, 45, 25);
    } catch (error) {
      console.warn("No se pudo insertar el logo en el PDF:", error);
    }
  }

  function normalizarLista(value) {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(" - ");
    }
    return String(value || "").trim();
  }

  function drawHeader(doc, config) {
    const {
      logoBase64,
      logoFormat,
      seleccion,
      curso,
      planes,
      secciones,
      ciclo,
      indicador,
      modalidad,
      fecha,
      periodo,
    } = config;

    const first = seleccion[0];
    const carrerasTexto =
      normalizarLista(planes) || String(first["Denom. Plan"] || "").trim();
    const seccionesTexto =
      normalizarLista(secciones) || String(first["Nom Sección"] || "").trim();
    const clave = first["Curso"] ?? "";

    drawLogo(doc, logoBase64, logoFormat);

    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ACTAS DE NOTAS", 105, 28, { align: "center" });

    doc.setFontSize(9.5);
    doc.text(
      `${curso || "ASIGNATURA"} - ${indicador || "INDICADOR"}`,
      105,
      33,
      {
        align: "center",
        maxWidth: 120,
      },
    );

    const startY = 43;
    const lineGap = 7;

    const leftLabelRightX = 45;
    const leftValueLeftX = 48;

    const rightLabelRightX = 115;
    const rightValueLeftX = 118;

    drawAlignedPair(
      doc,
      "MODALIDAD:",
      modalidad || "",
      leftLabelRightX,
      leftValueLeftX,
      startY,
    );
    drawAlignedPair(
      doc,
      "FECHA:",
      fecha || "",
      leftLabelRightX,
      leftValueLeftX,
      startY + lineGap,
    );
    drawAlignedPair(
      doc,
      "PERIODO:",
      periodo || "",
      leftLabelRightX,
      leftValueLeftX,
      startY + lineGap * 2,
    );

    drawAlignedPair(
      doc,
      "CICLO:",
      ciclo || "",
      rightLabelRightX,
      rightValueLeftX,
      startY,
    );
    drawAlignedPair(
      doc,
      "COD. CURSO:",
      clave,
      rightLabelRightX,
      rightValueLeftX,
      startY + lineGap,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PROGRAMA:", rightLabelRightX, startY + lineGap * 2, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    let carreraTextoCorto = String(carrerasTexto || "")
      .replace(/\s+/g, " ")
      .trim();
    if (carreraTextoCorto.length > 75) {
      carreraTextoCorto = carreraTextoCorto.substring(0, 72) + "...";
    }

    doc.text(carreraTextoCorto, rightValueLeftX, startY + lineGap * 2, {
      align: "left",
      maxWidth: 78,
    });

    const seccionY = startY + lineGap * 3;

    const seccionLabelRightX = 45;
    const seccionValueLeftX = 48;

    const aulaLabelRightX = rightLabelRightX;
    const aulaValueLeftX = rightValueLeftX;

    const seccionMaxWidth = aulaLabelRightX - seccionValueLeftX - 6;

    drawWidePair(
      doc,
      "SECCION:",
      seccionesTexto,
      seccionLabelRightX,
      seccionValueLeftX,
      seccionY,
      seccionMaxWidth,
      9,
      8,
    );

    if (config.aula) {
      drawAlignedPair(
        doc,
        "AULA:",
        config.aula,
        aulaLabelRightX,
        aulaValueLeftX,
        seccionY,
      );
    }

    return seccionY + 10;
  }

  function drawFooterBox(doc, config, y) {
    const { seleccion, curso, secciones, modalidad } = config;
    const first = seleccion[0];
    const seccionTexto =
      normalizarLista(secciones) || String(first["Nom Sección"] || "").trim();

    const x = 15;
    const width = 180;
    const height = 45;
    const half = x + width / 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(x, y, width, height);
    doc.line(half, y, half, y + height);

    doc.setTextColor(0, 0, 0);

    const leftLabelRightX = x + 24;
    const leftValueLeftX = x + 26;

    drawAlignedPair(
      doc,
      "Asignatura:",
      curso,
      leftLabelRightX,
      leftValueLeftX,
      y + 8,
      9,
      8,
    );
    drawAlignedPair(
      doc,
      "Cod. Curso:",
      first["Curso"] ?? "",
      leftLabelRightX,
      leftValueLeftX,
      y + 15,
      9,
      8,
    );
    drawAlignedPair(
      doc,
      "Modalidad:",
      modalidad || "",
      leftLabelRightX,
      leftValueLeftX,
      y + 22,
      9,
      8,
    );
    drawAlignedPair(
      doc,
      "Matriculados:",
      String(seleccion.length),
      leftLabelRightX,
      leftValueLeftX,
      y + 29,
      9,
      8,
    );
    drawAlignedPair(
      doc,
      "Sección:",
      seccionTexto,
      leftLabelRightX,
      leftValueLeftX,
      y + 36,
      9,
      8,
    );

    const rightFooterLabelRightX = half + 25;
    const rightFooterValueLeftX = half + 27;

    const normalGap = 7;
    const largeGap = 10;

    let currentY = y + 8;

    drawAlignedPair(
      doc,
      "Presentes:",
      "",
      rightFooterLabelRightX,
      rightFooterValueLeftX,
      currentY,
      9,
      8,
    );

    doc.line(
      rightFooterValueLeftX,
      currentY + 2,
      rightFooterValueLeftX + 40,
      currentY + 2,
    );

    currentY += normalGap;

    drawAlignedPair(
      doc,
      "Ausentes:",
      "",
      rightFooterLabelRightX,
      rightFooterValueLeftX,
      currentY,
      9,
      8,
    );

    doc.line(
      rightFooterValueLeftX,
      currentY + 2,
      rightFooterValueLeftX + 40,
      currentY + 2,
    );

    currentY += largeGap;

    drawAlignedPair(
      doc,
      "Docente:",
      "",
      rightFooterLabelRightX,
      rightFooterValueLeftX,
      currentY,
      9,
      8,
    );

    doc.line(
      rightFooterValueLeftX,
      currentY + 2,
      rightFooterValueLeftX + 60,
      currentY + 2,
    );

    currentY += largeGap;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Firma:", rightFooterLabelRightX, currentY, {
      align: "right",
    });

    const firmaStart = rightFooterValueLeftX;
    const firmaEnd = rightFooterValueLeftX + 60;

    doc.line(firmaStart, currentY + 2, firmaEnd, currentY + 2);
  }

  function buildRows(seleccion, abreviarCarrera) {
    return seleccion.map((row, idx) => [
      idx + 1,
      abreviarCarrera(row["Denom. Plan"]),
      row["Número Matrícula"] ?? "",
      row["Nombre resumen"] ?? "",
      row["Nom Sección"] ?? "",
      "",
      "",
    ]);
  }

  function generate(config) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const startY = drawHeader(doc, config);
    const bodyRows = buildRows(config.seleccion, config.abreviarCarrera);

    doc.autoTable({
      startY,
      head: [
        [
          "N°",
          "Escuela",
          "Código SAP",
          "Apellidos y Nombres",
          "Seccion",
          "Nota",
          "Firma",
        ],
      ],
      body: bodyRows,
      margin: {
        top: 10,
        left: 15,
        right: 15,
        bottom: 20,
      },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.6,
        cellPadding: { top: 1.6, right: 1.8, bottom: 1.6, left: 1.8 },
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        halign: "center",
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [120, 120, 120],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.18,
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 26 },
        3: { cellWidth: 68, halign: "center" },
        4: { cellWidth: 24, halign: "center", overflow: "visible" },
        5: { cellWidth: 12 },
        6: { cellWidth: 22 },
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 4) {
          data.cell.styles.fontSize = 7.2;
        }
      },

      didDrawPage: function () {
        if (config.watermark) {
          drawWatermark(doc, config.watermark);
        }
      },
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 36;
    const bottomMargin = 20;
    const nombreArchivo = `ACTA_${config.curso}_${config.fecha}.pdf`;

    if (finalY + footerHeight > pageHeight - bottomMargin) {
      doc.addPage();
      finalY = 20;

      if (config.watermark) {
        drawWatermark(doc, config.watermark);
      }
    }

    drawFooterBox(doc, config, finalY);
    doc.save(nombreArchivo);
  }

  return { generate };
})();
