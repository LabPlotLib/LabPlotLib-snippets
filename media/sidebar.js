"use strict";

const vscode = acquireVsCodeApi();
const status = document.getElementById("status");
const symbolSearch = document.getElementById("symbol-search");
const functionSearch = document.getElementById("function-search");
const symbols = document.getElementById("symbols");
const functions = document.getElementById("functions");
let catalog;

function renderList(container, entries, query, kind) {
    container.replaceChildren();
    const needle = query.trim().toLowerCase();
    const matches = entries.filter((entry) =>
        entry.name.toLowerCase().includes(needle) ||
        (kind === "symbol" && entry.value.toLowerCase().includes(needle))
    );
    if (!matches.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "No matches";
        container.appendChild(empty);
        return;
    }
    for (const entry of matches) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "item";
        const primary = document.createElement("span");
        primary.className = "primary";
        primary.textContent = kind === "symbol" ? entry.value : "ƒ";
        const name = document.createElement("span");
        name.className = "name";
        name.textContent = entry.name;
        button.append(primary, name);
        if (kind === "function") {
            button.title = `${entry.name}${entry.signature}\n${entry.description}`;
        } else {
            button.title = `Insert {symbols['${entry.name}']}`;
        }
        button.addEventListener("click", () => vscode.postMessage({ type: "insert", kind, name: entry.name }));
        container.appendChild(button);
    }
}

function render() {
    if (!catalog) {
        symbols.replaceChildren();
        functions.replaceChildren();
        return;
    }
    renderList(symbols, catalog.symbols, symbolSearch.value, "symbol");
    renderList(functions, catalog.functions, functionSearch.value, "function");
}

symbolSearch.addEventListener("input", render);
functionSearch.addEventListener("input", render);
window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "catalog") {
        catalog = message.catalog;
        status.textContent = `Bundled catalog: LabPlotLib ${catalog.version}`;
        render();
    }
});
vscode.postMessage({ type: "ready" });
