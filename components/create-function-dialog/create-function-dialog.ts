/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';

export class CreateFunctionDialog extends ScopedElementsMixin(LitElement) {
  @state()
  nameError: string | null = null;

  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-filled-text-field': OscdFilledTextField,
      'oscd-scl-text-field': OscdSclTextField,
    };
  }

  @property({ type: Boolean })
  open = false;

  @property({ type: Object })
  parent: Element | null = null;

  @query('oscd-dialog')
  dialog!: OscdDialog;

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

  show() {
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
    this.nameError = null;
    this.descriptionField.reset();
    this.typeField.reset();
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.nameError = null;
    if (!this.name.trim()) {
      this.nameError = 'Name is required.';
      this.requestUpdate();
      return;
    }
    if (this.parent) {
      const existing = Array.from(this.parent.children).find(
        el =>
          el.tagName === 'Function' &&
          el.getAttribute('name')?.trim() === this.name.trim()
      );
      if (existing) {
        this.nameError = `A Function with the name "${this.name.trim()}" already exists.`;
        this.requestUpdate();
        return;
      }
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
      <oscd-dialog>
        <div slot="headline">Add function</div>
        <form slot="content" @submit=${this.handleSubmit} autocomplete="off">
          <oscd-filled-text-field
            label="Name"
            required
            name="name"
            .value=${this.name}
            .errorText=${this.nameError ?? ''}
            .error=${!!this.nameError}
            @input=${(e: any) => {
              this.name = e.target.value;
              this.nameError = null;
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
          <div
            slot="actions"
            style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;"
          >
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
