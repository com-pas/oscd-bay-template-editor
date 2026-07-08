import { LitElement, html, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';

export class FunctionLinkDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-filled-text-field': OscdFilledTextField,
    };
  }

  @query('oscd-dialog')
  private readonly dialog!: OscdDialog;

  @property({ type: String })
  sourceFunctionName = '';

  @property({ type: String })
  sourceFunctionPath = '';

  @property({ type: String })
  sinkFunctionName = '';

  private closeDispatched = false;

  show() {
    this.dialog.show();
  }

  close() {
    this.dialog.close();
  }

  private dispatchCloseEvent() {
    if (this.closeDispatched) return;
    this.closeDispatched = true;

    this.dispatchEvent(
      new CustomEvent('close', { bubbles: true, composed: true })
    );

    requestAnimationFrame(() => {
      this.closeDispatched = false;
    });
  }

  private handleClose = () => {
    this.dispatchCloseEvent();
    this.close();
  };

  private handleDialogClosed = () => {
    this.dispatchCloseEvent();
  };

  private handleConnect = () => {
    this.dispatchEvent(
      new CustomEvent('connect', {
        detail: {
          sourceFunctionName: this.sourceFunctionName,
          sourceFunctionPath: this.sourceFunctionPath,
          sinkFunctionName: this.sinkFunctionName,
        },
        bubbles: true,
        composed: true,
      })
    );
    this.dispatchCloseEvent();
    this.close();
  };

  render() {
    return html`
      <oscd-dialog id="function-link-dialog" @closed=${this.handleDialogClosed}>
        <div slot="headline">Create Function Link</div>

        <div slot="content" class="content">
          <oscd-filled-text-field
            label="Source function"
            readonly
            .value=${this.sourceFunctionName}
            disabled
          ></oscd-filled-text-field>
          <oscd-filled-text-field
            label="Source function path"
            readonly
            .value=${this.sourceFunctionPath}
            disabled
          ></oscd-filled-text-field>
        <div slot="actions">
          <oscd-filled-button @click=${this.handleClose}
            >Close</oscd-filled-button
          >
          <oscd-filled-button disabled data-testid="connect-button" @click=${this.handleConnect}
            >Connect</oscd-filled-button
          >
        </div>
      </oscd-dialog>
    `;
  }

  static styles = css`
    .content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 480px;
    }

    .readonly-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      border: 1px solid var(--md-sys-color-outline-variant, #cad4d9);
      border-radius: 8px;
      background: var(--md-sys-color-surface-container-low, #f8f6fa);
    }

    .label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .value {
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .value.path {
      word-break: break-all;
      font-family: 'Roboto Mono', 'Consolas', monospace;
      font-size: 0.8rem;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    input,
    select {
      width: 100%;
      box-sizing: border-box;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline-variant, #cad4d9);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .placeholder-list {
      border: 1px dashed var(--md-sys-color-outline-variant, #cad4d9);
      border-radius: 8px;
      padding: 10px;
    }

    .placeholder-list ul {
      margin: 8px 0 0;
      padding: 0 0 0 4px;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .placeholder-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
    }
  `;
}
