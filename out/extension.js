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
    const outDir = (env.Tmp ? path.join(env.Tmp, 'CssGenerator') : '');
    const resourceRoot = [
        vscode.Uri.file(outDir),
        vscode.Uri.file(messageJsDir),
    ];
    let disposable = vscode.commands.registerCommand('CssGenerator', () => {
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
        const viewPanel = vscode.window.createWebviewPanel('html', 'cssGenerator', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: resourceRoot,
        });
        viewPanel.webview.html = getHtml(html, inssertScript);
        const config = vscode.workspace.getConfiguration('CssGenerator');
        const configMinWidth = config.get('minWidth');
        const configMaxWidth = config.get('maxWidth');
        const isNeededReset = config.get('resetCss');
        const ignorantClass = config.get('ignorantClass');
        assertIsDefined(configMinWidth);
        assertIsDefined(configMaxWidth);
        assertIsDefined(isNeededReset);
        assertIsDefined(ignorantClass);
        viewPanel.webview.onDidReceiveMessage((data) => {
            const cssObj = createTemplate(configMaxWidth, configMinWidth, isNeededReset, ignorantClass, data);
            const cssTexts = cssObj.reduce((acc, css, i) => {
                if (i === cssObj.length - 1) {
                    return `${acc}${css.pc}\n}${css.sp}\n}`;
                }
                else {
                    return acc + css.pc + css.sp;
                }
            }, '');
            const uri = editor.document.uri.toString(true);
            const lastSlash = uri.lastIndexOf('/');
            const filePath = lastSlash >= 0 ? uri.substring(0, lastSlash) : '';
            const cssUri = vscode.Uri.parse(filePath).fsPath.replace(/c:/, '');
            // const appPathIndex = vscode.env.appRoot.lastIndexOf('resources');
            // const appPath = appPathIndex >= 0 ? vscode.env.appRoot.substring(0,appPathIndex) : '';
            fs_1.writeFile(`${cssUri}/generated.css`, cssTexts, (err) => {
                if (err) {
                    vscode.window.showInformationMessage(`${err}`);
                }
                else {
                    vscode.window.showInformationMessage('Success!');
                    vscode.workspace.openTextDocument(`${cssUri}/generated.css`)
                        .then(doc => {
                        vscode.window.showTextDocument(doc);
                        viewPanel.dispose();
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
function createTemplate(maxWidth, minWidth, needReset, ignorantClass, data) {
    const pcQuery = `@media screen and (min-width:${minWidth}) { \n`;
    const spQuery = `@media screen and (max-width:${maxWidth}) { \n`;
    const pc = `/*===== PC =====*/\n${pcQuery}`;
    const sp = `/*===== SP =====*/\n${spQuery}`;
    let unnecessaryClass = [];
    let allData = data;
    if (ignorantClass !== '') {
        unnecessaryClass = ignorantClass.split(',');
        allData = data.filter(className => !unnecessaryClass.includes(className));
    }
    ;
    const charSet = '@charset "UTF-8";\n';
    let strs = [];
    const pattern = /[-,_]+/;
    const sameStr1 = allData
        .map(el => {
        const isContainPattern = pattern.test(el);
        const strArray = isContainPattern ? el.split(pattern, 2) : el;
        if (strArray instanceof Array) {
            const hasNotStr = strs.every(str => str.join() !== strArray.join());
            strs.push(strArray);
            if (hasNotStr && isContainPattern) {
                return strArray;
            }
        }
    })
        .filter((str) => str !== undefined);
    let css = [{ pc: '', sp: '' }];
    css[0].pc += charSet;
    if (needReset) {
        const resetComment = '\n/*==============================\nリセットCSS\n==============================*/\n/*===== PC/Tablet/SP =====*/\n';
        const resetCss = 'html, body, div, span, applet, object, iframe,\nh1, h2, h3, h4, h5, h6, p, blockquote, pre,\na, abbr, acronym, address, \nbig, cite, code,\ndel, dfn, em, img, ins, kbd, q, s, samp,\nsmall, strike, strong, sub, sup, tt, var,\nb, u, i, dl, dt, dd, ol, ul, li,\nfieldset, form, label, legend,\ntable, caption, tbody, tfoot, thead, tr, th, td,\narticle, aside, canvas, details, embed,\nfigure, figcaption, footer, header, hgroup,\nmenu, nav, output, ruby, section, summary,\ntime, mark, audio, video {\n\tmargin: 0;\n\tpadding: 0;\n\tborder: 0;\n\tfont-size: 100%;\n\tfont: inherit;\n\tvertical-align: baseline;\n}\n* {\n\tbox-sizing: border-box;\n\toutline: none;\n}\narticle, aside, details, figcaption, figure,\nfooter, header, hgroup, menu, nav, section {\n\tdisplay: block;\n}\nbody, html {\n\tdisplay: block;\n}\nbody {\n\t-webkit-text-size-adjust: 100%;\n}\nimg {\n\tmax-width: 100%;\n\theight: auto;\n\tvertical-align: bottom;\n}\nol, ul {\n\tlist-style: none;\n}\ntable {\n\tborder-collapse: collapse;\n\tborder-spacing: 0;\n}\nbtn {\n\tmargin: 0;\n\tpadding: 0;\n\tbackground: none;\n\tborder: 0;\n\tcursor: pointer;\n}\n\n';
        css[0].pc += resetComment + resetCss;
    }
    let isFirst1 = true;
    let beforeStr1 = [];
    let i = 0;
    let NoPatternStore;
    allData.forEach(className => {
        var _a;
        const classStr1 = (_a = sameStr1.find(str1 => {
            const reg = new RegExp(`${str1[0]}[-,_]+${str1[1]}`);
            return className.search(reg) >= 0;
        })) === null || _a === void 0 ? void 0 : _a.join(' ');
        const NoPatternClass = sameStr1.find(str1 => str1[0] === className);
        if (classStr1) {
            const isNotAdded1 = beforeStr1.every(str1 => {
                const reg1 = new RegExp(str1);
                return classStr1.search(reg1) === -1;
            });
            if (isNotAdded1 && beforeStr1.length > 0) {
                isFirst1 = true;
                css[i].pc += '}\n';
                css[i].sp += '}\n';
                i += 1;
                css.push({ pc: '', sp: '' });
            }
            beforeStr1.push(classStr1);
            if (isFirst1) {
                const commentText1 = getComment(classStr1, true);
                css[i].pc += `\n${commentText1}\n${pc}`;
                css[i].sp += `\n${sp}`;
                if (NoPatternStore) {
                    css[i].pc += `\t.${NoPatternStore}{\n\n\t}\n`;
                    css[i].sp += `\t.${NoPatternStore}{\n\n\t}\n`;
                }
                NoPatternStore = false;
                isFirst1 = false;
            }
        }
        if (!NoPatternClass && className !== ignorantClass) {
            const regClass = new RegExp(className);
            const isNotAddedClass = css.every(cssText => !regClass.test(cssText.pc));
            if (isNotAddedClass) {
                css[i].pc += `\t.${className}{\n\n\t}\n`;
                css[i].sp += `\t.${className}{\n\n\t}\n`;
            }
        }
        else {
            NoPatternStore = className;
        }
    });
    return css;
}
function assertIsDefined(val) {
    if (val === undefined || val === null) {
        throw new Error(`Expected 'val' to be defined, but received ${val}`);
    }
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