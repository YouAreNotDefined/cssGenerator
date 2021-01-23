"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const fs_1 = require("fs");
function activate(context) {
    const messageJsDir = path.join(context.extensionPath, 'src');
    const messageJsUri = vscode.Uri.file(path.join(messageJsDir, 'message.js'));
    const inssertScript = messageJsUri.with({ scheme: 'vscode-resource' }).toString(true);
    const env = process.env;
    const outDir = (env.Tmp ? path.join(env.Tmp, 'cssGenerator') : '');
    const resourceRoot = [
        vscode.Uri.file(outDir),
        vscode.Uri.file(messageJsDir),
    ];
    let disposable = vscode.commands.registerCommand('cssgenerator', () => {
        const editor = vscode.window.activeTextEditor;
        if (typeof editor === 'undefined') {
            vscode.window.showInformationMessage('No active window!');
            return;
        }
        const lastDot = editor.document.fileName.lastIndexOf('.');
        const lang = lastDot >= 0 ? editor.document.fileName.substring(lastDot + 1) : '';
        if (lang !== 'html')
            return;
        const doc = editor.document;
        let curSelection = editor.selection;
        if (editor.selection.isEmpty) {
            const startPos = new vscode.Position(0, 0);
            const endPos = new vscode.Position(doc.lineCount - 1, 10000);
            curSelection = new vscode.Selection(startPos, endPos);
        }
        const html = doc.getText(curSelection);
        // Get classes
        const viewPanel = vscode.window.createWebviewPanel('html', 'cssGenerator', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: resourceRoot,
        });
        viewPanel.webview.html = html;
        // Open a file
        const uri = editor.document.uri.toString(true);
        const lastSlash = uri.lastIndexOf('/');
        const filePath = lastSlash >= 0 ? uri.substring(0, lastSlash) : '';
        const appPathIndex = vscode.env.appRoot.lastIndexOf('resources');
        const appPath = appPathIndex >= 0 ? vscode.env.appRoot.substring(0, appPathIndex) : '';
        // writeFile(vscode.Uri.parse(`${filePath}/style.css`), html, (err) => {
        fs_1.writeFile('./style.css', html, (err) => {
            if (err) {
                vscode.window.showInformationMessage(`${err}`);
                // vscode.window.showInformationMessage(`${appPath}`);
            }
            else {
                // vscode.window.showInformationMessage(`${appPath}style.css`);
                vscode.window.showInformationMessage('Success!');
                vscode.workspace.openTextDocument(`${appPath}style.css`).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map