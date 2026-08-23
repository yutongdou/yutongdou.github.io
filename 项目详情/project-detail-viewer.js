(function projectViewerBootstrap() {
    "use strict";

    const imageDialog = document.getElementById("project-image-dialog");
    const imageDialogTitle = document.getElementById("project-image-dialog-title");
    const imagePreview = imageDialog?.querySelector(".image-preview-image");
    const imageCanvas = imageDialog?.querySelector(".image-preview-canvas");
    const imageFitButton = imageDialog?.querySelector("[data-image-fit]");
    const imageCloseButton = imageDialog?.querySelector("[data-image-close]");
    const pdfDialog = document.getElementById("project-pdf-dialog");
    const pdfDialogTitle = document.getElementById("project-pdf-dialog-title");
    const pdfFrame = pdfDialog?.querySelector(".pdf-preview-frame");
    const pdfCloseButton = pdfDialog?.querySelector("[data-pdf-close]");
    let imageMode = "screen";

    const updateImageMode = () => {
      if (!imagePreview || !imageFitButton) return;
      const fitWidth = imageMode === "width";
      imagePreview.classList.toggle("is-fit-width", fitWidth);
      imagePreview.classList.toggle("is-fit-screen", !fitWidth);
      imageFitButton.textContent = fitWidth
        ? imageFitButton.dataset.fitWindow
        : imageFitButton.dataset.fitWidth;
      imageCanvas?.scrollTo({ top: 0, left: 0 });
    };

    document.querySelectorAll(".asset-image-open img").forEach((image) => {
      const updateShape = () => {
        const card = image.closest(".asset-card");
        if (!card || !image.naturalHeight) return;
        const ratio = image.naturalWidth / image.naturalHeight;
        card.classList.toggle("is-wide", ratio >= 1.85);
        card.classList.toggle("is-tall", ratio <= 0.78);
        card.classList.toggle("is-long", ratio <= 0.48);
      };
      if (image.complete) updateShape();
      else image.addEventListener("load", updateShape, { once: true });
    });

    document.addEventListener("click", (event) => {
      const imageLink = event.target.closest("[data-image-preview]");
      if (imageLink && imageDialog?.showModal && imagePreview) {
        event.preventDefault();
        imageMode = "screen";
        imageDialogTitle.textContent = imageLink.dataset.previewTitle || "";
        imagePreview.alt = imageLink.dataset.previewAlt || "";
        imagePreview.src = imageLink.href;
        updateImageMode();
        imageDialog.showModal();
        return;
      }
      const pdfLink = event.target.closest("[data-pdf-preview]");
      if (pdfLink && pdfDialog?.showModal && pdfFrame) {
        event.preventDefault();
        pdfDialogTitle.textContent = pdfLink.dataset.previewTitle || "PDF";
        pdfFrame.title = pdfLink.dataset.previewTitle || "PDF";
        pdfFrame.src = pdfLink.href;
        pdfDialog.showModal();
      }
    });

    imageFitButton?.addEventListener("click", () => {
      imageMode = imageMode === "width" ? "screen" : "width";
      updateImageMode();
    });
    imageCloseButton?.addEventListener("click", () => imageDialog.close());
    imageDialog?.addEventListener("click", (event) => {
      if (event.target === imageDialog) imageDialog.close();
    });
    imageDialog?.addEventListener("close", () => {
      imagePreview.removeAttribute("src");
      imagePreview.alt = "";
    });
    pdfCloseButton?.addEventListener("click", () => pdfDialog.close());
    pdfDialog?.addEventListener("click", (event) => {
      if (event.target === pdfDialog) pdfDialog.close();
    });
    pdfDialog?.addEventListener("close", () => pdfFrame.removeAttribute("src"));
  })();
