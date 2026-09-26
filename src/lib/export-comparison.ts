export async function exportComparisonPdf(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    backgroundColor: "#0B0E1A",
    scale: 1.6,
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.setProperties({
    title: "Bangladesh Trend Detective comparison",
    author: "MEC TERRA_DETECTORS",
    subject: "NASA data trend comparison",
  });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const image = canvas.toDataURL("image/jpeg", 0.92);
  let offset = 0;
  while (offset < imageHeight) {
    if (offset > 0) pdf.addPage();
    pdf.addImage(image, "JPEG", margin, margin - offset, imageWidth, imageHeight, undefined, "FAST");
    offset += pageHeight - margin * 2;
  }
  pdf.save(filename);
}