/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';

export class FunctionContentDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-icon': OscdIcon,
      'oscd-icon-button': OscdIconButton,
      'oscd-divider': OscdDivider,
      'oscd-list': OscdList,
      'oscd-list-item': OscdListItem,
    };
  }

  @property({ type: String })
  functionName = '';

  @property({ type: String })
  functionDescription: string | null = null;

  @property({ type: String })
  functionType: string | null = null;

  @property({ type: String })
  selectedElementName = '';

  @property({ type: String })
  selectedElementType = '';

  @query('oscd-dialog')
  dialog!: OscdDialog;

  show() {
    this.dialog.show();
  }

  close() {
    this.dialog.close();
  }

  cancel() {
    this.close();
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  private handleSave() {
    // Dispatch save event with function data
    // In future stories, this will include subfunctions and lnodes
    this.dispatchEvent(
      new CustomEvent('save', {
        detail: {
          name: this.functionName,
          description: this.functionDescription,
          type: this.functionType,
          // subfunctions: [],
          // lnodes: []
        },
      })
    );
    this.close();
  }

  render() {
    return html`
      <oscd-dialog @closed=${this.cancel}>
        <div slot="headline">
          <div class="dialog-title">
            <oscd-icon>function</oscd-icon>
            <span>${this.functionName}</span>
          </div>
        </div>
        <div slot="content" class="content">
          ${this.selectedElementName
            ? html`
                <span class="secondary-text"
                  >${this.selectedElementType} ${this.selectedElementName}</span
                >
                <oscd-divider></oscd-divider>
              `
            : ''}
          ${this.functionDescription || this.functionType
            ? html`
                <div class="info-section">
                  ${this.functionDescription
                    ? html`<div class="info-item">
                        <span class="label">Description:</span>
                        <span class="value">${this.functionDescription}</span>
                      </div>`
                    : nothing}
                  ${this.functionType
                    ? html`<div class="info-item">
                        <span class="label">Type:</span>
                        <span class="value">${this.functionType}</span>
                      </div>`
                    : nothing}
                </div>
                <oscd-divider></oscd-divider>
              `
            : ''}

          <div class="section">
            <div class="section-header">
              <h4>Subfunctions</h4>
              <oscd-icon-button title="Add Subfunction">
                <oscd-icon>add</oscd-icon>
              </oscd-icon-button>
            </div>
            <oscd-list>
              <oscd-list-item type="text">
                <oscd-icon slot="start">info</oscd-icon>
                <span slot="headline"
                  >Click the add button to create a new subfunction</span
                >
              </oscd-list-item>
            </oscd-list>
          </div>

          <oscd-divider></oscd-divider>

          <div class="section">
            <div class="section-header">
              <h4>LNodes</h4>
              <oscd-icon-button title="Add LNode">
                <oscd-icon>add</oscd-icon>
              </oscd-icon-button>
            </div>
            <oscd-list>
              <oscd-list-item type="text">
                <oscd-icon slot="start">info</oscd-icon>
                <span slot="headline"
                  >Click the add button to create a new LNode</span
                >
              </oscd-list-item>
            </oscd-list>
          </div>
        </div>
        <div slot="actions">
          <oscd-filled-button @click=${this.cancel}>Cancel</oscd-filled-button>
          <oscd-filled-button @click=${this.handleSave}
            >Save</oscd-filled-button
          >
        </div>
      </oscd-dialog>
    `;
  }

  static readonly styles = css`
    oscd-dialog {
      --md-dialog-container-min-width: 500px;
      --md-dialog-container-max-height: 80vh;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 300px;
    }

    .secondary-icon {
      font-size: 18px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.7;
    }

    .secondary-text {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.8;
    }

    oscd-divider {
      margin: 0;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item {
      display: flex;
      gap: 8px;
      font-size: 14px;
    }

    .info-item .label {
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .info-item .value {
      color: var(--md-sys-color-on-surface, #1d1b20);
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }

    oscd-list {
      --md-list-container-color: transparent;
    }

    oscd-list-item {
      --md-list-item-label-text-color: var(
        --md-sys-color-on-surface-variant,
        #49454f
      );
    }

    [slot='actions'] {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `;
}
