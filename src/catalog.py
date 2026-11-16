"""Generate a catalog from an installed LabPlotLib for manual updates."""

import importlib
import inspect
import json


def build_catalog():
    package = importlib.import_module("labplotlib")
    symbols_module = importlib.import_module("labplotlib.symbols")
    plotting_module = importlib.import_module("labplotlib.plotting")
    symbols = [
        {"name": name, "value": value}
        for name, value in symbols_module.symbols.items()
    ]
    functions = []
    for name, function in inspect.getmembers(plotting_module, inspect.isfunction):
        if name.startswith("_") or function.__module__ != plotting_module.__name__:
            continue
        signature = inspect.signature(function)
        required = [
            {"name": parameter.name, "keywordOnly": parameter.kind == inspect.Parameter.KEYWORD_ONLY}
            for parameter in signature.parameters.values()
            if parameter.default is inspect.Parameter.empty
            and parameter.kind not in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD)
        ]
        doc = inspect.getdoc(function) or ""
        functions.append(
            {"name": name, "signature": str(signature), "description": doc.split("\n")[0], "required": required}
        )
    return {
        "version": getattr(package, "__version__", "unknown"),
        "symbols": symbols,
        "functions": functions,
    }


if __name__ == "__main__":
    print("LABPLOTLIB_CATALOG=" + json.dumps(build_catalog(), ensure_ascii=True))
