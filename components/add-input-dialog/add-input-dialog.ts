import { LitElement, html, css, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdOutlinedSelect } from '@omicronenergy/oscd-ui/select/OscdOutlinedSelect.js';
import { OscdSelectOption } from '@omicronenergy/oscd-ui/select/OscdSelectOption.js';
import {
  FormGroup,
  Validators,
  type FormField,
  type Validator,
  type Value,
} from '@compas-oscd/forms';
import type { LNodeSelectionContext } from '../functions-layer/function-content-panel.js';
import { getProcessPath } from '../../util.js';
import { getBayProcessResources } from './input-edits.js';

const sourceChoices = [
  {
    lnClass: 'XCBR',
    description: 'Circuit breaker',
    dataObject: 'Pos',
    dataAttributes: ['stVal'],
  },
  {
    lnClass: 'TCTR',
    description: 'Current transformer',
    dataObject: 'AmpSv',
    dataAttributes: ['instMag'],
  },
];

const nonBlankValidator =
  (message: string): Validator =>
  value =>
    typeof value === 'string' && value.length > 0 && !value.trim()
      ? message
      : null;

export interface SaveInputDetail {
  context: LNodeSelectionContext;
  resourceName: string;
  description: string;
  sourceClass: string;
  dataObject: string;
  dataAttribute: string;
  inputName: string;
}

