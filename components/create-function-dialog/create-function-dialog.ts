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
import {
  FormGroup,
  Validators,
  type FormField,
  type Validator,
  type Value,
} from '@compas-oscd/forms';
import {
  getFunctions,
  lNodeTypeClass,
  lNodeTypeDesc,
  lNodeTypeId,
  type SubfunctionData,
} from '../../util.js';
import { CreateSubfunctionDialog } from '../create-subfunction-dialog/create-subfunction-dialog.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
import { LNodePicker } from '../lnode-picker/lnode-picker.js';
import { EditList, DeleteEventDetail } from '../edit-list/edit-list.js';

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
      'create-subfunction-dialog': CreateSubfunctionDialog,
      'confirm-dialog': ConfirmDialog,
      'lnode-picker': LNodePicker,
      'edit-list': EditList,
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
  lnPickerOpen = false;

  @state()
  lnodes: Element[] = [];

  private get selectedLNodeTypeIds(): string[] {
    return this.lnodes.map(lNodeType => lNodeTypeId(lNodeType));
  }

  private get isEqFunction() {
    return (
      this.parent?.tagName === 'ConductingEquipment' ||
      this.parent?.tagName === 'PowerTransformer' ||
      this.parent?.tagName === 'TransformerWinding'
    );
  }

  private get elementName(): string {
    return this.isEqFunction ? 'EqFunction' : 'Function';
  }

  private get subFunctionName(): string {
    return this.isEqFunction ? 'EqSubFunction' : 'SubFunction';
  }

  private formGroup: FormGroup | null = null;

  private shouldEmitCancel = true;

  private readonly boundHandleDocumentKeydown =
    this.handleDocumentKeydown.bind(this);

  show() {
    document.addEventListener('keydown', this.boundHandleDocumentKeydown, true);
    this.step = CreateFunctionDialogStep.FunctionAttributes;
    this.tempSubfunctions = [];
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
    this.confirmDialog
      .show({
        headline: 'Cancel without saving?',
        description:
          'Are you sure you want to cancel? All changes will be lost.',
        icon: 'warning',
        variant: 'danger',
        confirmLabel: 'Yes, cancel',
        cancelLabel: 'No, go back',
      })
      .then(confirmed => {
        if (confirmed) {
          this.handleCloseConfirmed();
        }
      });
  }

  private handleCloseConfirmed() {
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
  }

  private handleDeleteSubfunction(subfunctionToDelete: SubfunctionData) {
    this.confirmDialog
      .show({
        headline: 'Delete SubFunction?',
        description: `Are you sure you want to delete "${subfunctionToDelete.name}"? This action cannot be undone.`,
        icon: 'delete',
        variant: 'danger',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      })
      .then(confirmed => {
        if (!confirmed) return;
        const index = this.tempSubfunctions.findIndex(
          sf => sf === subfunctionToDelete
        );
        this.tempSubfunctions.splice(index, 1);
      });
  }

  private handleAddLNode() {
    this.lnPickerOpen = true;
  }

  private handleRemoveLNode(lnodeToRemove: Element) {
    this.lnodes = this.lnodes.filter(l => l !== lnodeToRemove);
  }

  private handleLNodePickerCancel() {
    this.lnPickerOpen = false;
  }

  private handleLNodePickerConfirm(e: CustomEvent<{ lNodes: Element[] }>) {
    const existingIds = new Set(this.selectedLNodeTypeIds);
    const incoming = e.detail.lNodes.filter(
      lNodeType => !existingIds.has(lNodeTypeId(lNodeType))
    );
    this.lnodes = [...this.lnodes, ...incoming];
    this.lnPickerOpen = false;
  }

  renderFunctionAttrs() {
    return html`
      <div slot="headline">Add ${this.elementName}</div>
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
        </div>
        <lnode-picker
          .library=${this.lnodeLibrary}
          .existingIds=${this.selectedLNodeTypeIds}
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
          <edit-list
            title=${`${this.subFunctionName}s`}
            itemName=${this.subFunctionName}
            .items=${this.tempSubfunctions}
            .itemHeadline=${(func: SubfunctionData) => func.name}
            @add-item=${this.handleAddSubfunction}
            @delete-item=${(
              e: CustomEvent<DeleteEventDetail<SubfunctionData>>
            ) => this.handleDeleteSubfunction(e.detail.item)}
          >
          </edit-list>
        </div>

        <oscd-divider></oscd-divider>

        <div class="section">
          <edit-list
            title="LNodes"
            itemName="LNode"
            .items=${this.lnodes}
            .itemHeadline=${(ln: Element) => lNodeTypeClass(ln)}
            .itemSupportingText=${(ln: Element) =>
              lNodeTypeDesc(ln) ?? lNodeTypeId(ln)}
            @add-item=${this.handleAddLNode}
            @delete-item=${(e: CustomEvent<DeleteEventDetail<Element>>) =>
              this.handleRemoveLNode(e.detail.item)}
          >
          </edit-list>
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
        .isEqFunction=${this.isEqFunction}
        @save-subfunction=${this.handleSaveSubfunction}
      ></create-subfunction-dialog>

      <confirm-dialog></confirm-dialog>
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
