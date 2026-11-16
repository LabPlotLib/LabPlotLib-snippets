"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const catalog = require("../src/default-catalog.json");

function harness() {
    const listeners = {};
    const messages = [];
    const inserted = [];
    const warnings = [];
    const errors = [];
    const document = { languageId: "python", uri: { toString: () => "file:///test/a.py" } };
    const editor = { document, viewColumn: 1, insertSnippet: async (s) => { inserted.push(s.value); return true; } };
    const emitter = (name) => (fn) => { listeners[name] = fn; return { dispose() {} }; };
    class SnippetString {
        constructor() { this.value = ""; }
        appendText(text) { this.value += text; }
        appendPlaceholder(text, index) { this.value += `\${${index}:${text}}`; }
        appendTabstop(index) { this.value += `$${index}`; }
    }
    const output = { appendLine: (text) => errors.push(text), dispose() {} };
    const vscode = {
        Uri: { joinPath: (...parts) => ({ fsPath: parts.join("/"), toString: () => parts.join("/") }) },
        SnippetString,
        window: {
            activeTextEditor: editor,
            visibleTextEditors: [editor],
            createOutputChannel: () => output,
            registerWebviewViewProvider: (id, provider) => { listeners.provider = provider; return { dispose() {} }; },
            onDidChangeActiveTextEditor: emitter("editor"),
            showTextDocument: async () => editor,
            showWarningMessage: (text) => { warnings.push(text); },
            showErrorMessage: (text) => { errors.push(text); }
        }
    };
    const mod = { exports: {} };
    const code = fs.readFileSync(path.join(__dirname, "..", "src", "extension.js"), "utf8");
    vm.runInNewContext(code, {
        module: mod,
        require: (name) => {
            if (name === "vscode") return vscode;
            if (name === "./default-catalog.json") return catalog;
            if (name === "./catalog") return require("../src/catalog");
            throw new Error(`Unexpected dependency: ${name}`);
        }
    });
    mod.exports.activate({ extensionUri: "extension", subscriptions: [] });
    const view = { onDidDispose: emitter("dispose"), webview: {
        asWebviewUri: (uri) => uri.toString(),
        cspSource: "vscode-resource:",
        postMessage: (message) => { messages.push(message); },
        onDidReceiveMessage: emitter("message")
    } };
    return { listeners, messages, inserted, warnings, errors, vscode, view };
}

test("serves the prebuilt catalog without a Python extension or interpreter", () => {
    const h = harness();
    h.listeners.provider.resolveWebviewView(h.view);
    h.listeners.message({ type: "ready" });
    assert.equal(h.messages.at(-1).type, "catalog");
    assert.equal(h.messages.at(-1).catalog, catalog);
    assert.equal(h.messages.at(-1).catalog.symbols.length, 117);
});

test("inserts prebuilt symbols and plotting snippets into a Python editor", async () => {
    const h = harness();
    h.listeners.provider.resolveWebviewView(h.view);
    await h.listeners.provider.insert("symbol", "sigma");
    await h.listeners.provider.insert("function", "line_plot");
    assert.deepEqual(h.inserted, ["{symbols['sigma']}", "line_plot(${1:x}, ${2:y})$0"]);
    h.vscode.window.visibleTextEditors = [];
    await h.listeners.provider.insert("symbol", "sigma");
    assert.match(h.warnings[0], /Open a Python editor/);
});

test("rejects unknown catalog items", async () => {
    const h = harness();
    h.listeners.provider.resolveWebviewView(h.view);
    await h.listeners.provider.insert("function", "unknown");
    assert.match(h.errors[0], /not in the bundled catalog/);
    assert.deepEqual(h.inserted, []);
});
