const PDF_SAFE_COLORS: Record<string, string> = {
  "bg-white": "#ffffff",
  "border-zinc-100": "#f4f4f5",
  "border-zinc-200": "#e4e4e7",
  "border-zinc-400": "#a1a1aa",
  "border-zinc-900": "#18181b",
  "text-zinc-400": "#a1a1aa",
  "text-zinc-500": "#71717a",
  "text-zinc-600": "#52525b",
  "text-zinc-700": "#3f3f46",
  "text-zinc-800": "#27272a",
  "text-zinc-900": "#18181b",
  "text-zinc-950": "#09090b",
};

function applyPdfSafeColors(root: HTMLElement): () => void {
  const changed: Array<{ element: HTMLElement; style: string | null }> = [];
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const element of elements) {
    const classList = Array.from(element.classList);
    let touched = false;

    for (const className of classList) {
      const color = PDF_SAFE_COLORS[className];
      if (!color) continue;

      if (!touched) {
        changed.push({ element, style: element.getAttribute("style") });
        touched = true;
      }

      if (className.startsWith("text-")) {
        element.style.color = color;
      } else if (className.startsWith("bg-")) {
        element.style.backgroundColor = color;
      } else if (className.startsWith("border-")) {
        element.style.borderColor = color;
      }
    }
  }

  return () => {
    for (const { element, style } of changed) {
      if (style === null) {
        element.removeAttribute("style");
      } else {
        element.setAttribute("style", style);
      }
    }
  };
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const timeout = window.setTimeout(resolve, 2000);
          image.addEventListener(
            "load",
            () => {
              window.clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
          image.addEventListener(
            "error",
            () => {
              window.clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
        }),
    ),
  );
}

export async function downloadReceiptPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  await waitForImages(element);
  const restoreColors = applyPdfSafeColors(element);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
  } finally {
    restoreColors();
  }

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
  const width = imgWidth * ratio;
  const height = imgHeight * ratio;
  const x = (pageWidth - width) / 2;

  pdf.addImage(imgData, "PNG", x, 0, width, height);
  pdf.save(filename);
}

export function printReceipt(): void {
  window.print();
}
