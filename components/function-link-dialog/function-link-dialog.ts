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

  get open() {
    return this.dialog.open;
  }

  show() {
    this.dialog.show();
  }

  showForSourceFunction(
    sourceFunctionName: string,
    sourceFunctionPath: string
  ) {
    this.sourceFunctionName = sourceFunctionName;
    this.sourceFunctionPath = sourceFunctionPath;
    this.show();
  }

  close() {
    this.dialog.close();
  }

  private dispatchCloseEvent() {
    this.dispatchEvent(
      new CustomEvent('close-function-link-dialog', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleDialogClosed = () => {
    this.dispatchCloseEvent();
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
        </div>
        <div slot="actions">
          <oscd-filled-button data-testid="close-button" @click=${this.close}>
            Close</oscd-filled-button
          >
          <oscd-filled-button disabled data-testid="connect-button"
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
  `;
}
