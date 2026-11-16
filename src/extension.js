"use strict";

const vscode = require("vscode");
const { functionSnippet } = require("./catalog");
const catalog = require("./default-catalog.json");

function activate(context) {
    const output = vscode.window.createOutputChannel("LabPlotLib");
    const provider = new CatalogProvider(context.extensionUri, output);
    context.subscriptions.push(
        output,
        provider,
        vscode.window.registerWebviewViewProvider("labplotlib.catalog", provider),
        vscode.window.onDidChangeActiveTextEditor((editor) => provider.editorChanged(editor))
    );
    provider.editorChanged(vscode.window.activeTextEditor);
}

class CatalogProvider {
    constructor(extensionUri, output) {
        this.extensionUri = extensionUri;
        this.output = output;
        this.lastEditor = undefined;
        this.disposables = [];
    }

    resolveWebviewView(view) {
        this.view = view;
        this.disposables.push(view.onDidDispose(() => {
            if (this.view === view) {
                this.view = undefined;
                this.clearViewSubscriptions();
            }
        }));
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")]
        };
        view.webview.html = this.html(view.webview);
        this.disposables.push(view.webview.onDidReceiveMessage((message) => {
            if (message.type === "ready") {
                view.webview.postMessage({ type: "catalog", catalog });
            } else if (message.type === "insert") {
                void this.insert(message.kind, message.name);
            }
        }));
    }

    editorChanged(editor) {
        if (!editor || editor.document.languageId !== "python") {
            return;
        }
        this.lastEditor = editor;
    }

    async insert(kind, name) {
        const editor = this.lastEditor;
        if (!editor || !vscode.window.visibleTextEditors.includes(editor) ||
            editor.document.languageId !== "python") {
            void vscode.window.showWarningMessage("Open a Python editor before inserting a LabPlotLib snippet.");
            return;
        }
        let snippet;
        if (kind === "symbol" && catalog.symbols.some((item) => item.name === name)) {
            snippet = new vscode.SnippetString();
            const key = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
                .replace(/\r/g, "\\r").replace(/\n/g, "\\n");
            snippet.appendText(`{symbols['${key}']}`);
        } else if (kind === "function") {
            const item = catalog.functions.find((entry) => entry.name === name);
            if (item) {
                snippet = functionSnippet(vscode, item);
            }
        }
        if (!snippet) {
            void vscode.window.showErrorMessage("That LabPlotLib item is not in the bundled catalog.");
            return;
        }
        try {
            const target = await vscode.window.showTextDocument(editor.document, editor.viewColumn);
            const inserted = await target.insertSnippet(snippet);
            if (!inserted) {
                throw new Error("The editor could not insert the snippet.");
            }
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            this.output.appendLine(detail);
            void vscode.window.showErrorMessage(`LabPlotLib: ${detail}`);
        }
    }

    html(webview) {
        const css = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "sidebar.css"));
        const script = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "sidebar.js"));
        return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource};">
<link rel="stylesheet" href="${css}"></head>
<body>
<p id="status" role="status">Loading catalog...</p>
<section><h2>Symbols</h2><label class="sr-only" for="symbol-search">Search symbols</label>
<input id="symbol-search" type="search" placeholder="Search symbols" autocomplete="off">
<div id="symbols" class="list"></div></section>
<section><h2>Plotting functions</h2><label class="sr-only" for="function-search">Search plotting functions</label>
<input id="function-search" type="search" placeholder="Search plotting functions" autocomplete="off">
<div id="functions" class="list"></div></section>
<script src="${script}"></script></body></html>`;
    }

    dispose() {
        this.clearViewSubscriptions();
    }

    clearViewSubscriptions() {
        this.disposables.forEach((disposable) => disposable.dispose());
        this.disposables = [];
    }
}

module.exports = { activate };
