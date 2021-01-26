const vscode = acquireVsCodeApi();

window.onload = () => {
  let containSpaceStr = [];
  const elements = [...document.querySelectorAll('[class]')];
  let classNames = elements
    .map((el, i) => {
      const className = el.getAttribute('class');
      if (/\s/.test(className)) {
        containSpaceStr.push({
          'index': i,
          'classes': className.split(/\s/)
        });
      }
      return className;
    })
    .filter(str => !/\s/.test(str));
  if (containSpaceStr.length >= 0) {
    containSpaceStr.forEach(str => {
      str['classes'].forEach((classes, i) => classNames.splice(str.index + i, 0, classes));
    });
  }
  const classArray = classNames.filter((className => className.indexOf('vscode') == -1));
  vscode.postMessage(classArray);
}
