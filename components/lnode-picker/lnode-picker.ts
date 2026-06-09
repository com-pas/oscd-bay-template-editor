import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';

export interface LNodeTypeEntry {
  id: string;
  lnClass: string;
  desc: string | null;
}

/**
 * Inline LNode type picker.
 *
 * Parses all `LNodeType` elements from the provided SCL `library` document,
 * presents them as a searchable multi-select list, and emits
 * `lnode-picker-confirm` with the selected entries when the user confirms.
 *
 * @fires lnode-picker-confirm
 * @fires lnode-picker-cancel
 */
export class LNodePicker extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-icon': OscdIcon,
      'oscd-icon-button': OscdIconButton,
      'oscd-filled-text-field': OscdFilledTextField,
      'oscd-list': OscdList,
      'oscd-list-item': OscdListItem,
    };
  }

  @property({ attribute: false })
  library: Document | Element | null = null;

  @property({ type: Array })
  existingIds: string[] = [];

  @state()
  private query = '';

  @state()
  private selectedIds: Set<string> = new Set();

  private get allEntries(): LNodeTypeEntry[] {
    if (!this.library) return [];

    const lNodeTypes = this.library
      ? Array.from(
          this.library.querySelectorAll(':root > DataTypeTemplates > LNodeType')
        )
      : [];

    return lNodeTypes.map(el => ({
      id: el.getAttribute('id') ?? '',
      lnClass: el.getAttribute('lnClass') ?? '',
      desc: el.getAttribute('desc'),
    }));
  }

  private get filteredEntries(): LNodeTypeEntry[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.allEntries;
    return this.allEntries.filter(
      e =>
        e.id.toLowerCase().includes(q) ||
        e.lnClass.toLowerCase().includes(q) ||
        (e.desc ?? '').toLowerCase().includes(q)
    );
  }

  private handleSearchInput(e: InputEvent) {
    this.query = (e.target as OscdFilledTextField).value;
  }

  private handleToggle(id: string) {
    if (this.existingIds.includes(id)) return;
    const next = new Set(this.selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds = next;
  }

  private handleConfirm() {
    const selected = this.allEntries.filter(e => this.selectedIds.has(e.id));
    this.dispatchEvent(
      new CustomEvent('lnode-picker-confirm', {
        bubbles: true,
        composed: true,
        detail: { selected },
      })
    );
    this.reset();
  }

  private handleCancel() {
    this.dispatchEvent(
      new CustomEvent('lnode-picker-cancel', {
        bubbles: true,
        composed: true,
      })
    );
    this.reset();
  }

  reset() {
    this.query = '';
    this.selectedIds = new Set();
  }

  private renderEntry(entry: LNodeTypeEntry) {
    const isExisting = this.existingIds.includes(entry.id);
    const isSelected = this.selectedIds.has(entry.id);

    function renderIcon() {
      if (isExisting) {
        return html`<oscd-icon slot="end" title="Already added"
          >check_circle</oscd-icon
        >`;
      }
      if (isSelected) {
        return html`<oscd-icon slot="end">check</oscd-icon>`;
      }
      return nothing;
    }

    return html`
      <oscd-list-item
        type="button"
        ?selected=${isSelected}
        ?disabled=${isExisting}
        @click=${() => this.handleToggle(entry.id)}
      >
        <span slot="headline">${entry.lnClass}</span>
        <span slot="supporting-text">${entry.desc ?? entry.id}</span>
        ${renderIcon()}
      </oscd-list-item>
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  private renderEmpty() {
    return html`
      <oscd-list-item type="text" noninteractive>
        <oscd-icon slot="start">search_off</oscd-icon>
        <span slot="headline">No LNode types match your search</span>
      </oscd-list-item>
    `;
  }

  render() {
    const entries = this.filteredEntries;
    const selectedCount = this.selectedIds.size;

    return html`
      <div class="picker">
        <div class="picker-header">
          <oscd-filled-text-field
            class="search-field"
            label="Search by class or description"
            .value=${this.query}
            @input=${this.handleSearchInput}
          >
            <oscd-icon slot="leading-icon">search</oscd-icon>
          </oscd-filled-text-field>
        </div>

        <oscd-list class="picker-list">
          ${entries.length > 0
            ? entries.map(e => this.renderEntry(e))
            : this.renderEmpty()}
        </oscd-list>

        <div class="picker-footer">
          <span class="selection-count">
            ${selectedCount > 0 ? html`${selectedCount} selected` : nothing}
          </span>
          <div class="footer-actions">
            <oscd-icon-button title="Cancel" @click=${this.handleCancel}>
              <oscd-icon>close</oscd-icon>
            </oscd-icon-button>
            <oscd-icon-button
              title="Confirm selection"
              ?disabled=${selectedCount === 0}
              @click=${this.handleConfirm}
            >
              <oscd-icon>check</oscd-icon>
            </oscd-icon-button>
          </div>
        </div>
      </div>
    `;
  }

  static readonly styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
      --md-icon-button-disabled-icon-color: var(
        --md-sys-color-on-surface,
        rgba(0, 0, 0, 0.38)
      );
    }

    .picker {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--md-sys-color-outline-variant, currentColor);
      border-radius: 12px;
      overflow: hidden;
      background: var(--md-sys-color-surface-container-high, #f7f2fa);
    }

    .picker-header {
      padding: 12px 12px 4px;
    }

    .search-field {
      display: block;
      width: 100%;
    }

    .picker-list {
      overflow-y: auto;
      max-height: 200px;
      --md-list-container-color: transparent;
    }

    oscd-list-item {
      --md-list-item-one-line-container-height: 40px;
      --md-list-item-two-line-container-height: 52px;
      --md-list-item-label-text-color: inherit;
      --md-list-item-supporting-text-color: inherit;
    }

    oscd-list-item[disabled] {
      opacity: 0.5;
    }

    .picker-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px 4px 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, currentColor);
      min-height: 48px;
    }

    .selection-count {
      font-size: 13px;
      color: inherit;
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `;
}
