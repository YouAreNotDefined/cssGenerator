# cssGenerator

This is an extension for Visual Studio Code that allows you to create a new CSS file automatically based on an active HTML file on your Vscode window.

Please note that this extension is based on BEM and somewhat orderly class name is required in this extension.

## Usage

It is simple to use this.

1. Install.
2. Open an HTML file on your Vscode window and activate it.
3. Bring up the Command Palette (Press "Ctrl + Shift + P" or "⌘ + Shift + P").
4. Search for the "Generate Css" on Command Palette and select it.

For example:
![cssGenerator_example](https://user-images.githubusercontent.com/61075280/106465067-f0c69800-6445-11eb-9cea-dcbfae2e07d7.gif)

## Settings

You can use the following settings.

- `minWidth`: number of minimum viewportWidth. Default is 768px.
- `maxWidth`: number of max viewportWidth. Default is 767px.
- `resetCss`: styels to reset the styling of all HTML elements to a consistent baseline. Default is false.
- `ignorantClass`: classes you do not want to be reflected in the CSS file that will be created. You have to enter the class name, separated by commas.

The resetCss is as follows.
![cssGenerator_reset_css](https://user-images.githubusercontent.com/61075280/106465093-fb812d00-6445-11eb-9535-2354d0280433.png)
