export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

export class PDFViewerEngine {
  private doc: any = null;

  async load(url: string): Promise<PDFPageInfo[]> {
    const pdfjsLib = await import("pdfjs-dist");
    
    // ✅ Worker path yang benar
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const loadingTask = pdfjsLib.getDocument(url);
    this.doc = await loadingTask.promise;
    
    const pages: PDFPageInfo[] = [];
    for (let i = 1; i <= this.doc.numPages; i++) {
      const page = await this.doc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      pages.push({ pageNumber: i, width: vp.width, height: vp.height });
    }
    return pages;
  }

  async renderPage(canvas: HTMLCanvasElement, pageNumber: number, scale: number): Promise<void> {
    if (!this.doc) return;
    const pdfjsLib = await import("pdfjs-dist");
    const page = await this.doc.getPage(pageNumber);
    const vp = page.getViewport({ scale });
    
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext("2d")!;
    
    const renderTask = page.render({ 
      canvasContext: ctx, 
      viewport: vp 
    });
    await renderTask.promise;
  }

  async renderPageToDataURL(pageNumber: number, scale: number): Promise<string> {
    const canvas = document.createElement("canvas");
    await this.renderPage(canvas, pageNumber, scale);
    return canvas.toDataURL("image/png");
  }

  destroy(): void {
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
  }
}