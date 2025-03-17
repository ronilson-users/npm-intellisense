import plugin from '../plugin.json';
import * as acorn from "acorn"
import diffMatchPatch from "diff-match-patch";

const { editor } = editorManager;


const selectionMenu = acode.require("selectionMenu");
const toast = acode.require("toast");
const Range = ace.require("ace/range").Range;
const DiffMatchPatch = require("diff-match-patch");

class AcodePlugin {
 async init($page) {
  console.log("Inicializando plugin Acode Diff");
  
  // Exemplo de uso com o clique do mouse
editor.container.addEventListener("click", (e) => {
  const coords = editor.renderer.screenToTextCoordinates(e.clientX, e.clientY);
  this.showCustomDiv(
    editor,
    `Você clicou na linha ${coords.row + 1}, coluna ${coords.column + 1}`,
    e.clientX,
    e.clientY
  );
});

  try {
   if (!selectionMenu || !toast || !Range) {
    throw new Error("Módulos necessários não foram carregados corretamente.");
   }

   selectionMenu.add(this.run.bind(this), "Diff", "all");
   console.log("Adicionada opção Diff ao menu de seleção");

   let command = {
    name: "Acode Diff",
    description: "Acode Diff Engine",
    bindKey: {
     win: "Ctrl-y"
    },
    exec: this.run.bind(this)
   };
   editorManager.editor.commands.addCommand(command);
   console.log("Comando Acode Diff adicionado ao editor");

   $page.id = "acode.diff.plugin";
   $page.settitle("Acode Diff");
  } catch (error) {
   console.error("Erro ao inicializar o plugin Acode Diff:", error);
   toast.show("Erro ao inicializar o plugin Acode Diff");
  }
 }

 run() {
  const editor = editorManager.editor;
  const originalText = editor.getValue();
  const newText = prompt("Insira o novo texto para comparar:");

  if (newText !== null) {
   const dmp = new DiffMatchPatch();
   const diffs = dmp.diff_main(originalText, newText);
   dmp.diff_cleanupSemantic(diffs);




   
  }
 }
 
 
  showCustomDiv(editor, content, x, y) {
  const editorContainer = editor.container; // Elemento do container do Ace Editor

  // Remova qualquer div existente antes de criar uma nova
  let existingDiv = document.getElementById("custom-div");
  if (existingDiv) {
    existingDiv.remove();
  }

  // Crie a nova div
  const customDiv = document.createElement("div");
  customDiv.id = "custom-div";
  customDiv.textContent = content;
  customDiv.style.position = "absolute";
  customDiv.style.left = `${x}px`;
  customDiv.style.top = `${y}px`;
  customDiv.style.backgroundColor = "#fff";
  customDiv.style.border = "1px solid #ccc";
  customDiv.style.padding = "5px";
  customDiv.style.zIndex = "10";
  customDiv.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
  customDiv.style.pointerEvents = "auto"; // Permite interatividade

  // Adicione a div ao container do editor
  editorContainer.appendChild(customDiv);
}


 
 
}

// Inicialização do plugin
if (window.acode) {
 const acodePlugin = new AcodePlugin();

 acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
  if (!baseUrl.endsWith('/')) {
   baseUrl += '/';
  }
  acodePlugin.baseUrl = baseUrl;
  await acodePlugin.init($page, cacheFile, cacheFileUrl);
 });

 acode.setPluginUnmount(plugin.id, () => {
  acodePlugin.destroy();
 });
}