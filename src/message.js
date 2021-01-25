const vscode = acquireVsCodeApi();

window.onload = () => {
  let fewClasses;
  const elements = [...document.querySelectorAll('[class]')];
  const classNames = elements.map(el => {
    const className = el.getAttribute('class');
    if (className.indexOf(' ') >= 0) {
      fewClasses = className.split(' ');
      return fewClasses.forEach(fewClass => { return fewClass; });
    } else {
      return className;
    }
  });
  vscode.postMessage(classNames);
}
