import plugin from "../plugin.json";
import hljs from "highlight.js/lib/core";
import styles from "./styles.css";

// Linguagens adicionais
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", html);

const { editor } = editorManager;
const SideButton = acode.require("sideButton");

class MinimapPlugin {
  constructor() {
    this.minimapContainer = null;
    this.minimapContent = null;
    this.viewport = null;
    this.resizer = null;
    this.isMinimapVisible = true;
    this.highlightCache = new Map();
    this.debouncedUpdate = this.debounce(this.updateMinimap.bind(this), 300);
    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.dragThreshold = 10;
  }

  init(baseUrl, $page, settings) {
    this.createMinimapContainer();
    document.body.append(this.minimapContainer);

    editorManager.on("switch-file", () => {
      this.updateMinimap();
    });

    this.updateMinimap();

    editor.on("change", this.debouncedUpdate);
    editor.on("scroll", this.updateViewport.bind(this));
    this.minimapContent.addEventListener("click", this.navigateMinimap.bind(this));
    this.minimapContent.addEventListener("touchstart", this.navigateMinimap.bind(this));

    this.initDragAndResize();
    this.createSideButton();
  }

  createMinimapContainer() {
    this.minimapContainer = document.createElement("section");
    this.minimapContainer.className = "minimap-container";
    this.minimapContainer.innerHTML = `
      <div class="minimap-header" data-action="drag" aria-label="Minimap Header" tabindex="0">
        <div class="minimap-title">Minimap</div>
      </div>
      <div class="minimap-content" role="navigation"></div>
      <div class="minimap-viewport"></div>
      <div class="resizer" aria-label="Resize Minimap"></div>
    `;
    this.minimapContent = this.minimapContainer.querySelector(".minimap-content");
    this.viewport = this.minimapContainer.querySelector(".minimap-viewport");
    this.resizer = this.minimapContainer.querySelector(".resizer");
  }

  updateMinimap() {
    const content = editor.getValue();
    const lines = content.split("\n");
    const language = this.getFileLanguage();

    if (lines.length === 0) {
      this.minimapContent.innerHTML = `<div class="minimap-empty">No content</div>`;
      return;
    }

    this.minimapContent.innerHTML = "";
    lines.forEach((line, index) => {
      const lineElement = document.createElement("div");
      lineElement.className = "minimap-line";
      lineElement.dataset.line = index + 1;
      lineElement.innerHTML = this.highlightLine(line, language);
      this.minimapContent.appendChild(lineElement);
    });

    this.updateViewport();
  }

  highlightLine(line, language) {
    if (!this.highlightCache.has(line)) {
      this.highlightCache.set(line, hljs.highlight(line, { language }).value);
    }
    return this.highlightCache.get(line);
  }

