import { LitElement, html, css } from 'lit';
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
import { SubfunctionData } from '../../util.js';

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
    };
  }

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

  @state()
  name = '';

  @state()
  description: string | null = null;

  @state()
  type: string | null = null;

  @state()
  step: CreateSubfunctionDialogStep =
    CreateSubfunctionDialogStep.SubfunctionAttributes;

  private formGroup: FormGroup | null = null;

  show() {
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
    this.dialog.close();
  }

  reset() {
    this.step = CreateSubfunctionDialogStep.SubfunctionAttributes;
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
    this.reset();
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
        },
      })
    );

    this.dialog.close();
  }

  renderSubfunctionAttrs() {
    return html`
      <div slot="headline">Add Subfunction</div>
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
            <oscd-icon-button title="Add LNode" disabled>
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
          data-testid="back-button"
          @click=${this.handleBack}
          >Back</oscd-filled-button
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

  render() {
    return html`
      <oscd-dialog @closed=${this.handleClosed}>
        ${this.step === CreateSubfunctionDialogStep.SubfunctionAttributes
          ? this.renderSubfunctionAttrs()
          : this.renderSubfunctionContent()}
      </oscd-dialog>
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
