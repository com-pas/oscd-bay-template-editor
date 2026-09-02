import { LitElement, html, css } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdFilledSelect } from '@omicronenergy/oscd-ui/select/OscdFilledSelect.js';
import { OscdSelectOption } from '@omicronenergy/oscd-ui/select/OscdSelectOption.js';
import {
  buildObjectReferences,
  filterObjectReferenceGroups,
  selectedReferencesSummary,
  type LinkService,
  type ObjectReferenceGroup,
  type ObjectReferenceItem,
} from './object-references.js';
import { getProcessPath } from '../../util.js';

export interface CreateFunctionLinkEventDetail {
  service: LinkService;
  selectedReferences: ObjectReferenceItem[];
}

export class FunctionLinkDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-dialog': OscdDialog,
      'oscd-filled-button': OscdFilledButton,
      'oscd-filled-text-field': OscdFilledTextField,
      'oscd-icon': OscdIcon,
      'oscd-icon-button': OscdIconButton,
      'oscd-list': OscdList,
      'oscd-list-item': OscdListItem,
      'oscd-filled-select': OscdFilledSelect,
      'oscd-select-option': OscdSelectOption,
    };
  }

  @query('oscd-dialog')
  private readonly dialog!: OscdDialog;

  @property({ type: String })
  sourceFunctionName = '';

  @property({ type: String })
  sourceFunctionPath = '';

  @state()
  private objectReferenceGroups: ObjectReferenceGroup[] = [];

  @state()
  private filterQuery = '';

  @state()
  private selectedService: '' | LinkService = '';

  @state()
  private selectedReferenceIds: Set<string> = new Set();

  private readonly boundHandleDocumentKeydown =
    this.handleDocumentKeydown.bind(this);

  get open() {
    return this.dialog.open;
  }

  show() {
    document.addEventListener('keydown', this.boundHandleDocumentKeydown, true);
    this.dialog.show();
  }

  showForSourceFunction(sourceFunction: Element, doc: Document) {
    this.sourceFunctionName = sourceFunction.getAttribute('name') ?? '';
    this.sourceFunctionPath = getProcessPath(sourceFunction);
    this.objectReferenceGroups = buildObjectReferences(sourceFunction, doc);
    this.resetSelectionState();
    this.show();
  }

  close() {
    this.dialog.close();
  }

  disconnectedCallback(): void {
    document.removeEventListener(
      'keydown',
      this.boundHandleDocumentKeydown,
      true
    );
    super.disconnectedCallback();
  }

  private resetSelectionState() {
    this.filterQuery = '';
    this.selectedService = '';
    this.selectedReferenceIds = new Set();
  }

  private get filteredGroups(): ObjectReferenceGroup[] {
    return filterObjectReferenceGroups(
      this.objectReferenceGroups,
      this.filterQuery
    );
  }

  private get selectedReferences(): ObjectReferenceItem[] {
    return this.objectReferenceGroups
      .flatMap(group => group.items)
      .filter(item => this.selectedReferenceIds.has(item.id));
  }

  private get canConnect(): boolean {
    return this.selectedService !== '' && this.selectedReferenceIds.size > 0;
  }

  private handleSearchInput(e: InputEvent) {
    this.filterQuery = (e.target as OscdFilledTextField).value;
  }

  private clearSearchFilter() {
    this.filterQuery = '';
  }

  private handleServiceChange(e: Event) {
    this.selectedService = (e.target as HTMLSelectElement).value as
      | ''
      | LinkService;
  }

  private handleToggleReference(referenceId: string, selected: boolean) {
    const next = new Set(this.selectedReferenceIds);
    if (selected) {
      next.add(referenceId);
    } else {
      next.delete(referenceId);
    }
    this.selectedReferenceIds = next;
  }

  private handleConnect() {
    if (!this.canConnect || !this.selectedService) return;

    this.dispatchEvent(
      new CustomEvent<CreateFunctionLinkEventDetail>('create-function-link', {
        detail: {
          service: this.selectedService,
          selectedReferences: this.selectedReferences,
        },
        bubbles: true,
        composed: true,
      })
    );

    this.close();
  }

  private dispatchCloseEvent() {
    document.removeEventListener(
      'keydown',
      this.boundHandleDocumentKeydown,
      true
    );
    this.resetSelectionState();
    this.dispatchEvent(
      new CustomEvent('close-function-link-dialog', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleDialogClosed = () => {
    this.dispatchCloseEvent();
  };

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

  private renderReferenceRow(item: ObjectReferenceItem) {
    const checked = this.selectedReferenceIds.has(item.id);
    return html`
      <oscd-list-item noninteractive>
        <label class="reference-row" slot="headline">
          <input
            data-testid=${`reference-checkbox-${item.id}`}
            type="checkbox"
            .checked=${checked}
            @change=${(e: Event) =>
              this.handleToggleReference(
                item.id,
                (e.target as HTMLInputElement).checked
              )}
          />
          <span class="reference-content">
            <span class="reference-short">${item.shortPath}</span>
            <span class="reference-full">${item.fullSource}</span>
          </span>
        </label>
      </oscd-list-item>
    `;
  }

  private renderReferenceList() {
    if (this.filteredGroups.length === 0) {
      return html`
        <div class="reference-list-empty">
          No object references match your search
        </div>
      `;
    }

    return html`
      <oscd-list class="reference-list" data-testid="reference-list">
        ${this.filteredGroups.map(
          group => html`
            <div class="group-header">${group.label}</div>
            ${group.items.map(item => this.renderReferenceRow(item))}
          `
        )}
      </oscd-list>
    `;
  }

  render() {
    return html`
      <oscd-dialog
        id="function-link-dialog"
        @cancel=${this.handleCancel}
        @closed=${this.handleDialogClosed}
      >
        <div slot="headline">Create Function Link</div>
        <div slot="content" class="content">
          <dl class="source-summary">
            <div>
              <dt>Source function</dt>
              <dd>${this.sourceFunctionName}</dd>
            </div>
            <div>
              <dt>Source function path</dt>
              <dd>${this.sourceFunctionPath}</dd>
            </div>
          </dl>

          <div class="filters-row">
            <oscd-filled-text-field
              class="search-field"
              label="Search object references"
              .value=${this.filterQuery}
              @input=${this.handleSearchInput}
              has-trailing-icon
            >
              <oscd-icon slot="leading-icon">search</oscd-icon>
              ${this.filterQuery
                ? html`
                    <oscd-icon-button
                      class="clear-search-button"
                      slot="trailing-icon"
                      title="Clear search"
                      data-testid="clear-search-button"
                      @click=${this.clearSearchFilter}
                    >
                      <oscd-icon>close</oscd-icon>
                    </oscd-icon-button>
                  `
                : null}
            </oscd-filled-text-field>

            <div
              class="service-select-wrapper"
              data-testid="service-select-wrapper"
            >
              <oscd-filled-select
                data-testid="service-select"
                label="Select service"
                .value=${this.selectedService}
                @change=${this.handleServiceChange}
              >
                <oscd-select-option value="GOOSE">GOOSE</oscd-select-option>
                <oscd-select-option value="SMV">SMV</oscd-select-option>
                <oscd-select-option value="Internal"
                  >Internal</oscd-select-option
                >
              </oscd-filled-select>
            </div>
          </div>

          <div class="reference-list-shell">${this.renderReferenceList()}</div>

          <div class="selection-summary" data-testid="selection-summary">
            ${selectedReferencesSummary(this.selectedReferenceIds.size)}
          </div>
        </div>
        <div slot="actions">
          <oscd-filled-button data-testid="close-button" @click=${this.close}>
            Close</oscd-filled-button
          >
          <oscd-filled-button
            data-testid="connect-button"
            .disabled=${!this.canConnect}
            @click=${this.handleConnect}
            >Connect</oscd-filled-button
          >
        </div>
      </oscd-dialog>
    `;
  }

  static styles = css`
    oscd-dialog {
      max-height: min(90vh, 800px);
      width: 600px;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 480px;
    }

    .source-summary {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
    }

    .source-summary div {
      display: grid;
      gap: 2px;
    }

    .source-summary dt {
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      font-size: 12px;
    }

    .source-summary dd {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-size: 14px;
      margin: 0;
      overflow-wrap: anywhere;
    }

    .filters-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .search-field {
      flex: 1;
      --md-filled-text-field-container-height: 48px;
    }

    oscd-filled-select {
      --md-filled-select-text-field-container-height: 48px;
      --md-filled-field-container-height: 48px;
    }

    .clear-search-button {
      --md-icon-button-icon-size: 16px;
      --md-icon-button-state-layer-size: 28px;
    }

    .clear-search-button oscd-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .service-select-wrapper {
      display: flex;
      flex-direction: column;
      min-width: 170px;
    }

    .reference-list-shell {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 12px;
      overflow: hidden;
      max-height: 480px;
      min-height: 220px;
    }

    .reference-list {
      max-height: 420px;
      overflow-y: auto;
      --md-list-container-color: transparent;
      padding: 0;
    }

    .group-header {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      padding: 10px 12px 6px;
      background: var(--md-sys-color-surface-container-low, #f4efec);
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }

    .reference-list > .group-header:first-child {
      border-top: none;
    }

    .reference-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
      cursor: pointer;
    }

    .reference-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 2px;
    }

    .reference-short {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-size: 15px;
      line-height: 18px;
    }

    .reference-full {
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      font-size: 12px;
      line-height: 16px;
      word-break: break-all;
    }

    .reference-list-empty {
      padding: 16px;
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      font-size: 13px;
    }

    .selection-summary {
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      font-size: 13px;
    }
  `;
}
