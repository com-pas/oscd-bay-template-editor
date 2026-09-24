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
  getChildrenByTagName,
  getFunctions,
  subFunctionDataFromElement,
  lNodeTypeClass,
  lNodeTypeDesc,
  lNodeTypeId,
  type FunctionData,
  type SubFunctionData,
} from '../../util.js';
import { CreateSubfunctionDialog } from '../create-subfunction-dialog/create-subfunction-dialog.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
import { REMOVE_LINKED_LNODE_CONFIRMATION } from '../../const.js';
import { LNodePicker } from '../lnode-picker/lnode-picker.js';
import { lNodeHasLinks } from '../functions-layer/function-links.js';
import { EditList, ItemEventDetail } from '../edit-list/edit-list.js';

export type SaveFunctionDetail = FunctionData & {
  functionElement: Element | null;
};

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

  @property({ attribute: false })
  functionElement: Element | null = null;

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
  subFunctions: SubFunctionData[] = [];

  @state()
  lnPickerOpen = false;

  @state()
  lnodes: Element[] = [];

  private get isEdit() {
    return !!this.functionElement;
  }

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
    if (this.functionElement) {
      this.loadFunctionElement(this.functionElement);
    }
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

  /** Fills the form with the current state of the Function being edited. */
  private loadFunctionElement(functionElement: Element) {
    this.name = functionElement.getAttribute('name') ?? '';
    this.description = functionElement.getAttribute('desc');
    this.type = functionElement.getAttribute('type');
    this.lnodes = getChildrenByTagName(functionElement, 'LNode');
    this.subFunctions = getChildrenByTagName(
      functionElement,
      this.subFunctionName
    ).map(subFunctionDataFromElement);
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
    this.subFunctions = [];
    this.functionElement = null;
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
    return existing && existing !== this.functionElement
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
          subFunctions: this.subFunctions,
          lnodes: this.lnodes,
          functionElement: this.functionElement,
        },
      })
    );

    this.shouldEmitCancel = false;
    this.dialog.close();
  }

  private handleAddSubFunction() {
    this.createSubfunctionDialog.editingSubFunction = null;
    this.createSubfunctionDialog.siblingSubFunctions = this.subFunctions;
    this.createSubfunctionDialog.show();
  }

  private handleEditSubFunction(subFunctionToEdit: SubFunctionData) {
    this.createSubfunctionDialog.editingSubFunction = subFunctionToEdit;
    this.createSubfunctionDialog.siblingSubFunctions = this.subFunctions.filter(
      subFunction => subFunction.id !== subFunctionToEdit.id
    );
    this.createSubfunctionDialog.show();
  }

  private handleSaveSubFunction(e: CustomEvent<SubFunctionData>) {
    const saved = e.detail;
    const previous = this.subFunctions.find(
      subFunction => subFunction.id === saved.id
    );
    const becameEmpty = !!previous?.lnodes.length && !saved.lnodes.length;
    if (!becameEmpty) {
      this.addOrReplaceSubFunction(saved);
      return;
    }

    this.confirmDialog
      .show({
        headline: 'Delete SubFunction?',
        description: `"${saved.name}" no longer has any LNodes. Do you want to delete this ${this.subFunctionName}?`,
        icon: 'delete',
        variant: 'danger',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep empty',
      })
      .then(confirmed => {
        if (confirmed) {
          this.removeSubFunction(saved.id);
        } else this.addOrReplaceSubFunction(saved);
      });
  }

  private handleDeleteSubFunction(subFunctionToDelete: SubFunctionData) {
    const hasLinkedLNodes = subFunctionToDelete.lnodes.some(lNodeHasLinks);
    this.confirmDialog
      .show({
        headline: 'Delete SubFunction?',
        description: hasLinkedLNodes
          ? `"${subFunctionToDelete.name}" contains LNodes used in existing function links. Deleting it will remove those links. Are you sure you want to continue?`
          : `Are you sure you want to delete "${subFunctionToDelete.name}"? This action cannot be undone.`,
        icon: 'delete',
        variant: 'danger',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      })
      .then(confirmed => {
        if (confirmed) {
          this.removeSubFunction(subFunctionToDelete.id);
        }
      });
  }

  private addOrReplaceSubFunction(subFunction: SubFunctionData) {
    const exists = this.subFunctions.some(({ id }) => id === subFunction.id);
    this.subFunctions = exists
      ? this.subFunctions.map(existing =>
          existing.id === subFunction.id ? subFunction : existing
        )
      : [...this.subFunctions, subFunction];
  }

  private removeSubFunction(id: string) {
    this.subFunctions = this.subFunctions.filter(
      subFunction => subFunction.id !== id
    );
  }

  private handleAddLNode() {
    this.lnPickerOpen = true;
  }

  private handleRemoveLNode(lnodeToRemove: Element) {
    const removeLNode = () => {
      this.lnodes = this.lnodes.filter(lnode => lnode !== lnodeToRemove);
    };

    if (!lNodeHasLinks(lnodeToRemove)) {
      removeLNode();
      return;
    }

    this.confirmDialog
      .show(REMOVE_LINKED_LNODE_CONFIRMATION)
      .then(confirmed => {
        if (confirmed) {
          removeLNode();
        }
      });
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
      <div slot="headline">
        ${this.isEdit ? 'Edit' : 'Add'} ${this.elementName}
      </div>
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
            .items=${this.subFunctions}
            .itemHeadline=${(func: SubFunctionData) => func.name}
            .showEditButton=${true}
            @add-item=${this.handleAddSubFunction}
            @edit-item=${(e: CustomEvent<ItemEventDetail<SubFunctionData>>) =>
              this.handleEditSubFunction(e.detail.item)}
            @delete-item=${(e: CustomEvent<ItemEventDetail<SubFunctionData>>) =>
              this.handleDeleteSubFunction(e.detail.item)}
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
            @delete-item=${(e: CustomEvent<ItemEventDetail<Element>>) =>
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
        @save-subfunction=${this.handleSaveSubFunction}
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
