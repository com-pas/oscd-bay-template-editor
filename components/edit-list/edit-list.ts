import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';

export interface DeleteEventDetail<TItem> {
  item: TItem;
}

export class EditList<TItem> extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-icon': OscdIcon,
      'oscd-icon-button': OscdIconButton,
      'oscd-list': OscdList,
      'oscd-list-item': OscdListItem,
    };
  }

  @property({ type: String })
  title = '';

  @property({ type: String })
  itemName = '';

  @property({ type: Boolean })
  collapsed = false;

  @property({ type: Array })
  items: TItem[] = [];

  // eslint-disable-next-line class-methods-use-this
  @property({ type: Function })
  itemHeadline: (item: TItem) => string = _item => '';

  // eslint-disable-next-line class-methods-use-this
  @property({ type: Function })
  itemSupportingText: (item: TItem) => string = _item => '';

  @state()
  selectedItem: TItem | null = null;

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  addItem() {
    this.dispatchEvent(new CustomEvent('add-item'));
  }

  deleteItem() {
    if (this.selectedItem === null) {
      throw new Error('Delete item triggered without a selected item');
    }

    this.dispatchEvent(
      new CustomEvent<DeleteEventDetail<TItem>>('delete-item', {
        detail: { item: this.selectedItem },
      })
    );
  }

  selectIndex(item: TItem) {
    this.selectedItem = item;
  }

  renderContent() {
    const isEmpty = this.items.length === 0;

    return html`
      <oscd-list>
        ${isEmpty
          ? html`<oscd-list-item type="text">
              <oscd-icon slot="start">info</oscd-icon>
              <span slot="headline">Click + to add a ${this.itemName}</span>
            </oscd-list-item>`
          : this.items.map(
              item => html`
                <oscd-list-item
                  type="button"
                  class="${this.selectedItem === item ? 'selected' : ''}"
                  @click=${() => this.selectIndex(item)}
                >
                  <span slot="headline">${this.itemHeadline(item)}</span>
                  <span slot="supporting-text"
                    >${this.itemSupportingText(item)}</span
                  >
                  ${this.selectedItem === item
                    ? html`<oscd-icon slot="end">check</oscd-icon>`
                    : nothing}
                </oscd-list-item>
              `
            )}
      </oscd-list>
    `;
  }

  render() {
    return html`
      <div class="header">
        <h4 class="title">
          <oscd-icon-button
            class="collapse-btn"
            title=${this.title}
            @click=${this.toggleCollapse}
          >
            <oscd-icon
              >${this.collapsed ? 'chevron_right' : 'expand_more'}</oscd-icon
            >
          </oscd-icon-button>
          ${this.title}
          ${this.items.length > 0
            ? html`<span class="count-badge">${this.items.length}</span>`
            : nothing}
        </h4>
        <div class="button-group">
          <oscd-icon-button
            title="Delete"
            ?disabled=${this.selectedItem === null}
            data-testid="delete-subfunction-button"
            @click=${this.deleteItem}
          >
            <oscd-icon>remove</oscd-icon>
          </oscd-icon-button>
          <oscd-icon-button title="Add" @click=${this.addItem}>
            <oscd-icon>add</oscd-icon>
          </oscd-icon-button>
        </div>
      </div>
      ${this.collapsed ? nothing : this.renderContent()}
    `;
  }

  static readonly styles = css`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 2px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }

    .collapse-btn {
      margin-left: -8px;
    }

    .count-badge {
      font-size: 13px;
      font-weight: 400;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-left: 4px;
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
  `;
}
