import plugin from '../plugin.json';
const fs = acode.require("fs");
const fileList = acode.require("fileList");
const { editor } = editorManager;

class NpmIntellisense {
 constructor() {
  this.dependencies = [];
  this.packageDetailsCache = {};
  this.methodCompletions = {
   express: [
    { name: 'route', description: 'Define routes for multiple HTTP methods', score: 600 },
    { name: 'get', description: 'Handle GET requests', score: 600 },
    { name: 'post', description: 'Handle POST requests', score: 600 },
    { name: 'put', description: 'Handle PUT requests', score: 600 },
    { name: 'delete', description: 'Handle DELETE requests', score: 600 },
    { name: 'listen', description: 'Start the server', score: 600 }
   ],
   axios: [],
   lodash: []
   // Adicione mais bibliotecas aqui, ex.: 'lodash', 'axios', etc.
  };
  this.init();
  this.checkForUpdates();
  this.npmCompletions.getCompletions = this.npmCompletions.getCompletions.bind(this);
 }

 async init() {
  const { commands } = editorManager.editor;
  commands.addCommand({
   name: 'reset-cache',
   bindKey: { win: 'Ctrl-Shift-R', mac: 'Command-Shift-R' },
   exec: () => {
    localStorage.removeItem('npmIntellisenseCache-dependencies');
    localStorage.removeItem('npmIntellisenseCache-hash');
    window.toast("Reset dependencies Cache");
   },
  });
  commands.addCommand({
   name: 'clear-data',
   bindKey: { win: 'Ctrl-Shift-C', mac: 'Command-Shift-C' },
   exec: () => {
    this.dependencies = [];
    localStorage.removeItem('npmIntellisenseCache-dependencies');
    localStorage.removeItem('npmIntellisenseCache-hash');
    window.toast("Reset Data Cache");
   },
  });

  try {
   const packagePath = await this.getPackagePath();
   await this.loadDependencies();
   editor.completers.unshift(this.npmCompletions);
   editorManager.on("switch-file", async () => await this.loadDependencies());
   editorManager.on("save-file", async () => await this.loadDependencies());
  } catch (error) {
   console.log('Erro ao inicializar NpmIntellisense', { error });
  }
 }

 async getPackagePath() {
  const list = await fileList();
  const packageFile = list.find((item) => item.name === "package.json");

  if (!packageFile || !packageFile.url) {
   throw new Error("Arquivo package.json não encontrado.");
  }
  return packageFile.url;
 }

 async loadDependencies() {
  try {
   const packagePath = await this.getPackagePath();

   const packageJsonContent = await fs(packagePath).readFile('utf-8');

   const currentHash = this.hash(packageJsonContent);

   if (currentHash !== localStorage.getItem('npmIntellisenseCache-hash')) {
    const packageJson = JSON.parse(packageJsonContent);

    this.dependencies = Object.keys(packageJson.dependencies || {})
     .concat(Object.keys(packageJson.devDependencies || {}));

    localStorage.setItem('npmIntellisenseCache-dependencies', JSON.stringify(this.dependencies));

    localStorage.setItem('npmIntellisenseCache-hash', currentHash);
   } else {
    this.dependencies = JSON.parse(localStorage.getItem('npmIntellisenseCache-dependencies')) || [];
   }
  } catch (error) {
   console.error('Erro ao carregar dependências:', error);
  }
 }

 async checkForUpdates() {
  const interval = 60000;
  setInterval(async () => {
   try {
    await this.loadDependencies();
   } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
   }
  }, interval);
 }

 hash(content) {
  return content.split('').reduce((a, b) => {
   a = ((a << 5) - a) + b.charCodeAt(0);
   return a & a;
  }, 0);
 }

 getCurrentInput(line, column) {
  let input = "";
  let i = column - 1;
  while (i >= 0 && /[a-zA-Z0-9/.+_-\s$@:]/.test(line[i])) {
   input = line[i] + input;
   i--;
  }
  return input;
 }

 // Metodo para detectar o contexto da variável
 detectContext(session, pos) {
  const lines = session.getLines(0, pos.row);
  let expressVar = null;
  let axiosVar = null;
  let lodashVar = null;

  // Procura por uma declaração como "const app = express()"
  for (let i = lines.length - 1; i >= 0; i--) {
   const line = lines[i];
   const match = line.match(/const\s+(\w+)\s*=\s*express\(\)/);
   if (match) {
    expressVar = match[1]; // Ex.: "app"
    break;
   }
  }
  return expressVar;
 }

 npmCompletions = {
  async getCompletions(editor, session, pos, prefix, callback) {
   try {
    const currentLine = session.getLine(pos.row);
    const input = this.getCurrentInput(currentLine, pos.column);
    let suggestions = [];

    // Detecta se estamos após um ponto (ex.: "app.")
    const parts = input.split('.');
    if (parts.length > 1) {
     const varName = parts[0]; // Ex.: "app"
     const methodPrefix = parts[1]; // Ex.: "r" de "route"
     const expressVar = this.detectContext(session, pos);

     if (varName === expressVar && this.dependencies.includes('express')) {
      // Sugestões de métodos do Express
      suggestions = this.methodCompletions.express
       .filter(method => method.name.startsWith(methodPrefix))
       .map(method => ({
        caption: method.name,
        value: method.name,
        score: method.score,
        meta: "express method",
        icon: "ace_completion-icon ace_method",
        docHTML: `<p>${method.description}</p>`
       }));
     }
    } else {
     // Sugestões de dependências (comportamento original)
     suggestions = this.dependencies
      .filter(dep => dep.startsWith(input))
      .map(dep => ({
       caption: dep,
       value: dep,
       score: 600,
       icon: "ace_completion-icon ace_method",
       meta: "dependency"
      }));
    }

    callback(null, suggestions);
   } catch (err) {
    callback(null, []);
    window.toast("NpmIntellisense Error: " + err.message, 3000);
    console.error(err.message);
   }
  }
 };

 async destroy() {
  editorManager.editor.commands.removeCommand("NpmIntellisense");
  
  editor.completers = editor.completers.filter((completer) => completer !== this.npmCompletions);
 }
}

if (window.acode) {
 const acodePlugin = new NpmIntellisense();
 acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  acodePlugin.baseUrl = baseUrl;
  await acodePlugin.init($page, cacheFile, cacheFileUrl);
 });
 acode.setPluginUnmount(plugin.id, () => acodePlugin.destroy());
}