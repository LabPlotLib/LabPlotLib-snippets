"use strict";

function functionSnippet(vscode, item) {
    const snippet = new vscode.SnippetString();
    snippet.appendText(`${item.name}(`);
    item.required.forEach((parameter, index) => {
        if (index) {
            snippet.appendText(", ");
        }
        if (parameter.keywordOnly) {
            snippet.appendText(`${parameter.name}=`);
        }
        snippet.appendPlaceholder(parameter.name, index + 1);
    });
    snippet.appendText(")");
    snippet.appendTabstop(0);
    return snippet;
}

module.exports = { functionSnippet };
