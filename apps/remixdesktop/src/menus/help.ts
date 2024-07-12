import {BrowserWindow, MenuItemConstructorOptions, app} from 'electron';
const { dialog } = require('electron')
export default (
  commandKeys: Record<string, string>,
  execCommand: (command: string, focusedWindow?: BrowserWindow) => void
): MenuItemConstructorOptions => {
  const isMac = process.platform === 'darwin';

  return {
    label:  'Help',
    submenu: [
      {
        label: `About CodeBox Desktop version ${app.getVersion()}`,
        click(item, focusedWindow) {
          dialog.showMessageBox({
            title: `About CodeBox`,
            message: `Version info`,
            detail: `CodeBox Desktop version ${app.getVersion()}`,
            buttons: [],
          });
        }
      }
    ]
  };
};
