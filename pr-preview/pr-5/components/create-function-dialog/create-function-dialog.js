import { __decorate } from "tslib";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';
export class CreateFunctionDialog extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.parent = null;
        this.name = '';
        this.nameError = null;
        this.description = null;
        this.type = null;
    }
    static get scopedElements() {
        return {
            'oscd-dialog': OscdDialog,
            'oscd-filled-button': OscdFilledButton,
            'oscd-filled-text-field': OscdFilledTextField,
            'oscd-scl-text-field': OscdSclTextField,
        };
    }
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
    }
    handleSubmit(e) {
        e.preventDefault();
        this.nameError = null;
        if (!this.name.trim()) {
            this.nameError = 'Name is required';
            this.requestUpdate();
            return;
        }
        if (this.parent) {
            const existing = Array.from(this.parent.children).find(el => el.tagName === 'Function' &&
                el.getAttribute('name')?.trim() === this.name.trim());
            if (existing) {
                this.nameError = `A Function with the name "${this.name.trim()}" already exists`;
                this.requestUpdate();
                return;
            }
        }
        this.dispatchEvent(new CustomEvent('save', {
            detail: {
                name: this.name,
                description: this.description,
                type: this.type,
            },
        }));
    }
    render() {
        return html `
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
            .errorText=${this.nameError ?? ''}
            .error=${!!this.nameError}
            @input=${(e) => {
            this.name = e.target.value;
            this.nameError = null;
        }}
          ></oscd-filled-text-field>
          <oscd-scl-text-field
            nullable
            label="Description"
            name="description"
            .value=${this.description}
            @input=${(e) => {
            this.description = e.target.value;
        }}
          ></oscd-scl-text-field>
          <oscd-scl-text-field
            nullable
            label="Type"
            name="type"
            .value=${this.type}
            @input=${(e) => {
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
}
CreateFunctionDialog.styles = css `
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
__decorate([
    property({ type: Object })
], CreateFunctionDialog.prototype, "parent", void 0);
__decorate([
    query('oscd-dialog')
], CreateFunctionDialog.prototype, "dialog", void 0);
__decorate([
    state()
], CreateFunctionDialog.prototype, "name", void 0);
__decorate([
    state()
], CreateFunctionDialog.prototype, "nameError", void 0);
__decorate([
    state()
], CreateFunctionDialog.prototype, "description", void 0);
__decorate([
    state()
], CreateFunctionDialog.prototype, "type", void 0);
//# sourceMappingURL=create-function-dialog.js.map