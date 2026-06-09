import { LitElement, html, css, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import {
  FormGroup,
  Validators,
  type FormField,
  type Validator,
  type Value,
} from '@compas-oscd/forms';
import { LNodePicker } from '../lnode-picker/lnode-picker.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
import type { LNodeTypeEntry } from '../lnode-picker/lnode-picker.js';
import type { SubfunctionData } from '../../util.js';

export enum CreateSubfunctionDialogStep {
  SubfunctionAttributes = 'subfunction-attributes',
  SubfunctionContent = 'subfunction-content',
}

export class CreateSubfunctionDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-filled-text-field': OscdFilledTextField,
      'oscd-scl-text-field': OscdSclTextField,
      'oscd-icon': OscdIcon,
      'oscd-icon-button': OscdIconButton,
      'oscd-divider': OscdDivider,
      'oscd-list': OscdList,
      'oscd-list-item': OscdListItem,
      'lnode-picker': LNodePicker,
      'confirm-dialog': ConfirmDialog,
    };
  }

  @property({ attribute: false })
  library: Document | Element | null = null;

  @property({ type: Array })
  subfunctions: SubfunctionData[] = [];

  @query('oscd-dialog')
  dialog!: OscdDialog;

  @query('oscd-filled-text-field[name="name"]')
  nameField!: OscdFilledTextField;

  @query('oscd-scl-text-field[name="description"]')
  descriptionField!: OscdSclTextField;

  @query('oscd-scl-text-field[name="type"]')
  typeField!: OscdSclTextField;

  @query('confirm-dialog')
  confirmDialog!: ConfirmDialog;

  @state()
  name = '';

  @state()
  description: string | null = null;

  @state()
  type: string | null = null;

  @state()
  step: CreateSubfunctionDialogStep =
    CreateSubfunctionDialogStep.SubfunctionAttributes;

  @state()
  confirmAction: 'cancel' | null = null;

  @state()
  private confirmHeadline = 'Confirmation';

  @state()
  private confirmDescription = '';

  @state()
  private confirmIcon = 'help';

  @state()
  private confirmVariant: 'danger' | 'warning' | 'primary' = 'primary';

  @state()
  private confirmConfirmLabel = 'Confirm';

  @state()
  private confirmCancelLabel = 'Cancel';
  lnodes: LNodeTypeEntry[] = [];

  @state()
  selectedLNode: string | null = null;

  @state()
  pickerOpen = false;

  private formGroup: FormGroup | null = null;

  private readonly boundHandleDocumentKeydown =
    this.handleDocumentKeydown.bind(this);

  show() {
    document.addEventListener('keydown', this.boundHandleDocumentKeydown, true);
    this.step = CreateSubfunctionDialogStep.SubfunctionAttributes;
    this.formGroup = new FormGroup({
      name: {
        formField: this.nameField,
        validators: [
          Validators.required('Name is required'),
          this.nameNotTakenValidator,
        ],
      },
      description: {
        formField: this.descriptionField as FormField,
        validators: [],
      },
      type: {
        formField: this.typeField as FormField,
        validators: [],
      },
    });
    this.dialog.show();
  }

  close() {
    this.confirmAction = 'cancel';
    this.confirmHeadline = 'Cancel without saving?';
    this.confirmDescription =
      'Are you sure you want to cancel? All changes will be lost.';
    this.confirmIcon = 'warning';
    this.confirmVariant = 'danger';
    this.confirmConfirmLabel = 'Yes, cancel';
    this.confirmCancelLabel = 'No, go back';
    this.confirmDialog.show();
  }

  private closeWithoutConfirm() {
    document.removeEventListener(
      'keydown',
      this.boundHandleDocumentKeydown,
      true
    );
    this.dialog.close();
  }

  reset() {
    this.step = CreateSubfunctionDialogStep.SubfunctionAttributes;
    this.name = '';
    this.description = null;
    this.type = null;
    this.lnodes = [];
    this.selectedLNode = null;
    this.pickerOpen = false;
    if (this.nameField) {
      this.nameField.errorText = '';
      this.nameField.error = false;
      this.nameField.value = '';
    }
    if (this.descriptionField) {
      this.descriptionField.value = null;
    }
    if (this.typeField) {
      this.typeField.value = null;
    }
    this.formGroup = null;
  }

  private handleClosed() {
    document.removeEventListener(
      'keydown',
      this.boundHandleDocumentKeydown,
      true
    );
    this.reset();
  }

  // eslint-disable-next-line class-methods-use-this
  private handleCancel(e: Event) {
    e.preventDefault();
  }

  private handleDocumentKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.dialog?.open) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private readonly nameNotTakenValidator: Validator = (value: Value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();

    const existing = this.subfunctions.find(sf => sf.name.trim() === trimmed);
    return existing
      ? `A SubFunction with the name "${trimmed}" already exists`
      : null;
  };

  private handleNext(e: Event) {
    e.preventDefault();
    if (!this.formGroup?.validate()) {
      return;
    }

    this.step = CreateSubfunctionDialogStep.SubfunctionContent;
  }

  private handleBack() {
    this.step = CreateSubfunctionDialogStep.SubfunctionAttributes;
  }

  private handleSave() {
    this.dispatchEvent(
      new CustomEvent('save-subfunction', {
        bubbles: true,
        composed: true,
        detail: {
          name: this.name,
          description: this.description,
          type: this.type,
          lnodes: this.lnodes,
        },
      })
    );

    this.dialog.close();
  }

  private handleConfirm() {
    if (this.confirmAction === 'cancel') {
      this.closeWithoutConfirm();
    }
    this.confirmAction = null;
  }

  private handleSelectLNode(id: string) {
    this.selectedLNode = this.selectedLNode === id ? null : id;
  }

  private handleRemoveLNode() {
    if (this.selectedLNode === null) return;
    this.lnodes = this.lnodes.filter(l => l.id !== this.selectedLNode);
    this.selectedLNode = null;
  }

  private handleAddLNode() {
    this.pickerOpen = true;
  }

  private handlePickerConfirm(e: CustomEvent<{ selected: LNodeTypeEntry[] }>) {
    const incoming = e.detail.selected.filter(
      entry => !this.lnodes.some(l => l.id === entry.id)
    );
    this.lnodes = [...this.lnodes, ...incoming];
    this.pickerOpen = false;
  }

  private handlePickerCancel() {
    this.pickerOpen = false;
  }

  renderSubfunctionAttrs() {
    return html`
      <div slot="headline">Add SubFunction</div>
      <form
        slot="content"
        novalidate
        @submit=${this.handleNext}
        autocomplete="off"
      >
        <oscd-filled-text-field
          label="Name"
          required
          name="name"
          .value=${this.name}
          @input=${(e: InputEvent) => {
            this.name = (e.target as OscdFilledTextField).value;
          }}
        ></oscd-filled-text-field>
        <oscd-scl-text-field
          nullable
          label="Description"
          name="description"
          .value=${this.description}
          @input=${(e: InputEvent) => {
            this.description = (e.target as OscdSclTextField).value;
          }}
        ></oscd-scl-text-field>
        <oscd-scl-text-field
          nullable
          label="Type"
          name="type"
          .value=${this.type}
          @input=${(e: InputEvent) => {
            this.type = (e.target as OscdSclTextField).value;
          }}
        ></oscd-scl-text-field>
      </form>

      <div slot="actions">
        <oscd-filled-button
          data-testid="cancel-button"
          type="button"
          @click=${this.close}
          >Cancel</oscd-filled-button
        >
        <oscd-filled-button
          data-testid="next-button"
          type="button"
          @click=${this.handleNext}
          >Next</oscd-filled-button
        >
      </div>
    `;
  }

  renderSubfunctionContent() {
    return html`
      <div slot="headline">
        <div class="dialog-title">
          <oscd-icon>account_tree</oscd-icon>
          <span>${this.name}</span>
        </div>
      </div>

      <div slot="content">
        <div class="section">
          <div class="section-header">
            <h4>LNodes</h4>
            <div class="section-actions">
              <oscd-icon-button
                title="Remove LNode"
                ?disabled=${this.selectedLNode === null}
                @click=${this.handleRemoveLNode}
              >
                <oscd-icon>remove</oscd-icon>
              </oscd-icon-button>
              <oscd-icon-button
                title="Add LNode"
                ?disabled=${this.pickerOpen}
                @click=${this.handleAddLNode}
              >
                <oscd-icon>add</oscd-icon>
              </oscd-icon-button>
            </div>
          </div>

          ${this.pickerOpen
            ? html`
                <lnode-picker
                  .library=${this.library}
                  .existingIds=${this.lnodes.map(l => l.id)}
                  @lnode-picker-confirm=${this.handlePickerConfirm}
                  @lnode-picker-cancel=${this.handlePickerCancel}
                ></lnode-picker>
              `
            : html`
                <oscd-list>
                  ${this.lnodes.length === 0
                    ? html`
                        <oscd-list-item type="text" noninteractive>
                          <oscd-icon slot="start">info</oscd-icon>
                          <span slot="headline">Click + to add an LNode</span>
                        </oscd-list-item>
                      `
                    : this.lnodes.map(
                        lnode => html`
                          <oscd-list-item
                            type="button"
                            ?selected=${this.selectedLNode === lnode.id}
                            @click=${() => this.handleSelectLNode(lnode.id)}
                          >
                            <span slot="headline">${lnode.lnClass}</span>
                            <span slot="supporting-text"
                              >${lnode.desc ?? lnode.id}</span
                            >
                            ${this.selectedLNode === lnode.id
                              ? html`<oscd-icon slot="end">check</oscd-icon>`
                              : nothing}
                          </oscd-list-item>
                        `
                      )}
                </oscd-list>
              `}
        </div>
      </div>

      <div slot="actions">
        <oscd-filled-button
          type="button"
          data-testid="back-button"
          @click=${this.handleBack}
          >Back</oscd-filled-button
        >
        <oscd-filled-button
          type="button"
          data-testid="save-button"
          .disabled=${this.pickerOpen}
          @click=${this.handleSave}
          >Save</oscd-filled-button
        >
      </div>
    `;
  }

  render() {
    return html`
      <oscd-dialog
        id="create-subfunction-dialog"
        @cancel=${this.handleCancel}
        @closed=${this.handleClosed}
      >
        ${this.step === CreateSubfunctionDialogStep.SubfunctionAttributes
          ? this.renderSubfunctionAttrs()
          : this.renderSubfunctionContent()}
      </oscd-dialog>

      <confirm-dialog
        .headline=${this.confirmHeadline}
        .description=${this.confirmDescription}
        .confirmLabel=${this.confirmConfirmLabel}
        .cancelLabel=${this.confirmCancelLabel}
        .icon=${this.confirmIcon}
        .variant=${this.confirmVariant}
        @confirm-dialog-confirm=${this.handleConfirm}
      ></confirm-dialog>
    `;
  }

  static readonly styles = css`
    oscd-dialog {
      height: 80vh;
      width: 500px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    oscd-filled-text-field,
    oscd-scl-text-field {
      display: block;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
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
      max-height: 385px;
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

    .section-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    oscd-list {
      --md-list-container-color: transparent;
    }

    oscd-list-item {
      --md-list-item-one-line-container-height: 40px;
      --md-list-item-two-line-container-height: 52px;
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
