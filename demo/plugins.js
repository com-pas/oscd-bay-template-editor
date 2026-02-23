import '@openenergytools/open-scd-core/open-scd.js';

export const plugins = {
  menu: [
    {
      name: 'Open File',
      translations: { de: 'Datei öffnen' },
      icon: 'folder_open',
      active: true,
      src: 'https://openscd.github.io/oscd-open/oscd-open.js',
    },
    {
      name: 'Save File',
      translations: { de: 'Datei speichern' },
      icon: 'save',
      active: true,
      src: 'https://openscd.github.io/oscd-save/oscd-save.js',
    },
    {
      name: 'Wizarding',
      icon: 'edit',
      active: true,
      src: 'https://openenergytools.github.io/scl-editor/plugins/scl-wizarding/scl-wizarding.js',
    },
  ],
  editor: [
    {
      name: 'Bay Template Editor',
      icon: 'edit',
      active: true,
      src: '../dist/bay-template-editor.js',
    },
    {
      name: 'Source Editor',
      icon: 'code',
      active: true,
      src: 'https://omicronenergyoss.github.io/oscd-editor-source/oscd-editor-source.js',
    },
  ],
};
