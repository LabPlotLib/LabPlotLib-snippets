"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class Element {
    constructor() {
        this.children = [];
        this.listeners = {};
        this.value = "";
        this.textContent = "";
    }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
}

test("searches each catalog independently and sends insertion requests", () => {
    const ids = ["status", "symbol-search", "function-search", "symbols", "functions"];
    const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
    const messages = [];
    let receive;
    const source = fs.readFileSync(path.join(__dirname, "..", "media", "sidebar.js"), "utf8");
    vm.runInNewContext(source, {
        acquireVsCodeApi: () => ({ postMessage: (message) => messages.push(message) }),
        document: { getElementById: (id) => elements[id], createElement: () => new Element() },
        window: { addEventListener: (type, callback) => { receive = callback; } }
    });
    assert.equal(messages[0].type, "ready");
    receive({ data: { type: "catalog", catalog: {
        version: "0.12.0",
        symbols: [{ name: "sigma", value: "σ" }, { name: "degree", value: "°" }],
        functions: [
            { name: "line_plot", signature: "(x, y)", description: "Line" },
            { name: "scatter_plot", signature: "(x, y)", description: "Scatter" }
        ]
    } } });
    assert.equal(elements.symbols.children.length, 2);
    assert.equal(elements.functions.children.length, 2);
    elements["symbol-search"].value = "Σ";
    elements["symbol-search"].listeners.input();
    assert.equal(elements.symbols.children.length, 1);
    assert.equal(elements.symbols.children[0].children[1].textContent, "sigma");
    assert.equal(elements.functions.children.length, 2);
    elements.symbols.children[0].listeners.click();
    assert.equal(messages.at(-1).kind, "symbol");
    assert.equal(messages.at(-1).name, "sigma");
    elements["function-search"].value = "line";
    elements["function-search"].listeners.input();
    assert.equal(elements.functions.children.length, 1);
    elements.functions.children[0].listeners.click();
    assert.equal(messages.at(-1).kind, "function");
    assert.equal(messages.at(-1).name, "line_plot");
    assert.equal(elements.status.textContent, "Bundled catalog: LabPlotLib 0.12.0");
});
