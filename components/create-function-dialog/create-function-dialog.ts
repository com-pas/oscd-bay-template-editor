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
import { getFunctions } from '../../util.js';

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

  @state()
  name = '';

  @state()
  description: string | null = null;

  @state()
  type: string | null = null;

  @state()
  step: CreateFunctionDialogStep = CreateFunctionDialogStep.FunctionAttributes;

  private formGroup: FormGroup | null = null;

  private shouldEmitCancel = true;

  show() {
    this.step = CreateFunctionDialogStep.FunctionAttributes;
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
        },
      })
    );

    this.shouldEmitCancel = false;
    this.dialog.close();
  }

  renderFunctionAttrs() {
    return html`
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
        <div slot="actions">
          <oscd-filled-button
            type="button"
            data-testid="cancel-button-step1"
            @click=${this.close}
            >Cancel</oscd-filled-button
          >
          <oscd-filled-button type="submit" data-testid="next-button"
            >Next</oscd-filled-button
          >
        </div>
      </form>
    `;
  }

  renderFunctionContent() {
    return html`<div slot="content" class="content">
        ${this.selectedElementName
          ? html`
              <span class="secondary-text"
                >${this.selectedElementType} ${this.selectedElementName}</span
              >
              <oscd-divider></oscd-divider>
            `
          : nothing}

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
        <div slot="headline">
          ${this.step === CreateFunctionDialogStep.FunctionAttributes
            ? html`Add Function`
            : html`<div class="dialog-title">
                <oscd-icon>function</oscd-icon>
                <span>${this.name}</span>
              </div>`}
        </div>

        ${this.step === CreateFunctionDialogStep.FunctionAttributes
          ? this.renderFunctionAttrs()
          : this.renderFunctionContent()}
      </oscd-dialog>
    `;
  }

  static readonly styles = css`
    oscd-dialog {
      --md-dialog-container-min-width: 500px;
      --md-dialog-container-max-height: 80vh;
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
