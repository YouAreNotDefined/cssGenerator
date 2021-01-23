const vscode = acquireVsCodeApi();

window.onload(() => {
  const elements = document.querySelectorAll('[class]');
  const classNames = elements.map(el => el.getAttribute('class'));
  vscode.postMessage(classNames);
})