  getFileLanguage() {
    const fileName = editorManager.activeFile?.name || "";
    const extension = fileName.split(".").pop();
    const languageMap = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      css: "css",
      html: "html",
    };
    return languageMap[extension] || "javascript";
  }

  updateViewport() {
    const editorHeight = editor.getSession().getLength(); // Total de linhas no editor
    const visibleHeight = editor.getLastVisibleRow() - editor.getFirstVisibleRow() + 1; // Linhas visíveis
    const scrollTop = editor.getFirstVisibleRow(); // Linha inicial visível

    const minimapHeight = this.minimapContent.offsetHeight; // Altura visível do minimapa
    const totalContentHeight = this.minimapContent.scrollHeight; // Altura total do conteúdo do minimapa

    // Proporção do viewport em relação ao conteúdo total
    const viewportHeight = Math.min((visibleHeight / editorHeight) * totalContentHeight, minimapHeight);
    const viewportTop = (scrollTop / editorHeight) * totalContentHeight;

    // Limita o viewport para não ultrapassar o minimapa
    const maxTop = minimapHeight - viewportHeight;
    const boundedTop = Math.max(0, Math.min(viewportTop, maxTop));

    this.viewport.style.height = `${viewportHeight}px`;
    this.viewport.style.top = `${boundedTop}px`;
  }

  navigateMinimap(e) {
    const isTouch = e.type === "touchstart";
    const lineElement = isTouch ? e.target : e.target.closest(".minimap-line");

    if (lineElement && lineElement.classList.contains("minimap-line")) {
      if (isTouch) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) return;
      }

      const line = parseInt(lineElement.dataset.line, 10);
      if (!isNaN(line)) {
        editor.gotoLine(line, 0, true);
      }
    }
  }

  createSideButton() {
    const minimapSideButton = SideButton({
      text: "Minimap",
      icon: "minimap-icon",
      onclick: () => {
        this.isMinimapVisible = !this.isMinimapVisible;
        this.minimapContainer.style.display = this.isMinimapVisible ? "block" : "none";
      },
      backgroundColor: "#4CAF50",
      textColor: "#FFF",
    });
    minimapSideButton.show();
  }

  initDragAndResize() {
    this.resizer.addEventListener("mousedown", this.initResize.bind(this));
    this.resizer.addEventListener("touchstart", this.initResize.bind(this));
    this.minimapContainer.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.minimapContainer.addEventListener("touchstart", this.onTouchStart.bind(this));
  }

  initResize(e) {
    e.preventDefault();
    const isTouch = e.type.startsWith("touch");
    const moveEvent = isTouch ? "touchmove" : "mousemove";
    const stopEvent = isTouch ? "touchend" : "mouseup";

    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    const initialWidth = this.minimapContainer.offsetWidth;
    const initialHeight = this.minimapContainer.offsetHeight;

    const resize = (event) => {
      const clientX = isTouch ? event.touches[0].clientX : event.clientX;
      const clientY = isTouch ? event.touches[0].clientY : event.clientY;
      const newWidth = Math.max(100, Math.min(initialWidth + (clientX - startX), window.innerWidth - 100));
      const newHeight = Math.max(100, Math.min(initialHeight + (clientY - startY), window.innerHeight - 100));
      this.minimapContainer.style.width = `${newWidth}px`;
      this.minimapContainer.style.height = `${newHeight}px`;
      this.updateViewport(); // Atualiza o viewport após redimensionar
    };

    const stopResize = () => {
      window.removeEventListener(moveEvent, resize);
      window.removeEventListener(stopEvent, stopResize);
    };

    window.addEventListener(moveEvent, resize);
    window.addEventListener(stopEvent, stopResize);
  }

  onMouseDown(e) {
    if (e.target.closest(".minimap-header")) {
      this.isDragging = true;
      const rect = this.minimapContainer.getBoundingClientRect();
      this.offsetX = e.clientX - rect.left;
      this.offsetY = e.clientY - rect.top;

      const move = (event) => {
        if (this.isDragging) {
          const newLeft = event.clientX - this.offsetX;
          const newTop = event.clientY - this.offsetY;
          this.applyBounds(newLeft, newTop);
        }
      };

      const stop = () => {
        this.isDragging = false;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", stop);
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", stop);
    }
  }

  onTouchStart(e) {
    if (e.touches.length === 1 && e.target.closest(".minimap-header")) {
      this.isDragging = true;
      const touch = e.touches[0];
      const rect = this.minimapContainer.getBoundingClientRect();
      this.offsetX = touch.clientX - rect.left;
      this.offsetY = touch.clientY - rect.top;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;

      const move = (event) => {
        if (this.isDragging) {
          const touch = event.touches[0];
          const newLeft = touch.clientX - this.offsetX;
          const newTop = touch.clientY - this.offsetY;
          this.applyBounds(newLeft, newTop);
        }
      };

      const stop = () => {
        this.isDragging = false;
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", stop);
      };

      window.addEventListener("touchmove", move);
      window.addEventListener("touchend", stop);
    }
  }

  applyBounds(left, top) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = this.minimapContainer.getBoundingClientRect();
    const boundedLeft = Math.min(Math.max(0, left), viewportWidth - rect.width);
    const boundedTop = Math.min(Math.max(0, top), viewportHeight - rect.height);
    this.minimapContainer.style.left = `${boundedLeft}px`;
    this.minimapContainer.style.top = `${boundedTop}px`;
  }

  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  destroy() {
    if (this.minimapContainer) this.minimapContainer.remove();
    editor.off("change", this.debouncedUpdate);
    editor.off("scroll", this.updateViewport);
    this.highlightCache.clear();
  }
}

if (window.acode) {
  acode.setPluginInit(plugin.id, (baseUrl, $page, settings) => new MinimapPlugin().init(baseUrl, $page, settings));
  acode.setPluginUnmount(plugin.id, () => new MinimapPlugin().destroy());
}