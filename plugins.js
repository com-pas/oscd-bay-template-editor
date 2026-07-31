import OscdMenuOpen from '@omicronenergy/oscd-menu-open';
import OscdMenuSave from '@omicronenergy/oscd-menu-save';
import OscdBackgroundEditV1 from '@omicronenergy/oscd-background-editv1';
import OscdBackgroundWizardEvents from '@omicronenergy/oscd-background-wizard-events/oscd-background-wizard-events.js';
import OscdEditorSource from '@omicronenergy/oscd-editor-source';
import OscdBayTemplateEditor from './bay-template-editor.js';

customElements.define('oscd-menu-open', OscdMenuOpen);
customElements.define('oscd-menu-save', OscdMenuSave);
customElements.define('oscd-editor-source', OscdEditorSource);
customElements.define('oscd-background-editv1', OscdBackgroundEditV1);
customElements.define(
  'oscd-background-wizard-events',
  OscdBackgroundWizardEvents
);

customElements.define('oscd-bay-template-editor', OscdBayTemplateEditor);

export const plugins = {
  menu: [
    {
      name: 'Open File',
      translation: {
        de: 'Datei öffnen',
      },
      icon: 'folder_open',
      tagName: 'oscd-menu-open',
    },
    {
      name: 'Save project',
      translation: {
        de: 'Projekt speichern',
      },
      icon: 'save',
      requireDoc: true,
      tagName: 'oscd-menu-save',
    },
  ],
  editor: [
    {
      name: 'Bay Template Editor',
      translations: {
        de: 'Bay Template Editor',
      },
      icon: 'edit',
      active: true,
      tagName: 'oscd-bay-template-editor',
    },
    {
      name: 'Source Editor',
      translations: { de: 'Source Editor' },
      icon: 'code',
      requireDoc: true,
      tagName: 'oscd-editor-source',
    },
  ],
  background: [
    {
      name: 'EditV1 Events Listener',
      icon: 'none',
      requireDoc: true,
      tagName: 'oscd-background-editv1',
    },
    {
      name: 'Wizard dialog Events Listener',
      icon: 'none',
      requireDoc: true,
      tagName: 'oscd-background-wizard-events',
    },
  ],
};
