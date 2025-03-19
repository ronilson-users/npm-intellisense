import plugin from "../plugin.json";
// Importing methodCompletions
import methodCompletions from "./methodCompletions.js";

// APis Acode
const fs = acode.require("fs") || acode.require("fsOperation");
const fileList = acode.require("fileList");
const { editor } = editorManager;

class NpmIntellisense {
 constructor() {
  /** @type {string[]} List of project dependencies from package.json */
  this.dependencies = [];
  /** @type {Object} Cache of package details fetched from npm registry */
  this.packageDetailsCache = {};
  /** @type {Object|null} Reference to AcodeX terminal API */
  this.acodex = acode.require("acodex");
  /** @type {string|null} Path to package.json file */
  this.packagePath = null;
  /** @type {string|null} Project directory path */
  this.projectDir = null;
  this.init();
  this.checkForUpdates();
  this.npmCompletions.getCompletions = this.npmCompletions.getCompletions.bind(this);
 }

 async init() {
  const { commands } = editorManager.editor;

  commands.addCommand({
   name: "reset-cache",
   bindKey: { win: "Ctrl-Shift-R", mac: "Command-Shift-R" },
   exec: () => {
    localStorage.removeItem("npmIntellisenseCache-dependencies");
    localStorage.removeItem("npmIntellisenseCache-hash");
    Object.keys(localStorage).forEach(key => {
     if (key.startsWith("npmIntellisenseCache-"))
      localStorage.removeItem(key);
    });
    window.toast(" 🗑️ Dependencies cache reset", 2000);
   }
  });

  commands.addCommand({
   name: "clear-data",
   bindKey: { win: "Ctrl-Shift-C", mac: "Command-Shift-C" },
   exec: () => {
    this.dependencies = [];
    this.packageDetailsCache = {};
    localStorage.clear();
    window.toast(" 🗑️ All data cache reset", 2000);
   }
  });

  try {
   await this.checkAcodeXStatus(true);
   this.packagePath = await this.getPackagePath();
   this.projectDir = this.packagePath
    ? this.packagePath.substring(
     0,
     this.packagePath.lastIndexOf("/")
    ) : null;
   await this.loadDependencies();

   editor.completers.unshift(this.npmCompletions);
   editorManager.on(
    "switch-file",
    async () => await this.loadDependencies()
   );

   editorManager.on(
    "save-file",
    async () => await this.loadDependencies()
   );

   this.setupEditorListener();
  } catch (error) {
   console.log("Error initializing NpmIntellisense", { error });
  }
 }

 setupEditorListener() {
  const editor = editorManager.editor;
  if (editor.session.$npmIntellisenseListener) return;

  editor.session.$npmIntellisenseListener = editor.session.on(
   "change",
   delta => {
    if (
     delta.action === "insert" &&
     (delta.lines[0] === ";" || delta.lines[0] === "\n")
    ) {
     this.checkForImports(delta);
    }
   }
  );
 }


