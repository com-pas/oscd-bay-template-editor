/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';
import {
  FormGroup,
  Validators,
  type FormField,
  type Validator,
  type Value,
} from '@compas-oscd/forms';

export class CreateFunctionDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-filled-text-field': OscdFilledTextField,
      'oscd-scl-text-field': OscdSclTextField,
    };
  }

  @property({ type: Object })
  parent: Element | null = null;

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
  description = null;

  @state()
  type = null;

  private formGroup: FormGroup | null = null;

  show() {
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
    this.reset();
  }

  cancel() {
    this.close();
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  reset() {
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

  private nameTakenValidator: Validator = (value: Value) => {
    const trimmed = (value as string).trim();
    if (!this.parent) return null;
    const existing = Array.from(this.parent.children).find(
      el =>
        el.tagName === 'Function' && el.getAttribute('name')?.trim() === trimmed
    );
    return existing
      ? `A Function with the name "${trimmed}" already exists`
      : null;
  };

  private handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.formGroup?.validate()) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('save', {
        detail: {
          name: this.name,
          description: this.description,
          type: this.type,
        },
      })
    );
  }

  render() {
    return html`
      <oscd-dialog @closed=${this.cancel}>
        <div slot="headline">Add Function</div>
        <form
          slot="content"
          novalidate
          @submit=${this.handleSubmit}
          autocomplete="off"
        >
          <oscd-filled-text-field
            label="Name"
            required
            name="name"
            .value=${this.name}
            @input=${(e: any) => {
              this.name = e.target.value;
            }}
          ></oscd-filled-text-field>
          <oscd-scl-text-field
            nullable
            label="Description"
            name="description"
            .value=${this.description}
            @input=${(e: any) => {
              this.description = e.target.value;
            }}
          ></oscd-scl-text-field>
          <oscd-scl-text-field
            nullable
            label="Type"
            name="type"
            .value=${this.type}
            @input=${(e: any) => {
              this.type = e.target.value;
            }}
          ></oscd-scl-text-field>
          <div slot="actions">
            <oscd-filled-button type="button" @click=${this.cancel}
              >Close</oscd-filled-button
            >
            <oscd-filled-button type="submit">Save</oscd-filled-button>
          </div>
        </form>
      </oscd-dialog>
    `;
  }

  static styles = css`
    oscd-dialog {
      min-width: 320px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
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
