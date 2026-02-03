import '@material/mwc-icon';
import '@material/mwc-icon-button';

export const plugins = {
  menu: [
    {
      "name": "Open File",
      "translations": {"de": "Datei öffnen"},
      "icon": "folder_open",
      "active": true,
      "src": "https://openscd.github.io/oscd-open/oscd-open.js"
    },
    {
      "name": "Save File",
      "translations": {"de": "Datei speichern"},
      "icon": "save",
      "active": true,
      "src": "https://openscd.github.io/oscd-save/oscd-save.js"
    }
  ],
  editor: [
    {
      "name": "Bay Template Editor",
      "translations": {"de": "Bay Template Editor"},
      "icon": "add_box",
      "active": true,
      "src": "/dist/bay-template-editor.js"
    }
  ],
};
