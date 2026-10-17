/**
 * Opens the browser's print dialog on a standalone HTML document, where "Save
 * as PDF" makes the file. Needs no server. The document is printed from a
 * hidden frame so the page the person is on is not touched.
 */
export function printHtml(html: string, doc: Document = document): Promise<void> {
  return new Promise((resolve) => {
    const frame = doc.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";

    frame.addEventListener("load", () => {
      const view = frame.contentWindow;
      if (!view) return resolve();
      view.addEventListener("afterprint", () => {
        frame.remove();
        resolve();
      });
      view.focus();
      view.print();
    });
    frame.srcdoc = html;
    doc.body.append(frame);
  });
}
