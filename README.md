# LabPlotLib Sidebar

A VS Code activity-bar sidebar for browsing a prebuilt catalog of LabPlotLib
symbols and plotting functions. Both lists are searchable, and clicking an
item inserts it into the last active, visible Python editor.

## Getting started

1. Install the packaged VSIX with **Extensions: Install from VSIX**, or open
   this extension's folder in VS Code and press **F5** to launch an Extension
   Development Host.
2. Open a Python file, then select the LabPlotLib icon in the activity bar.

Browsing and inserting snippets do not require Python, the Python extension, or
LabPlotLib to be installed. To run the inserted code, install `labplotlib` in
your Python environment: `python -m pip install labplotlib`.

The bundled catalog is a snapshot of 0.13.0. It includes the Greek and
planetary symbols and names in the supplied symbol reference, and may differ
from the version you have installed. The extension does not inspect your
environment or update the catalog automatically.

## Inserting snippets

- **Symbols:** click, for example, sigma to insert `{symbols['sigma']}`. This
  is intended for use inside a Python f-string; import the mapping with
  `from labplotlib import symbols`. Outside an f-string, use
  `symbols['sigma']` instead (without the outer braces).
- **Plotting functions:** click a function to insert a call with editable
  placeholders for its required arguments. Press Tab to move between them.
  Import the function yourself, for example `from labplotlib import line_plot`.
  Optional arguments can be added manually. Hover over a function to see its
  bundled signature and description.

For example:

```python
from labplotlib import symbols

label = f"Uncertainty {symbols['sigma']}"
```

Use double quotes for the outer f-string to keep this syntax compatible with
Python versions before 3.12.

The plotting list contains public functions defined by `labplotlib.plotting`,
including `annotate_fit`; it does not include unrelated functions imported by
that module.

## Development

Run the JavaScript tests with `npm test`. To package the extension for local
installation, use `npx @vscode/vsce package` and install the resulting VSIX via
VS Code's **Extensions: Install from VSIX** command.

To update the bundled snapshot, edit `src/default-catalog.json` or run
`src/catalog.py` with the target LabPlotLib version installed and save the JSON
after the `LABPLOTLIB_CATALOG=` prefix as `src/default-catalog.json`. Update the
catalog expectations in the tests, then repackage and reinstall the extension.
