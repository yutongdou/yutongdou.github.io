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

/* resume-video-preview:v1:start */
(function resumeVideoPreviews() {
  "use strict";

  const videos = [...document.querySelectorAll("video[data-src]")];
  if (!videos.length) return;
  const english = document.documentElement.lang.startsWith("en");
  const labels = english
    ? { play: "Play video", loading: "Loading video", retry: "Retry playback", failed: "Unable to load. Try again." }
    : { play: "\u64ad\u653e\u89c6\u9891", loading: "\u89c6\u9891\u52a0\u8f7d\u4e2d", retry: "\u91cd\u8bd5\u64ad\u653e", failed: "\u52a0\u8f7d\u672a\u5b8c\u6210\uff0c\u8bf7\u91cd\u8bd5" };
  const style = document.createElement("style");
  style.textContent = `
    .resume-video-start{position:absolute;z-index:2;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;padding:0;display:grid;place-items:center;border:1px solid #ffffff;border-radius:50%;background:rgba(16,28,40,.82);color:#fff;cursor:pointer;font:24px/1 Arial,sans-serif;letter-spacing:0}
    .resume-video-start[hidden],.resume-video-status[hidden]{display:none}
    .resume-video-start:hover{background:#2563a6}
    .resume-video-start:focus-visible{outline:3px solid #ffffff;outline-offset:4px}
    .resume-video-start[aria-busy="true"]{cursor:wait}
    .resume-video-start[aria-busy="true"] span{font-size:0;width:24px;height:24px;border:3px solid #ffffff66;border-top-color:#fff;border-radius:50%;animation:resume-video-spin 1s linear infinite}
    .resume-video-status{position:absolute;z-index:2;bottom:48px;left:12px;right:12px;padding:6px 8px;border-radius:4px;background:rgba(16,28,40,.88);color:#fff;font:12px/1.5 Arial,sans-serif;text-align:center;overflow-wrap:anywhere;letter-spacing:0;pointer-events:none}
    @keyframes resume-video-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.resume-video-start[aria-busy="true"] span{animation:none}}
  `;
  document.head.append(style);

  const snapshotUrl = (source) => {
    const url = new URL(source, document.baseURI);
    // Only known OSS MP4 URLs support this transformation; never modify signed URLs.
    if (url.protocol !== "https:" || url.search
        || !/\.oss-[a-z0-9-]+\.aliyuncs\.com$/i.test(url.hostname)
        || !url.pathname.toLowerCase().endsWith(".mp4")) return "";
    url.searchParams.set("x-oss-process", "video/snapshot,t_1000,f_jpg,w_640,m_fast");
    return url.href;
  };

  const preparePreview = (video) => {
    if (video.dataset.previewRequested || video.hasAttribute("src")) return;
    video.dataset.previewRequested = "true";
    if (video.dataset.poster) {
      video.poster = video.dataset.poster;
    } else {
      // Bundled or non-OSS media has no server-side snapshot service.
      video.preload = "metadata";
      video.src = video.dataset.src;
      video.load();
    }
  };

  videos.forEach((video) => {
    const source = video.dataset.src;
    const title = video.closest(".asset-card")?.querySelector(".asset-title")?.textContent.trim();
    video.dataset.poster = video.getAttribute("poster") || video.dataset.poster || snapshotUrl(source);
    video.controls = false;
    video.tabIndex = -1;
    video.setAttribute("aria-label", title || labels.play);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "resume-video-start";
    const icon = document.createElement("span");
    icon.textContent = "\u25b6";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    const status = document.createElement("span");
    status.className = "resume-video-status";
    status.setAttribute("role", "status");
    status.hidden = true;
    video.parentElement.append(button, status);
    let generation = 0;
    let timer;
    let loading = false;

    const setLabel = (label) => {
      button.title = label;
      button.setAttribute("aria-label", title ? `${label}: ${title}` : label);
    };
    setLabel(labels.play);

    const fail = () => {
      if (!loading) return;
      loading = false;
      generation += 1;
      clearTimeout(timer);
      video.pause();
      video.preload = "none";
      video.removeAttribute("src");
      video.load();
      video.controls = false;
      video.tabIndex = -1;
      button.hidden = false;
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      icon.textContent = "\u21bb";
      setLabel(labels.retry);
      status.textContent = labels.failed;
      status.hidden = false;
    };

    const start = () => {
      if (loading) return;
      const attempt = ++generation;
      loading = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      status.hidden = false;
      status.textContent = labels.loading;
      setLabel(labels.loading);
      preparePreview(video);
      video.preload = "auto";
      video.controls = true;
      video.tabIndex = 0;
      if (!video.hasAttribute("src")) {
        video.src = source;
        video.load();
      }
      timer = window.setTimeout(fail, 20000);
      const playback = video.play();
      playback?.catch(() => {
        if (attempt === generation) fail();
      });
    };

    button.addEventListener("click", start);
    video.addEventListener("click", () => {
      if (!button.hidden && !loading) start();
    });
    video.addEventListener("playing", () => {
      loading = false;
      clearTimeout(timer);
      if (document.activeElement === button) video.focus({ preventScroll: true });
      button.hidden = true;
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      status.hidden = true;
    });
    video.addEventListener("error", () => {
      loading = true;
      fail();
    });
    video.addEventListener("pause", () => {
      if (loading) fail();
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        preparePreview(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "300px 0px" });
    videos.forEach((video) => observer.observe(video));
  } else {
    videos.forEach(preparePreview);
  }

  document.addEventListener("play", (event) => {
    if (!(event.target instanceof HTMLVideoElement)) return;
    videos.forEach((video) => {
      if (video !== event.target) video.pause();
    });
  }, true);
})();
/* resume-video-preview:v1:end */
