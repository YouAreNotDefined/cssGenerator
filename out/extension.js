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
        if (lang !== 'html') {
            vscode.window.showInformationMessage('Active file is not HTML');
            return;
        }
        ;
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
        viewPanel.webview.html = getHtml(html, inssertScript);
        let cssObj;
        let cssTexts = '';
        viewPanel.webview.onDidReceiveMessage((data) => {
            cssObj = createTemplate(data, true, true);
            cssObj.forEach(css => {
                cssTexts = `${css.pc}\n${css.sp}\n`;
            });
            // Open a file
            const uri = editor.document.uri.toString(true);
            const lastSlash = uri.lastIndexOf('/');
            const filePath = lastSlash >= 0 ? uri.substring(0, lastSlash) : '';
            const appPathIndex = vscode.env.appRoot.lastIndexOf('resources');
            const appPath = appPathIndex >= 0 ? vscode.env.appRoot.substring(0, appPathIndex) : '';
            // writeFile(vscode.Uri.parse(`${filePath}/style.css`), html, (err) => {
            fs_1.writeFile('./style.css', cssTexts, (err) => {
                if (err) {
                    vscode.window.showInformationMessage(`${err}`);
                    // vscode.window.showInformationMessage(`${appPath}`);
                }
                else {
                    // vscode.window.showInformationMessage(`${appPath}style.css`);
                    // vscode.window.showInformationMessage('Success!');
                    // vscode.window.showInformationMessage(`${cssTexts}`)
                    vscode.workspace.openTextDocument(`${appPath}style.css`)
                        .then(doc => {
                        vscode.window.showTextDocument(doc);
                        setTimeout(() => {
                            viewPanel.dispose();
                        }, 3000);
                    });
                }
            });
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getHtml(html, script) {
    const bodyPosition = html.lastIndexOf('</body>');
    const bodyBeforeHtml = html.slice(0, bodyPosition);
    const bodyAfterHtml = html.slice(bodyPosition);
    const scriptTag = `<script type="text/javascript" src="${script}"></script>`;
    return `${bodyBeforeHtml}${scriptTag}${bodyAfterHtml}`;
}
function createTemplate(data, comment, needReset) {
    const pcQuery = '@media screen and (min-width:768px) { \n';
    const spQuery = '@media screen and (max-width:767px) { \n';
    const pc = `/*===== PC =====*/\n${pcQuery}`;
    const sp = `/*===== SP =====*/\n${spQuery}`;
    let reset = '';
    let charSet = '';
    let resetComment = '';
    let resetCss = '';
    if (needReset) {
        charSet = '@charset "UTF-8";\n';
        resetComment = '/*==============================\nリセットCSS\n==============================*/\n/*===== PC/Tablet/SP =====*/\n';
        resetCss = 'html, body, div, span, applet, object, iframe,\nh1, h2, h3, h4, h5, h6, p, blockquote, pre,\na, abbr, acronym, address, \nbig, cite, code,\ndel, dfn, em, img, ins, kbd, q, s, samp,\nsmall, strike, strong, sub, sup, tt, var,\nb, u, i, dl, dt, dd, ol, ul, li,\nfieldset, form, label, legend,\ntable, caption, tbody, tfoot, thead, tr, th, td,\narticle, aside, canvas, details, embed,\nfigure, figcaption, footer, header, hgroup,\nmenu, nav, output, ruby, section, summary,\ntime, mark, audio, video {\nmargin: 0;\npadding: 0;\nborder: 0;\nfont-size: 100%;\nfont: inherit;\nvertical-align: baseline;\n}\n* {\nbox-sizing: border-box;\noutline: none;\n}\narticle, aside, details, figcaption, figure,\nfooter, header, hgroup, menu, nav, section {\ndisplay: block;\n}\nbody, html {\ndisplay: block;\n}\nbody {\n-webkit-text-size-adjust: 100 %;\n}\nimg {\nmax-width: 100 %;\nheight: auto;\nvertical-align: bottom;\n}\nol, ul {\nlist-style: none;\n}\ntable {\nborder-collapse: collapse;\nborder-spacing: 0;\n}\nbtn {\nmargin: 0;\npadding: 0;\nbackground: none;\nborder: 0;\ncursor: pointer;\n}\n\n';
        reset = `${charSet}${resetComment}${resetCss}`;
    }
    let untillUnderStr = [];
    let beforeLineStr = [];
    const sameStr1 = data
        .map((el, i) => {
        const underIndex = el.indexOf('__');
        const storeStr = underIndex >= 0 ? el.slice(0, underIndex) : '';
        const hasNotStr = untillUnderStr.every(str => str !== storeStr);
        untillUnderStr[i] = storeStr;
        if (hasNotStr && underIndex >= 0) {
            return untillUnderStr[i];
        }
    })
        .filter((str) => str !== undefined);
    const sameStr2 = data
        .map((el, i) => {
        const underIndex = el.indexOf('_');
        const afterUnderStr = underIndex >= 0 ? el.slice(underIndex + 2) : '';
        const lineIndex = afterUnderStr.indexOf('-');
        const storeStr = lineIndex >= 0 ? afterUnderStr.slice(0, lineIndex) : afterUnderStr;
        const hasNotStr = beforeLineStr.every(str => str !== storeStr);
        beforeLineStr[i] = storeStr;
        if (hasNotStr && lineIndex >= 0) {
            return beforeLineStr[i];
        }
    })
        .filter((str) => str !== undefined);
    vscode.window.showInformationMessage(`${data}`);
    let css = [{ pc: '', sp: '' }];
    sameStr1.forEach((str1, i) => {
        let isFirst1 = true;
        const commentText1 = getComment(str1, true);
        sameStr2.forEach((str2, j) => {
            let isFirst2 = true;
            const commentText2 = getComment(str2, false);
            data.forEach(className => {
                if (className.indexOf(str1) || className.indexOf(str2)) {
                    if (className.indexOf(str1)) {
                        if (isFirst1) {
                            css[i].pc += `\n${commentText1}${pc}`;
                            css[i].sp += `\n${commentText1}${sp}`;
                            isFirst1 = false;
                        }
                    }
                    if (className.indexOf(str2)) {
                        if (isFirst2) {
                            css[i].pc += `\n${commentText2}\n`;
                            css[i].sp += `\n${commentText2}\n`;
                            isFirst2 = false;
                        }
                    }
                    css[i].pc += `.${className}{\n\n}\n`;
                    css[i].sp += `.${className}{\n\n}\n`;
                }
                if (sameStr2.length - 1 === j) {
                    css[i].pc += '}\n';
                    css[i].sp += '}\n';
                }
            });
        });
    });
    vscode.window.showInformationMessage(`${css}`);
    return css;
}
function getComment(text, isTitle) {
    const topCommentOut = '/*====================';
    const bottomCommentOut = '====================*/';
    const leftCommentOut = '/*===== ';
    const rightCommentOut = ' =====*/';
    if (isTitle) {
        return `${topCommentOut}\n${text}\n${bottomCommentOut}`;
    }
    else {
        return `${leftCommentOut}${text}${rightCommentOut}`;
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map