export class AddInputDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-outlined-button': OscdOutlinedButton,
      'oscd-outlined-text-field': OscdOutlinedTextField,
      'oscd-icon': OscdIcon,
      'oscd-outlined-select': OscdOutlinedSelect,
      'oscd-select-option': OscdSelectOption,
    };
  }

  @query('oscd-dialog')
  private readonly dialog!: OscdDialog;

  @query('[name="resourceName"]')
  private readonly resourceNameField!: OscdOutlinedTextField;

  @query('[name="description"]')
  private readonly descriptionField!: OscdOutlinedTextField;

  @query('[name="sourceClass"]')
  private readonly sourceClassField!: OscdOutlinedSelect;

  @query('[name="dataObject"]')
  private readonly dataObjectField!: OscdOutlinedSelect;

  @query('[name="dataAttribute"]')
  private readonly dataAttributeField!: OscdOutlinedSelect;

  @query('[name="inputName"]')
  private readonly inputNameField!: OscdOutlinedTextField;

  @state()
  context: LNodeSelectionContext | null = null;

  @property({ type: Number })
  editCount = -1;

  @state()
  private resourceName = '';

  @state()
  private description = '';

  @state()
  private sourceChoice = sourceChoices[0];

  @state()
  private dataObject = '';

  @state()
  private dataAttribute = '';

  @state()
  private inputName = '';

  @state()
  private saveError = '';

  private formGroup: FormGroup | null = null;

  get open(): boolean {
    return this.dialog.open;
  }

  showForLNode(context: LNodeSelectionContext) {
    this.context = context;
    this.resourceName = '';
    this.description = '';
    [this.sourceChoice] = sourceChoices;
    this.dataObject = '';
    this.dataAttribute = '';
    this.inputName = '';
    this.saveError = '';
    for (const field of [
      this.resourceNameField,
      this.descriptionField,
      this.inputNameField,
    ]) {
      field.error = false;
      field.errorText = '';
    }
    for (const field of [
      this.sourceClassField,
      this.dataObjectField,
      this.dataAttributeField,
    ]) {
      field.error = false;
      field.errorText = '';
    }
    this.formGroup = new FormGroup({
      resourceName: {
        formField: this.resourceNameField as FormField,
        validators: [
          Validators.required('Resource name is required.'),
          nonBlankValidator('Resource name is required.'),
          this.resourceNameTakenValidator,
        ],
      },
      description: {
        formField: this.descriptionField as FormField,
        validators: [],
      },
      sourceClass: {
        formField: this.sourceClassField as FormField,
        validators: [],
      },
      dataObject: {
        formField: this.dataObjectField as FormField,
        validators: [Validators.required('Choose a data object.')],
      },
      dataAttribute: {
        formField: this.dataAttributeField as FormField,
        validators: [],
      },
      inputName: {
        formField: this.inputNameField as FormField,
        validators: [
          Validators.required('Input name is required.'),
          nonBlankValidator('Input name is required.'),
        ],
      },
    });
    this.requestUpdate();
    this.dialog.show();
  }

  close() {
    this.dialog.close();
  }

  reportSaveError(message: string) {
    this.saveError = message;
  }

  private readonly resourceNameTakenValidator: Validator = (value: Value) => {
    if (typeof value !== 'string') return null;
    return this.resourceNameExists(value)
      ? 'Resource name already exists in this bay.'
      : null;
  };

  private resourceNameExists(name: string): boolean {
    const bay = this.context?.lNodeElement.closest('Bay');
    const resources = bay
      ? getBayProcessResources(bay).flatMap(container =>
          Array.from(container.children)
        )
      : [];
    return resources.some(res => res.getAttribute('name') === name);
  }

  private validateForm(): boolean {
    if (!this.formGroup) return false;
    this.resourceNameField.value = this.resourceName;
    this.descriptionField.value = this.description;
    this.sourceClassField.value = this.sourceChoice.lnClass;
    this.dataObjectField.value = this.dataObject;
    this.dataAttributeField.value = this.dataAttribute;
    this.inputNameField.value = this.inputName;
    return this.formGroup.validate();
  }

  private refreshValidation(): void {
    if (Object.keys(this.formGroup?.errors ?? {}).length > 0) {
      this.validateForm();
    }
  }

  private get validationErrors(): string[] {
    const errors: string[] = [];
    if (!this.resourceName.trim()) {
      errors.push('Resource name is required.');
    } else if (this.resourceNameExists(this.resourceName)) {
      errors.push('Resource name already exists in this bay.');
    }
    if (!this.dataObject) errors.push('Choose a data object.');
    if (!this.inputName.trim()) errors.push('Input name is required.');
    return errors;
  }

  private get saveDisabled(): boolean {
    return this.validationErrors.length > 0;
  }

  private handleSourceClassChange(e: Event) {
    const choice = sourceChoices.find(
      source => source.lnClass === (e.target as OscdOutlinedSelect).value
    );
    if (!choice) throw new Error('Unsupported source logical-node class.');
    this.sourceChoice = choice;
    this.dataObject = '';
    this.dataAttribute = '';
    this.inputName = '';
    this.refreshValidation();
  }

  private chooseDataObject() {
    const { dataObject } = this.sourceChoice;
    if (this.dataObject !== dataObject) {
      this.dataObject = dataObject;
      this.inputName = dataObject;
      this.dataAttribute = '';
      this.refreshValidation();
    }
  }

  private handleSave() {
    if (!this.validateForm()) {
      this.requestUpdate();
      return;
    }
    if (!this.context) {
      this.reportSaveError('No sink LNode is selected.');
      return;
    }

    this.saveError = '';
    this.dispatchEvent(
      new CustomEvent<SaveInputDetail>('save-input', {
        detail: {
          context: this.context,
          resourceName: this.resourceName,
          description: this.description,
          sourceClass: this.sourceChoice.lnClass,
          dataObject: this.dataObject,
          dataAttribute: this.dataAttribute,
          inputName: this.inputName,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const { validationErrors } = this;
    const sink = this.context?.lNodeElement;
    const sinkClass = sink?.getAttribute('lnClass') ?? '';
    const voltageLevel = sink?.closest('VoltageLevel')?.getAttribute('name');
    const missing = [
      ...(!this.resourceName.trim() ? ['Resource name'] : []),
      ...(!this.dataObject ? ['Data object'] : []),
      ...(!this.inputName.trim() ? ['Input name'] : []),
    ];
    const validationMessage = missing.length
      ? `Still needed: ${missing.join(', ')}`
      : validationErrors.join(' ');

    return html`
      <oscd-dialog
        @keydown=${(event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <div slot="headline" class="headline">
          <span class="headline-icon"><oscd-icon>input</oscd-icon></span>
          Add input
        </div>
        <div slot="content" class="content">
          <div class="link-preview" aria-label="External input connection">
            <div class="endpoint source" data-testid="source-preview">
              <span class="eyebrow">Source · not linked yet</span>
              <div>
                <strong>${this.sourceChoice.lnClass}</strong>
                <span
                  >in another
                  bay${voltageLevel ? ` of ${voltageLevel}` : ''}</span
                >
              </div>
            </div>
            <div class="connection" aria-label="1 source">
              <div class="arrow"><oscd-icon>arrow_forward</oscd-icon></div>
              <span>1 source</span>
            </div>
            <div class="endpoint sink" data-testid="sink-preview">
              <span class="eyebrow">Sink · this LNode</span>
              <strong>${sinkClass}</strong>
              <span class="sink-path"
                >${sink?.parentElement
                  ? getProcessPath(sink.parentElement).split('/').join(' › ')
                  : ''}</span
              >
            </div>
          </div>
          <div class="form">
            <div class="field">
              <span>Resource name <b>*</b></span>
              <oscd-outlined-text-field
                name="resourceName"
                .ariaLabel=${'Resource name'}
                required
                .value=${this.resourceName}
                @input=${(e: Event) => {
                  this.resourceName = (e.target as OscdOutlinedTextField).value;
                  this.refreshValidation();
                }}
              ></oscd-outlined-text-field>
            </div>
            <div class="field">
              <span>Description</span>
              <oscd-outlined-text-field
                name="description"
                .ariaLabel=${'Description)'}
                .value=${this.description}
                @input=${(e: Event) => {
                  this.description = (e.target as OscdOutlinedTextField).value;
                  this.refreshValidation();
                }}
              ></oscd-outlined-text-field>
            </div>
            <div class="source-fields">
              <div class="field">
                <span>Selector <b>*</b></span>
                <oscd-outlined-select
                  name="sourceClass"
                  required
                  .ariaLabel=${'Selector'}
                  data-testid="source-class"
                  .value=${this.sourceChoice.lnClass}
                  @change=${this.handleSourceClassChange}
                >
                  ${sourceChoices.map(
                    choice => html`<oscd-select-option
                      value=${choice.lnClass}
                      .selected=${this.sourceChoice === choice}
                    >
                      <span slot="headline"
                        >${choice.lnClass} ${choice.description}</span
                      >
                    </oscd-select-option>`
                  )}
                </oscd-outlined-select>
              </div>
              <div class="field">
                <span>Search scope</span>
                <div class="locked-scope" data-testid="search-scope">
                  <span
                    >Voltage
                    Level${voltageLevel ? ` ${voltageLevel}` : ''}</span
                  >
                  <oscd-icon aria-label="Fixed scope">lock</oscd-icon>
                </div>
              </div>
            </div>
            <div class="input-fields">
              <div class="field">
                <span>Max number of sources</span>
                <oscd-outlined-text-field
                  name="maxSources"
                  .ariaLabel=${'Max number of sources'}
                  type="number"
                  value="1"
                  disabled
                ></oscd-outlined-text-field>
              </div>
              <div class="field">
                <span>Service</span>
                <oscd-outlined-select
                  name="service"
                  .ariaLabel=${'Service'}
                  label="Available in a later step"
                  disabled
                ></oscd-outlined-select>
              </div>
            </div>
            <div class="input-fields">
              <div class="field">
                <span>Data object <b>*</b></span>
                <oscd-outlined-select
                  name="dataObject"
                  .ariaLabel=${'Data object'}
                  label="Choose from list"
                  required
                  .value=${this.dataObject}
                  @change=${this.chooseDataObject}
                >
                  <oscd-select-option
                    .value=${this.sourceChoice.dataObject}
                    .selected=${this.dataObject ===
                    this.sourceChoice.dataObject}
                    ><span slot="headline"
                      >${this.sourceChoice.dataObject}</span
                    ></oscd-select-option
                  >
                </oscd-outlined-select>
              </div>
              <div class="field">
                <span>Data attribute</span>
                <oscd-outlined-select
                  name="dataAttribute"
                  .ariaLabel=${'Data attribute'}
                  .disabled=${!this.dataObject}
                  .value=${this.dataAttribute}
                  @change=${(e: Event) => {
                    this.dataAttribute = (e.target as OscdOutlinedSelect).value;
                    this.refreshValidation();
                  }}
                >
                  <oscd-select-option value="" .selected=${!this.dataAttribute}
                    ><span slot="headline"
                      >${this.dataObject
                        ? 'No data attribute'
                        : 'Pick a data object first'}</span
                    ></oscd-select-option
                  >
                  ${this.sourceChoice.dataAttributes.map(
                    attribute => html`
                      <oscd-select-option
                        .value=${attribute}
                        .selected=${this.dataAttribute === attribute}
                      >
                        <span slot="headline">${attribute}</span>
                      </oscd-select-option>
                    `
                  )}
                </oscd-outlined-select>
              </div>
            </div>

            <div class="field">
              <span>Input name <b>*</b></span>
              <oscd-outlined-text-field
                name="inputName"
                .ariaLabel=${'Input name'}
                placeholder="Filled in when you choose a data object"
                required
                aria-describedby="input-name-help"
                .value=${this.inputName}
                @input=${(e: Event) => {
                  this.inputName = (e.target as OscdOutlinedTextField).value;
                  this.refreshValidation();
                }}
              ></oscd-outlined-text-field>
              <p id="input-name-help" class="field-help">
                Pre-filled from the data object. Edit it if the input needs a
                different name.
              </p>
            </div>
            ${this.saveError
              ? html`<p role="alert" data-testid="save-error">
                  ${this.saveError}
                </p>`
              : nothing}
          </div>
        </div>
        <div slot="actions" class="footer">
          <div class="save-status" aria-live="polite">
            ${validationErrors.length
              ? html`<div data-testid="validation-errors">
                  <oscd-icon>info</oscd-icon>
                  <span>${validationMessage}</span>
                </div>`
              : nothing}
          </div>
          <div class="buttons">
            <oscd-outlined-button
              data-testid="close-button"
              @click=${this.close}
              >Close</oscd-outlined-button
            >
            <oscd-filled-button
              data-testid="save-button"
              .disabled=${this.saveDisabled}
              @click=${this.handleSave}
              >Save</oscd-filled-button
            >
          </div>
        </div>
      </oscd-dialog>
    `;
  }

  static styles = css`
    :host {
      --input-accent: var(--oscd-primary);
      --input-surface: var(--oscd-base3);
      --input-panel: var(--oscd-base2);
      --input-field: var(--oscd-base3);
      --input-text: var(--oscd-base00);
      --input-muted: var(--oscd-base00);
      --input-border: var(--oscd-base1);
      font-family: var(--oscd-text-font), sans-serif;
    }

    oscd-dialog {
      width: 648px;
      max-width: calc(100vw - 32px);
      max-height: calc(100dvh - 48px);
      --md-dialog-container-color: var(--input-surface);
      --md-dialog-container-shape: var(--md-sys-shape-corner-large);
      --md-dialog-headline-size: 20px;
      --md-dialog-headline-weight: 600;
      --md-dialog-headline-color: var(--input-text);
      --md-dialog-supporting-text-color: var(--input-text);
    }

    oscd-dialog > .headline {
      padding: 16px 24px;
      gap: 12px;
      border-bottom: 1px solid var(--input-border);
    }

    .headline-icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: var(--input-accent);
      background: var(--input-panel);
    }

    .headline-icon oscd-icon {
      font-size: 20px;
    }

    oscd-dialog > .content {
      padding: 0;
    }

    .link-preview {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1.25fr);
      align-items: center;
      gap: 14px;
      padding: 8px 24px;
      background: var(--input-panel);
    }

    .endpoint {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 14px;
      border: 1px solid var(--input-accent);
      border-radius: var(--md-sys-shape-corner-medium);
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--input-muted);
    }

    .endpoint strong {
      font-size: 16px;
      color: var(--input-text);
    }

    .source {
      border-style: dashed;
    }

    .source strong {
      margin-right: 4px;
    }

    .sink {
      background: var(--input-field);
    }

    .eyebrow {
      font-size: 11px;
      line-height: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .sink-path {
      font-size: 12px;
      line-height: 16px;
    }

    .connection {
      color: var(--input-accent);
      text-align: center;
      font-size: 11px;
      font-weight: 500;
    }

    .arrow {
      display: flex;
      align-items: center;
      height: 22px;
    }

    .arrow::before {
      content: '';
      flex: 1;
      border-top: 2px dashed currentColor;
    }

    .arrow oscd-icon {
      margin-left: -6px;
      font-size: 20px;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 24px 20px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      font-size: 13px;
      font-weight: 500;
    }

    .field b {
      color: var(--input-accent);
    }

    .source-fields,
    .input-fields {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
      gap: 14px;
    }

    .input-fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    oscd-outlined-text-field,
    oscd-outlined-select {
      width: 100%;
      background: var(--input-field);
      border-radius: var(--oscd-shape);
      --md-outlined-text-field-container-shape: var(--oscd-shape);
      --md-outlined-text-field-top-space: 12px;
      --md-outlined-text-field-bottom-space: 12px;
      --md-outlined-text-field-input-text-size: 14px;
      --md-outlined-text-field-input-text-line-height: 20px;
      --md-outlined-text-field-input-text-color: var(--input-text);
      --md-outlined-text-field-focus-outline-color: var(--input-accent);
      --md-outlined-text-field-supporting-text-color: var(--input-muted);
      --md-outlined-text-field-supporting-text-size: 12px;
      --md-outlined-text-field-supporting-text-leading-space: 0px;
      --md-outlined-text-field-supporting-text-trailing-space: 0px;
    }

    oscd-outlined-select {
      --md-outlined-select-text-field-container-shape: var(--oscd-shape);
      --md-outlined-field-top-space: 12px;
      --md-outlined-field-bottom-space: 12px;
      --md-outlined-select-text-field-input-text-size: 14px;
      --md-outlined-select-text-field-input-text-line-height: 20px;
      --md-outlined-select-text-field-input-text-color: var(--input-text);
      --md-outlined-select-text-field-focus-outline-color: var(--input-accent);
    }

    oscd-outlined-select[disabled],
    oscd-outlined-text-field[disabled] {
      background: var(--input-panel);
    }

    .field-help {
      color: var(--input-muted);
      font-size: 12px;
      font-weight: 400;
      line-height: 16px;
      background: transparent;
    }

    .locked-scope {
      box-sizing: border-box;
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--oscd-base01);
      border-radius: var(--oscd-shape);
      padding: 10px 12px;
      font: 400 14px var(--oscd-text-font), sans-serif;
      color: var(--input-text);
      background: var(--input-field);
    }

    .locked-scope {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-style: dashed;
      background: var(--input-panel);
      color: var(--input-muted);
    }

    .locked-scope oscd-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    oscd-dialog > .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 24px;
      border-top: 1px solid var(--input-border);
    }

    .save-status {
      flex: 1;
      min-width: 0;
      color: var(--input-muted);
      font-size: 12px;
      line-height: 18px;
    }

    [data-testid='validation-errors'] {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .save-status oscd-icon {
      font-size: 18px;
      color: var(--oscd-secondary);
      flex-shrink: 0;
    }

    .buttons {
      display: flex;
      gap: 16px;
    }

    p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    [data-testid='save-error'] {
      color: var(--oscd-error);
    }

    @media (max-width: 560px) {
      .link-preview {
        grid-template-columns: minmax(0, 1fr) 36px minmax(0, 1fr);
        gap: 8px;
        padding: 8px 16px;
      }

      .endpoint {
        padding: 10px;
      }

      .source-fields,
      .input-fields {
        grid-template-columns: minmax(0, 1fr);
      }

      .form {
        padding: 8px 16px 20px;
      }

      oscd-dialog > .footer {
        flex-wrap: wrap;
        padding: 14px 16px;
      }

      .save-status {
        flex-basis: 100%;
      }

      .buttons {
        margin-left: auto;
      }
    }
  `;
}
