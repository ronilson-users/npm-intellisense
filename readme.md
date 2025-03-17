# NpmIntellisense - Plugin NPM no Acode

![npm-intellisense](https://img.shields.io/badge/NPM-Intellisense-blue.svg)

O **NpmIntellisense** é um plugin para o editor Acode que fornece sugestões automáticas de autocompletar para dependências npm. Ele verifica as dependências listadas no `package.json`, identifica bibliotecas utilizadas no código e pode até instalar pacotes automaticamente.

## 📌 Recursos

- 📜 Sugestões automáticas para pacotes npm instalados.
- 🔍 Detecção de bibliotecas importadas e instalação automática.
- 🔧 Comandos úteis para limpar cache e verificar o status do AcodeX.
- ⌨️ Atalhos de teclado para comandos rápidos.
- 🚀 Integração com o terminal AcodeX para instalação de pacotes.

## 📦 Instalação

1. Certifique-se de que o **AcodeX** está instalado para suporte completo.
2. Baixe e instale o plugin **NpmIntellisense** no Acode.
3. Abra um projeto Node.js contendo um `package.json`.
4. Comece a programar! O plugin fornecerá sugestões conforme você digita.

## ⚡ Atalhos de Teclado

| Atalho               | Ação                                |
|----------------------|------------------------------------|
| `Ctrl-Shift-R`      | Resetar cache de dependências     |
| `Ctrl-Shift-C`      | Limpar dados do cache             |
| `Ctrl-Shift-A`      | Verificar status do AcodeX        |
| `Ctrl-Shift-T`      | Abrir ou maximizar terminal AcodeX |

## 🔧 Configuração

O plugin é carregado automaticamente ao iniciar o Acode. Ele monitora mudanças nos arquivos e atualiza sugestões dinamicamente.

## 🛠️ Comandos Internos

- **Instalação automática**: Se um pacote for detectado como importado mas não instalado, o plugin tentará instalá-lo automaticamente.
- **Cache Inteligente**: Armazena localmente as dependências para melhor desempenho.
- **Detecção de Contexto**: Sugestões aprimoradas para frameworks populares como `express`.

## 📝 Exemplo de Uso

Ao digitar:

```js
const express = require('express');
const app = express();

app.
```