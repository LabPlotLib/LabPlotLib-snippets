"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { functionSnippet } = require("../src/catalog");
const catalog = require("../src/default-catalog.json");

class Snippet {
    constructor() { this.parts = []; }
    appendText(text) { this.parts.push(["text", text]); }
    appendPlaceholder(text, index) { this.parts.push(["placeholder", text, index]); }
    appendTabstop(index) { this.parts.push(["tabstop", index]); }
}

test("function snippets include required positional and keyword-only arguments", () => {
    const snippet = functionSnippet({ SnippetString: Snippet }, {
        name: "plot",
        required: [
            { name: "x", keywordOnly: false },
            { name: "axes", keywordOnly: true }
        ]
    });
    assert.deepEqual(snippet.parts, [
        ["text", "plot("], ["placeholder", "x", 1], ["text", ", "],
        ["text", "axes="], ["placeholder", "axes", 2], ["text", ")"], ["tabstop", 0]
    ]);
});

test("function snippets support functions without required arguments", () => {
    const snippet = functionSnippet({ SnippetString: Snippet }, { name: "plot", required: [] });
    assert.deepEqual(snippet.parts, [["text", "plot("], ["text", ")"], ["tabstop", 0]]);
});

test("bundled catalog contains usable symbols and plotting functions", () => {
    assert.equal(catalog.version, "0.12.0");
    assert.equal(catalog.symbols.length, 167);
    assert.equal(catalog.functions.length, 8);
    assert.deepEqual(catalog.symbols.find((item) => item.name === "sigma"), { name: "sigma", value: "σ" });
    assert.deepEqual(catalog.symbols.find((item) => item.name === "cubed"), { name: "cubed", value: "³" });
    assert.equal(catalog.symbols.some((item) => item.name === "superscript_three_3"), false);
    assert.deepEqual(catalog.symbols.find((item) => item.name === "plus_minus"), { name: "plus_minus", value: "±" });
    assert.deepEqual(catalog.symbols.find((item) => item.name === "pm"), { name: "pm", value: "±" });
    assert.deepEqual(
        catalog.symbols.filter((item) => item.name.startsWith("planet_")).map((item) => item.name),
        [
            "planet_sun", "planet_mercury", "planet_venus", "planet_earth", "planet_mars",
            "planet_jupiter", "planet_saturn", "planet_uranus", "planet_neptune", "planet_pluto"
        ]
    );
    assert.deepEqual(
        catalog.symbols.filter((item) => item.name.startsWith("greek_")).map((item) => item.name),
        [
            "greek_alpha", "greek_beta", "greek_gamma", "greek_delta", "greek_epsilon",
            "greek_zeta", "greek_eta", "greek_theta", "greek_iota", "greek_kappa",
            "greek_lambda", "greek_mu", "greek_nu", "greek_xi", "greek_omicron",
            "greek_pi", "greek_rho", "greek_sigma", "greek_tau", "greek_upsilon",
            "greek_phi", "greek_chi", "greek_psi", "greek_omega",
            "greek_capital_alpha", "greek_capital_beta", "greek_capital_gamma",
            "greek_capital_delta", "greek_capital_epsilon", "greek_capital_zeta",
            "greek_capital_eta", "greek_capital_theta", "greek_capital_iota",
            "greek_capital_kappa", "greek_capital_lambda", "greek_capital_mu",
            "greek_capital_nu", "greek_capital_xi", "greek_capital_omicron",
            "greek_capital_pi", "greek_capital_rho", "greek_capital_sigma",
            "greek_capital_tau", "greek_capital_upsilon", "greek_capital_phi",
            "greek_capital_chi", "greek_capital_psi", "greek_capital_omega",
            "greek_final_sigma"
        ]
    );
    assert.deepEqual(catalog.symbols.find((item) => item.name === "planet_sun"), {
        name: "planet_sun",
        value: "☉"
    });
    assert.deepEqual(
        catalog.functions.find((item) => item.name === "line_plot").required.map((item) => item.name),
        ["x", "y"]
    );
    for (const item of catalog.functions) {
        assert.equal(typeof item.signature, "string");
        assert.equal(typeof item.description, "string");
        assert.ok(Array.isArray(item.required));
        for (const parameter of item.required) {
            assert.equal(typeof parameter.name, "string");
            assert.equal(typeof parameter.keywordOnly, "boolean");
        }
    }
});
