import { LitElement, html, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';

export interface ConfirmDialogOptions {
  headline?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

/**
 * A reusable confirmation dialog component.
 */
export class ConfirmDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-icon': OscdIcon,
    };
  }

  @property({ type: String })
  headline = 'Are you sure?';

  @property({ type: String })
  description = '';

  @property({ type: String, attribute: 'confirm-label' })
  confirmLabel = 'Confirm';

  @property({ type: String, attribute: 'cancel-label' })
  cancelLabel = 'Cancel';

  @property({ type: String })
  icon = '';

  @property({ type: String })
  variant: 'danger' | 'warning' | 'primary' = 'danger';

  @query('oscd-dialog')
  private readonly dialog!: OscdDialog;

  private resolveShow: ((confirmed: boolean) => void) | null = null;

  show(options: ConfirmDialogOptions = {}): Promise<boolean> {
    this.headline = options.headline ?? 'Cancel without saving?';
    this.description = options.description ?? '';
    this.confirmLabel = options.confirmLabel ?? 'Confirm';
    this.cancelLabel = options.cancelLabel ?? 'Cancel';
    this.icon = options.icon ?? '';
    this.variant = options.variant ?? 'danger';
    this.dialog.show();
    return new Promise<boolean>(resolve => {
      this.resolveShow = resolve;
    });
  }

  close() {
    this.dialog.close();
  }

  private resolveAndClose(confirmed: boolean) {
    this.resolveShow?.(confirmed);
    this.resolveShow = null;
    this.close();
  }

  private handleConfirm() {
    this.resolveAndClose(true);
  }

  private handleCancel(e: Event) {
    e.preventDefault();
    this.resolveAndClose(false);
  }

  private handleCancelClick() {
    this.resolveAndClose(false);
  }

  render() {
    return html`
      <oscd-dialog
        @cancel=${this.handleCancel}
        id=${`confirm-dialog-${this.variant}`}
      >
        <div slot="headline" class="headline">
          ${this.icon
            ? html`<oscd-icon class="headline-icon variant-${this.variant}"
                >${this.icon}</oscd-icon
              >`
            : null}
          <span>${this.headline}</span>
        </div>

        <div slot="content">
          ${this.description}
          <slot></slot>
        </div>

        <div slot="actions">
          <oscd-filled-button
            type="button"
            data-testid="cancel-button"
            @click=${this.handleCancelClick}
          >
            ${this.cancelLabel}
          </oscd-filled-button>
          <oscd-filled-button
            type="button"
            class="confirm-button variant-${this.variant}"
            data-testid="confirm-button"
            @click=${this.handleConfirm}
          >
            ${this.confirmLabel}
          </oscd-filled-button>
        </div>
      </oscd-dialog>
    `;
  }

  static readonly styles = css`
    oscd-dialog {
      width: 360px;
    }

    .headline {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Icon colour variants */
    .headline-icon.variant-danger {
      color: var(--md-sys-color-error, #b3261e);
    }

    .headline-icon.variant-warning {
      color: var(--md-sys-color-tertiary, #7d5260);
    }

    .headline-icon.variant-primary {
      color: var(--md-sys-color-primary, #6750a4);
    }

    /* Confirm button colour variants */
    .confirm-button.variant-danger {
      --md-filled-button-container-color: var(--md-sys-color-error, #b3261e);
      --md-filled-button-label-text-color: var(
        --md-sys-color-on-error,
        #ffffff
      );
      --md-filled-button-hover-container-color: var(
        --md-sys-color-error,
        #b3261e
      );
    }

    .confirm-button.variant-warning {
      --md-filled-button-container-color: var(--md-sys-color-tertiary, #7d5260);
      --md-filled-button-label-text-color: var(
        --md-sys-color-on-tertiary,
        #ffffff
      );
    }

    .confirm-button.variant-primary {
      --md-filled-button-container-color: var(--md-sys-color-primary, #6750a4);
      --md-filled-button-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
    }

    [slot='actions'] {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `;
}
