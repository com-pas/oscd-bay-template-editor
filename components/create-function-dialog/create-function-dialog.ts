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
import { getFunctions, type SubfunctionData } from '../../util.js';
import { CreateSubfunctionDialog } from '../create-subfunction-dialog/create-subfunction-dialog.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
import { LNodePicker } from '../lnode-picker/lnode-picker.js';
import type { LNodeTypeEntry } from '../lnode-picker/lnode-picker.js';

export enum CreateFunctionDialogStep {
  FunctionAttributes = 'function-attributes',
  FunctionContent = 'function-content',
}

export class CreateFunctionDialog extends ScopedElementsMixin(LitElement) {
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
      'create-subfunction-dialog': CreateSubfunctionDialog,
      'confirm-dialog': ConfirmDialog,
      'lnode-picker': LNodePicker,
    };
  }

  @property({ type: Object })
  parent: Element | null = null;

  @property({ type: String })
  selectedElementName = '';

  @property({ type: String })
  selectedElementType = '';

  @property({ attribute: false })
  lnodeLibrary: Document | Element | null = null;

  @query('oscd-dialog')
  dialog!: OscdDialog;

  @query('oscd-filled-text-field[name="name"]')
  nameField!: OscdFilledTextField;

  @query('oscd-scl-text-field[name="description"]')
  descriptionField!: OscdSclTextField;

  @query('oscd-scl-text-field[name="type"]')
  typeField!: OscdSclTextField;

  @query('create-subfunction-dialog')
  createSubfunctionDialog!: CreateSubfunctionDialog;

  @query('confirm-dialog')
  confirmDialog!: ConfirmDialog;

  @query('lnode-picker')
  lnodePicker!: LNodePicker;

  @state()
  name = '';

  @state()
  description: string | null = null;

  @state()
  type: string | null = null;

  @state()
  step: CreateFunctionDialogStep = CreateFunctionDialogStep.FunctionAttributes;

  @state()
  tempSubfunctions: SubfunctionData[] = [];

  @state()
  selectedSubfunction: number | null = null;

  @state()
  confirmAction: 'cancel' | 'delete-subfunction' | null = null;

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

  @state()
  lnPickerOpen = false;

  @state()
  lnodes: LNodeTypeEntry[] = [];

  @state()
  selectedLNode: string | null = null;

  @state()
  subfunctionsCollapsed = false;

  @state()
  lnodesCollapsed = false;

  private formGroup: FormGroup | null = null;

  private shouldEmitCancel = true;

  private readonly boundHandleDocumentKeydown =
    this.handleDocumentKeydown.bind(this);

  show() {
    document.addEventListener('keydown', this.boundHandleDocumentKeydown, true);
    this.step = CreateFunctionDialogStep.FunctionAttributes;
    this.tempSubfunctions = [];
    this.selectedSubfunction = null;
    this.formGroup = new FormGroup({
      name: {
        formField: this.nameField,
        validators: [
          Validators.required('Name is required'),
          this.nameTakenValidator,
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
    this.step = CreateFunctionDialogStep.FunctionAttributes;
    this.name = '';
    this.description = null;
    this.type = null;
    this.lnPickerOpen = false;
    this.lnodes = [];
    this.selectedLNode = null;
    this.subfunctionsCollapsed = false;
    this.lnodesCollapsed = false;
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
    const emitCancel = this.shouldEmitCancel;
    this.shouldEmitCancel = true;
    this.reset();
    if (emitCancel) {
      this.dispatchEvent(
        new CustomEvent('cancel', { bubbles: true, composed: true })
      );
    }
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

  private readonly nameTakenValidator: Validator = (value: Value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!this.parent) return null;
    const functions = getFunctions(this.parent);
    const existing = functions.find(
      fn => fn.getAttribute('name')?.trim() === trimmed
    );
    return existing
      ? `A Function with the name "${trimmed}" already exists`
      : null;
  };

  private handleNext(e: Event) {
    e.preventDefault();
    if (!this.formGroup?.validate()) {
      return;
    }

    this.step = CreateFunctionDialogStep.FunctionContent;
  }

  private handleSave() {
    this.dispatchEvent(
      new CustomEvent('save', {
        detail: {
          name: this.name,
          description: this.description,
          type: this.type,
          subfunctions: this.tempSubfunctions,
          lnodes: this.lnodes,
        },
      })
    );

    this.shouldEmitCancel = false;
    this.dialog.close();
  }

  private handleAddSubfunction() {
    this.createSubfunctionDialog.subfunctions = this.tempSubfunctions;
    this.createSubfunctionDialog.show();
  }

  private handleSaveSubfunction(e: CustomEvent<SubfunctionData>) {
    this.tempSubfunctions = [...this.tempSubfunctions, e.detail];
    this.selectedSubfunction = null;
    this.subfunctionsCollapsed = false;
  }

  private handleDeleteSubfunction() {
    if (this.selectedSubfunction === null) return;

    const subfunctionName =
      this.tempSubfunctions[this.selectedSubfunction].name;

    this.confirmAction = 'delete-subfunction';
    this.confirmHeadline = 'Delete SubFunction?';
    this.confirmDescription = `Are you sure you want to delete "${subfunctionName}"? This action cannot be undone.`;
    this.confirmIcon = 'delete';
    this.confirmVariant = 'danger';
    this.confirmConfirmLabel = 'Delete';
    this.confirmCancelLabel = 'Cancel';
    this.confirmDialog.show();
  }

  private handleSubfunctionClick(index: number) {
    this.selectedSubfunction =
      this.selectedSubfunction === index ? null : index;
  }

  private handleConfirm() {
    if (this.confirmAction === 'cancel') {
      this.closeWithoutConfirm();
    } else if (this.confirmAction === 'delete-subfunction') {
      if (this.selectedSubfunction === null) return;
      this.tempSubfunctions.splice(this.selectedSubfunction, 1);
      this.selectedSubfunction = null;
    }
    this.confirmAction = null;
  }

  private handleToggleSubfunctions() {
    this.subfunctionsCollapsed = !this.subfunctionsCollapsed;
  }

  private handleToggleLNodes() {
    this.lnodesCollapsed = !this.lnodesCollapsed;
  }

  private handleAddLNode() {
    this.lnPickerOpen = true;
  }

  private handleRemoveLNode() {
    if (this.selectedLNode === null) return;
    this.lnodes = this.lnodes.filter(l => l.id !== this.selectedLNode);
    this.selectedLNode = null;
  }

  private handleSelectLNode(id: string) {
    this.selectedLNode = this.selectedLNode === id ? null : id;
  }

  private handleLNodePickerCancel() {
    this.lnPickerOpen = false;
  }

  private handleLNodePickerConfirm(
    e: CustomEvent<{ selected: LNodeTypeEntry[] }>
  ) {
    const incoming = e.detail.selected.filter(
      entry => !this.lnodes.some(l => l.id === entry.id)
    );
    this.lnodes = [...this.lnodes, ...incoming];
    this.lnPickerOpen = false;
    this.lnodesCollapsed = false;
  }

  renderFunctionAttrs() {
    return html`
      <div slot="headline">Add Function</div>
      <form slot="content" novalidate autocomplete="off">
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
          type="button"
          data-testid="cancel-button-step1"
          @click=${this.close}
          >Cancel</oscd-filled-button
        >
        <oscd-filled-button data-testid="next-button" @click=${this.handleNext}
          >Next</oscd-filled-button
        >
      </div>
    `;
  }

  renderLNodePicker() {
    return html`
      <div slot="headline">
        <div class="dialog-title">
          <oscd-icon>function</oscd-icon>
          <span>${this.name}</span>
        </div>
      </div>

      <div slot="content" class="content">
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
            <oscd-icon-button title="Add LNode" disabled>
              <oscd-icon>add</oscd-icon>
            </oscd-icon-button>
          </div>
        </div>
        <lnode-picker
          .library=${this.lnodeLibrary}
          .existingIds=${this.lnodes.map(l => l.id)}
          @lnode-picker-confirm=${this.handleLNodePickerConfirm}
          @lnode-picker-cancel=${this.handleLNodePickerCancel}
        ></lnode-picker>
      </div>

      <div slot="actions">
        <oscd-filled-button
          type="button"
          data-testid="cancel-button-step2"
          @click=${this.close}
          >Cancel</oscd-filled-button
        >
        <oscd-filled-button
          type="button"
          data-testid="save-button"
          @click=${this.handleSave}
          .disabled=${this.lnPickerOpen}
          >Save</oscd-filled-button
        >
      </div>
    `;
  }

  renderFunctionContent() {
    return html`
      <div slot="headline">
        <div>
          <div class="dialog-title">
            <oscd-icon>function</oscd-icon>
            <span>${this.name}</span>
          </div>
          ${this.selectedElementName
            ? html`
                <span class="secondary-text"
                  >${this.selectedElementType} ${this.selectedElementName}</span
                >
              `
            : nothing}
        </div>
      </div>

      <div slot="content" class="content">
        <div class="section">
          <div class="section-header">
            <h4 class="section-title">
              <oscd-icon-button
                class="collapse-btn"
                title=${this.subfunctionsCollapsed
                  ? 'Expand SubFunctions'
                  : 'Collapse SubFunctions'}
                @click=${this.handleToggleSubfunctions}
              >
                <oscd-icon
                  >${this.subfunctionsCollapsed
                    ? 'chevron_right'
                    : 'expand_more'}</oscd-icon
                >
              </oscd-icon-button>
              SubFunctions
              ${this.tempSubfunctions.length > 0
                ? html`<span class="count-badge"
                    >${this.tempSubfunctions.length}</span
                  >`
                : nothing}
            </h4>
            <div class="button-group">
              <oscd-icon-button
                title="Delete SubFunction"
                ?disabled=${this.selectedSubfunction === null}
                data-testid="delete-subfunction-button"
                @click=${this.handleDeleteSubfunction}
              >
                <oscd-icon>remove</oscd-icon>
              </oscd-icon-button>
              <oscd-icon-button
                title="Add SubFunction"
                @click=${this.handleAddSubfunction}
              >
                <oscd-icon>add</oscd-icon>
              </oscd-icon-button>
            </div>
          </div>
          ${this.subfunctionsCollapsed
            ? nothing
            : html`
                <oscd-list>
                  ${this.tempSubfunctions.length === 0
                    ? html`<oscd-list-item type="text">
                        <oscd-icon slot="start">info</oscd-icon>
                        <span slot="headline"
                          >Click + to add a SubFunction</span
                        >
                      </oscd-list-item>`
                    : this.tempSubfunctions.map(
                        (sf, index) => html`
                          <oscd-list-item
                            type="button"
                            class="${this.selectedSubfunction === index
                              ? 'selected'
                              : ''}"
                            @click=${() => this.handleSubfunctionClick(index)}
                          >
                            ${sf.name}
                            ${this.selectedSubfunction === index
                              ? html`<oscd-icon slot="end">check</oscd-icon>`
                              : nothing}
                          </oscd-list-item>
                        `
                      )}
                </oscd-list>
              `}
        </div>

        <oscd-divider></oscd-divider>

        <div class="section">
          <div class="section-header">
            <h4 class="section-title">
              <oscd-icon-button
                class="collapse-btn"
                title=${this.lnodesCollapsed
                  ? 'Expand LNodes'
                  : 'Collapse LNodes'}
                @click=${this.handleToggleLNodes}
              >
                <oscd-icon
                  >${this.lnodesCollapsed
                    ? 'chevron_right'
                    : 'expand_more'}</oscd-icon
                >
              </oscd-icon-button>
              LNodes
              ${this.lnodes.length > 0
                ? html`<span class="count-badge">${this.lnodes.length}</span>`
                : nothing}
            </h4>
            <div class="section-actions">
              <oscd-icon-button
                title="Remove LNode"
                ?disabled=${this.selectedLNode === null}
                @click=${this.handleRemoveLNode}
              >
                <oscd-icon>remove</oscd-icon>
              </oscd-icon-button>
              <oscd-icon-button title="Add LNode" @click=${this.handleAddLNode}>
                <oscd-icon>add</oscd-icon>
              </oscd-icon-button>
            </div>
          </div>
          ${this.lnodesCollapsed
            ? nothing
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
          data-testid="cancel-button-step2"
          @click=${this.close}
          >Cancel</oscd-filled-button
        >
        <oscd-filled-button
          type="button"
          data-testid="save-button"
          @click=${this.handleSave}
          >Save</oscd-filled-button
        >
      </div>
    `;
  }

  private renderDialogContent() {
    if (this.step === CreateFunctionDialogStep.FunctionAttributes) {
      return this.renderFunctionAttrs();
    }
    if (this.lnPickerOpen) {
      return this.renderLNodePicker();
    }
    return this.renderFunctionContent();
  }

  render() {
    return html`
      <oscd-dialog
        id="create-function-dialog"
        @cancel=${this.handleCancel}
        @closed=${this.handleClosed}
      >
        ${this.renderDialogContent()}
      </oscd-dialog>

      <create-subfunction-dialog
        .library=${this.lnodeLibrary}
        @save-subfunction=${this.handleSaveSubfunction}
      ></create-subfunction-dialog>

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

    [slot='content'] {
      padding-top: 12px;
    }

    [slot='headline'] {
      padding-bottom: 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 300px;
    }

    .secondary-text {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.8;
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

    .section-title {
      display: flex;
      align-items: center;
      gap: 2px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }

    .collapse-btn {
      margin-left: -8px;
    }

    .count-badge {
      font-size: 13px;
      font-weight: 400;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-left: 4px;
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .button-group {
      display: flex;
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
      cursor: pointer;
    }

    oscd-list-item.selected {
      background-color: var(
        --md-sys-color-secondary-container,
        rgba(103, 80, 164, 0.12)
      );
    }

    oscd-outlined-text-field,
    oscd-scl-text-field {
      display: block;
      margin-bottom: 12px;
    }

    [slot='actions'] {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `;
}
