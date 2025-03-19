# NpmIntellisense Plugin for Acode

A plugin for the [Acode editor](https://acode.foxdebug.com/) that enhances your JavaScript development experience by providing intelligent autocompletion and management for npm packages.

## Overview

`NpmIntellisense` integrates seamlessly with the Acode editor to offer autocompletion for popular npm packages, dependency management, and real-time package installation. Whether you're working with Express, Axios, or other libraries, this plugin makes coding faster and more efficient.

## Features

- **Autocompletion**: Suggests methods and properties for popular libraries (e.g., Express, Axios, Lodash) with detailed documentation and examples.
- **Dependency Suggestions**: Autocompletes package names from your `package.json` dependencies and devDependencies.
- **Package Installation**: Detects missing imports and offers to install them via npm using the AcodeX terminal.
- **Rich Tooltips**: Displays method descriptions, examples, package versions, and links to documentation in completion tooltips.
- **Cache Management**: Stores package data locally for faster access and provides commands to reset the cache.
- **Real-Time Updates**: Automatically reloads dependencies when switching files or saving changes.

## Supported Libraries

The plugin currently supports autocompletion for the following libraries:
- `express`
- `axios`
- `lodash`
- `moment`
- `dayjs`
- `chalk`
- `inquirer`
- `dotenv`
- `mongoose`
- `jsonwebtoken`
- `bcrypt`
- `socket.io`

More libraries can be added by extending the `methodCompletions.js` file.

## Installation

1. **Prerequisites**:
   - Acode editor installed on your device.
   - [AcodeX](https://github.com/bajrangCoder/acodex) plugin installed (optional, required for npm installations).

2. **Steps**:
   - Download or clone this repository.
   - Copy the plugin files to your Acode plugins directory.
   - Open Acode, go to Settings > Plugins, and enable `NpmIntellisense`.

3. **Verify**:
   - Open a JavaScript file in a project with a `package.json`.
   - Start typing a package name (e.g., "exp") or a variable (e.g., "app.") to see suggestions.

## Usage

### Autocompletion
- **Dependencies**: Type a partial package name (e.g., "ax") to see suggestions like "axios" from your `package.json`.
- **Methods**: After declaring a library (e.g., `const app = require('express')`), type `app.` to get method suggestions like `app.get()` with documentation.

### Commands
- **Reset Cache**: Use `Ctrl+Shift+R` (Windows) or `Command+Shift+R` (Mac) to clear the dependency cache.
- **Clear All Data**: Use `Ctrl+Shift+C` (Windows) or `Command+Shift+C` (Mac) to reset all plugin data.

### Package Installation
- Write an import (e.g., `const x = require('lodash')`) and press `;` or Enter.
- If the package isn't in `package.json`, the plugin will prompt to install it via npm (requires AcodeX).

## Configuration

- The plugin automatically detects your project's `package.json` file.
- No additional configuration is needed, but ensure your project directory contains a valid `package.json`.

## Development

### Adding New Libraries
To support additional libraries:
1. Open `methodCompletions.js`.
2. Add a new entry with method names, descriptions, and examples.
3. Update the `detectContext` method in the main file with a new regex pattern for the library.

### Building
- The plugin is written in JavaScript and requires no build step.
- Ensure all dependencies (e.g., `methodCompletions.js`, `plugin.json`) are in the same directory.

## Contributing

Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with your changes.

## License

This plugin is released under the [MIT License](LICENSE).

## Acknowledgments

- Built for the Acode editor community.
- Thanks to the AcodeX team for terminal integration support.

## Issues

If you encounter bugs or have feature requests, please [open an issue](https://github.com/your-repo/npm-intellisense/issues).