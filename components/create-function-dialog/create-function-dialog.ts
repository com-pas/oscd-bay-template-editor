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
      'add-subfunction-dialog': CreateSubfunctionDialog,
      'confirm-dialog': ConfirmDialog,
    };
  }

  @property({ type: Object })
  parent: Element | null = null;

  @property({ type: String })
  selectedElementName = '';

  @property({ type: String })
  selectedElementType = '';

  @query('oscd-dialog')
  dialog!: OscdDialog;

  @query('oscd-filled-text-field[name="name"]')
  nameField!: OscdFilledTextField;

  @query('oscd-scl-text-field[name="description"]')
  descriptionField!: OscdSclTextField;

  @query('oscd-scl-text-field[name="type"]')
  typeField!: OscdSclTextField;

  @query('add-subfunction-dialog')
  createSubfunctionDialog!: CreateSubfunctionDialog;

  @query('confirm-dialog')
  confirmDialog!: ConfirmDialog;

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

  private formGroup: FormGroup | null = null;

  private shouldEmitCancel = true;

  show() {
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
    this.dialog.close();
  }

  reset() {
    this.step = CreateFunctionDialogStep.FunctionAttributes;
    this.name = '';
    this.description = null;
    this.type = null;
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
    const emitCancel = this.shouldEmitCancel;
    this.shouldEmitCancel = true;
    this.reset();
    if (emitCancel) {
      this.dispatchEvent(
        new CustomEvent('cancel', { bubbles: true, composed: true })
      );
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
        bubbles: true,
        composed: true,
        detail: {
          name: this.name,
          description: this.description,
          type: this.type,
          subfunctions: this.tempSubfunctions,
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
  }

  private handleDeleteSubfunction() {
    if (this.selectedSubfunction === null) return;

    const subfunctionName =
      this.tempSubfunctions[this.selectedSubfunction].name;

    this.confirmDialog.description = `Are you sure you want to delete "${subfunctionName}"? This action cannot be undone.`;
    this.confirmDialog.show();
  }

  private handleSubfunctionClick(index: number) {
    this.selectedSubfunction =
      this.selectedSubfunction === index ? null : index;
  }

  private handleConfirmDeleteSubfunction() {
    if (this.selectedSubfunction === null) return;
    this.tempSubfunctions.splice(this.selectedSubfunction, 1);
    this.selectedSubfunction = null;
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

  renderFunctionContent() {
    return html` <div slot="headline">
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
            <h4>SubFunctions</h4>
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
          <oscd-list>
            ${this.tempSubfunctions.length === 0
              ? html`<oscd-list-item type="text">
                  <oscd-icon slot="start">info</oscd-icon>
                  <span slot="headline"
                    >Click the add button to create a new SubFunction</span
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
      </div>`;
  }

  render() {
    return html`
      <oscd-dialog @closed=${this.handleClosed}>
        ${this.step === CreateFunctionDialogStep.FunctionAttributes
          ? this.renderFunctionAttrs()
          : this.renderFunctionContent()}
      </oscd-dialog>

      <add-subfunction-dialog
        @save-subfunction=${this.handleSaveSubfunction}
      ></add-subfunction-dialog>

      <confirm-dialog
        headline="Delete SubFunction?"
        confirm-label="Delete"
        cancel-label="Cancel"
        icon="delete"
        variant="danger"
        @confirm-dialog-confirm=${this.handleConfirmDeleteSubfunction}
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