 /**
   * Generates a hash from content string.
   * @param {string} content - The content to hash
   * @returns {string} Hash value as string
   */
 hash(content) {
  const hashValue =
   content
    .split("")
    .reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) & 0;
  return hashValue.toString();
 }

 /**
    * Extracts the current input from the editor line at the cursor position.
    * @param {string} line - Current line text
    * @param {number} column - Cursor column position
    * @returns {{varName: string, methodPrefix: string}} Object with variable name and method prefix
    */

 getCurrentInput(line, column) {
  const regex = /[a-zA-Z0-9_$]/; // Caracteres válidos para nomes de variáveis
  let input = "";
  let i = column - 1;

  // Captura caracteres antes do cursor até encontrar um não identificador ou espaço
  while (i >= 0 && regex.test(line[i])) {
   input = line[i] + input;
   i--;
  }

  // Verifica se há um ponto antes do prefixo do método
  if (i >= 0 && line[i] === ".") {
   let varName = "";
   i--; // Pula o ponto
   while (i >= 0 && regex.test(line[i])) {
    varName = line[i] + varName;
    i--;
   }
   return {
    varName: varName,
    methodPrefix: input
   };
  }

  return {
   varName: input,
   methodPrefix: ""
  };
 }

 /**
   * Detects the context (library and variable name) from the editor session.
   * @param {Object} session - Editor session
   * @param {{row: number}} pos - Cursor position
   * @returns {{varName: string, library: string}|null} Context object or null if not found
   */
 detectContext(session, pos) {
  const lines = session.getLines(0, pos.row);
  const libraryPatterns = {
   express:
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:require\s*\(['"]express['"]\)|express)\b|import\s+(\w+)\s*from\s*['"]express['"]/,
   axios: /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(['"]axios['"]\)\s*;?|import\s+(\w+)\s*from\s*['"]axios['"]/,
   lodash: /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(['"]lodash['"]\)\s*;?|import\s+(\w+)\s+from\s*['"]lodash['"]/,
   moment: /(?:const|let|var)\s+(\w+)\s*=\s*(?:require\s*\(['"]moment['"]\)|moment)\b|import\s+(\w+)\s*from\s*['"]moment['"]/,
   dayjs: /(?:const|let|var)\s+(\w+)\s*=\s*(?:require\s*\(['"]dayjs['"]\)|dayjs)\b|import\s+(\w+)\s*from\s*['"]dayjs['"]/,
   chalk: /(?:const|let|var)\s+(\w+)\s*=\s*(?:require\s*\(['"]chalk['"]\)|chalk)\b|import\s+(\w+)\s*from\s*['"]chalk['"]/,
   inquirer:
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:require\s*\(['"]inquirer['"]\)|inquirer)\b|import\s+(\w+)\s*from\s*['"]inquirer['"]/,
   dotenv: /(?:const|let|var)\s+(\w+)\s*=\s*(?:require\s*\(['"]dotenv['"]\)|dotenv)\b|import\s+(\w+)\s*from\s*['"]dotenv['"]/,
   mongoose:
    /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(['"]mongoose['"]\)\s*;?/,
   jsonwebtoken:
    /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(['"]jsonwebtoken['"]\)\s*;?|import\s+(\w+)\s+from\s*['"]jsonwebtoken['"]/,
   bcrypt: /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(['"]bcrypt['"]\)\s*;?|import\s+(\w+)\s+from\s*['"]bcrypt['"]/,
   socketio:
    /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(['"]socket\.io['"]\)\s*;?|import\s+(\w+)\s+from\s*['"]socket\.io['"]/
  };

  for (let i = lines.length - 1; i >= 0; i--) {
   const line = lines[i].trim();

   for (const [library, pattern] of Object.entries(libraryPatterns)) {
    const match = line.match(pattern);
    if (match) {
     const varName = match[1] || match[2];

     return { varName, library };
    } else {
     console.log(
      `Nenhum match para ${library} na linha: "${line}"`
     );
    }
   }
  }

  return null;
 }

 /** @type {Object} Autocompletion provider for    the editor 
    * Provides completion suggestions based on context or dependencies.
    * @param {Object} editor - The editor instance
    * @param {Object} session - Editor session
    * @param {{row: number, column: number}} pos - Cursor position
    * @param {string} prefix - Prefix to filter completions
    * @param {Function} callback - Callback to return suggestions
    * @async
    */
 npmCompletions = {
  async getCompletions(editor, session, pos, prefix, callback) {
   if (typeof callback !== "function") {
    console.error("Callback não é uma função. Ignorando chamada.");
    return;
   }

   try {
    const currentLine = session.getLine(pos.row);
    const input = this.getCurrentInput(currentLine, pos.column);
    let suggestions = [];

    console.log("Input detectado:", input);

    if (input.varName) {
     const context = this.detectContext(session, pos);

     if (
      context &&
      context.varName === input.varName &&
      methodCompletions[context.library]
     ) {
      const packageDetails = await this.fetchPackageDetails(
       context.library
      );

      suggestions = methodCompletions[context.library]
       .filter(method =>
        method.name.startsWith(input.methodPrefix)
       )
       .map(method => ({
        caption: method.name,
        value: method.name,
        score: method.score || 600,
        meta: `${context.library} method`,
        icon: "ace_completion-icon ace_method",
        docHTML: `
         <div style="padding: 1px; margin: 0; font-family: Arial, sans-serif; font-size: 10px; color: #d4d4d4;  border-radius: 2px; white-space: pre;">
         <strong style="color: #569cd6;">${method.name}</strong><br>
         <span style="color: #9cdcfe;">${method.description}</span><br>
         <span style="color: #ce9178;">Ex: </span><code style="background: #2d2d2d; padding: 2px; border-radius: 3px; ">${method.example}</code><br>
         <span style="color: #d4d4d4;">Pkg: ${context.library} (v${packageDetails.version})</span><br>
         <a href="${packageDetails.homepage}" target="_blank" style="color: #4ec9b0; text-decoration: none; font-size: 12px;">
         ${packageDetails.homepage}
         </a>
         </div>
`
       }));

      console.log("Sugestões geradas:", suggestions);
     } else {
      // Sugestões de dependências (comportamento original)




      suggestions = this.dependencies
       .filter(dep => dep.startsWith(input.varName))
       .map(dep => ({
        caption: dep,
        value: dep,
        score: 600,
        icon: "ace_completion-icon ace_method",
        meta: "dependency"
       }));
     }
    }

    callback(null, suggestions);
   } catch (err) {
    console.error("Erro em getCompletions:", err);
    window.toast("NpmIntellisense Error: " + err.message, 3000);
    callback(null, []);
   }
  }
 };

 /**
   * Checks for import statements and installs missing libraries.
   * @param {Object} delta - Change event data
   * @async
   */

 async checkForImports(delta) {
  const editor = editorManager.editor;
  const session = editor.session;
  const currentLine = session.getLine(delta.start.row).trim();

  const importMatch =
   currentLine.match(/import\s+.\s+from\s+['"]([^'"]+)['"]\s;/) ||
   currentLine.match(
    /const\s+\w+\s*=\s*require\s*\(['"]([^'"]+)['"]\)\s*;/
   );
  if (!importMatch) return;

  const library = importMatch[1];
  if (!this.projectDir || !this.packagePath) {
   await this.loadDependencies();
  }

  if (!this.projectDir) {
   window.toast(" 📁 No npm project found.", 3000);
   return;
  }

  const packageData = JSON.parse(
   await fs(this.packagePath).readFile("utf-8")
  );
  const deps = {
   ...packageData.dependencies,
   ...packageData.devDependencies
  };

  if (!deps[library]) {
   const installed = await this.installLibrary(library);
   if (installed) {
    await this.loadDependencies();
   }
  }
 }



 async installLibrary(library) {
  if (!(await this.ensureAcodeXTerminal())) return false;

  const confirm = acode.require("confirm");
  if (!confirm) {
   window.toast("Confirmation module not available", 4000);
   return false;
  }

  const confirmation = await confirm(
   "Install Library",
   `Do you want to install ${library} via npm?`
  );
  if (!confirmation) {
   window.toast(`Installation of ${library} cancelled`, 3000);
   return false;
  }

  const command = `npm install ${library}`;
  try {
   window.toast(`Installing ${library}...`, 2000);
   await this.acodex.execute(command);
   window.toast(`${library} installed successfully!`, 2000);
   return true;
  } catch (err) {
   console.error(`Error installing ${library}:`, err);
   window.toast(
    `Failed to install ${library}. Check AcodeX terminal.`,
    3000
   );
   return false;
  }
 }

 async checkAcodeXStatus(silent = false) {
  if (!this.acodex) {
   if (!silent) window.toast(" ⚙️ AcodeX is not installed.", 4000);
   this.acodexAvailable = false;
   return false;
  }
  const isOpened = this.acodex.isTerminalOpened();
  this.acodexAvailable = true;
  if (!silent)
   window.toast(
    isOpened ? "AcodeX is open!" : "AcodeX terminal not open.",
    2000
   );
  return isOpened;
 }

 async ensureAcodeXTerminal() {
  if (!this.acodexAvailable) {
   window.toast(" ⚙️ AcodeX not available.", 4000);
   return false;
  }
  if (!this.acodex.isTerminalOpened()) {
   this.acodex.newTerminal?.() || this.acodex.openTerminal?.();
  }
  return true;
 }

 async getPackagePath() {
  const list = await fileList();
  const packageFile = list.find(item => item.name === "package.json");
  if (!packageFile || !packageFile.url)
   throw new Error("package.json not found.");
  return packageFile.url;
 }

 async loadDependencies() {
  try {
   this.packagePath = await this.getPackagePath();
   this.projectDir = this.packagePath.substring(
    0,
    this.packagePath.lastIndexOf("/")
   );
   const packageJsonContent = await fs(this.packagePath).readFile(
    "utf-8"
   );
   const currentHash = this.hash(packageJsonContent);

   if (
    currentHash !==
    localStorage.getItem("npmIntellisenseCache-hash")
   ) {
    const packageJson = JSON.parse(packageJsonContent);
    this.dependencies = Object.keys(
     packageJson.dependencies || {}
    ).concat(Object.keys(packageJson.devDependencies || {}));
    localStorage.setItem(
     "npmIntellisenseCache-dependencies",
     JSON.stringify(this.dependencies)
    );
    localStorage.setItem("npmIntellisenseCache-hash", currentHash);
   } else {
    this.dependencies =
     JSON.parse(
      localStorage.getItem(
       "npmIntellisenseCache-dependencies"
      )
     ) || [];
   }
  } catch (error) {
   console.error("Error loading dependencies:", error);
  }
 }

 async checkForUpdates() {
  const interval = 60000;
  setInterval(async () => {
   try {
    await this.loadDependencies();
   } catch (error) {
    console.error("Error checking for updates:", error);
   }
  }, interval);
 }


 /**
    * Fetches package details from npm registry or cache.
    * @param {string} packageName - Name of the package
    * @returns {Promise<Object>} Package details
    * @async
    */
 async fetchPackageDetails(packageName) {
  if (this.packageDetailsCache[packageName]) {
   return this.packageDetailsCache[packageName];
  }

  try {
   const response = await fetch(
    `https://registry.npmjs.org/${packageName}`
   );

   if (!response.ok) throw new Error("Failed to fetch package data");
   const data = await response.json();

   console.log("data", data);

   const latestVersion = data["dist-tags"].latest;

   const details = {
    description: data.description || "No description available",
    homepage:
     data.homepage ||
     `https://www.npmjs.com/package/${packageName}`,
    version: latestVersion
   };

   this.packageDetailsCache[packageName] = details;
   localStorage.setItem(
    `npmIntellisenseCache-${packageName}`,
    JSON.stringify(details)
   );
   return details;
  } catch (error) {
   console.error(`Error fetching ${packageName} details:`, error);
   const cached = localStorage.getItem(
    `npmIntellisenseCache-${packageName}`
   );
   return cached
    ? JSON.parse(cached) : {
     description: "No description available",
     homepage: `https://www.npmjs.com/package/${packageName}`,
     version: "unknown"
    };
  }
 }

 /**
   * Cleans up plugin resources on unmount.
   * @async
   */
 async destroy() {
  editorManager.editor.commands.removeCommand("reset-cache");
  editorManager.editor.commands.removeCommand("clear-data");
  editorManager.editor.session.off(
   "change",
   editorManager.editor.session.$npmIntellisenseListener
  );
  editor.completers = editor.completers.filter(
   completer => completer !== this.npmCompletions
  );
 }
}

if (window.acode) {
 const acodePlugin = new NpmIntellisense();
 acode.setPluginInit(
  plugin.id,
  async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
   if (!baseUrl.endsWith("/")) baseUrl += "/";
   acodePlugin.baseUrl = baseUrl;
   await acodePlugin.init($page, cacheFile, cacheFileUrl);
  }
 );

 acode.setPluginUnmount(plugin.id, () => acodePlugin.destroy());
}