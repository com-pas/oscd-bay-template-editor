import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';

export interface LNodeSelectionContext {
  functionElement: Element;
  subFunctionElement: Element | null;
  lNodeElement: Element;
}

export class FunctionContentPanel extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-list': OscdList,
      'oscd-list-item': OscdListItem,
      'oscd-icon': OscdIcon,
      'oscd-icon-button': OscdIconButton,
      'oscd-filled-button': OscdFilledButton,
    };
  }

  @property({ attribute: false })
  functionElement?: Element;

  @property({ attribute: false })
  selectingLinkSource = false;

  @state()
  private selectedLNode?: Element;

  @state()
  private selectedSubFunction: Element | null = null;

  @state()
  private resetLinkSelectionUi = false;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('functionElement')) {
      this.selectedLNode = undefined;
      this.selectedSubFunction = null;
      this.resetLinkSelectionUi = false;
    }

    if (changedProperties.has('selectingLinkSource')) {
      this.resetLinkSelectionUi = false;
    }
  }

  private getSubFunctions() {
    if (!this.functionElement) return [];
    return Array.from(
      this.functionElement.querySelectorAll(
        ':scope > SubFunction, :scope > EqSubFunction'
      )
    );
  }

  private getFunctionLNodes() {
    if (!this.functionElement) return [];
    return Array.from(this.functionElement.querySelectorAll(':scope > LNode'));
  }

  // eslint-disable-next-line class-methods-use-this
  private getLNodes(subFunction: Element) {
    return Array.from(subFunction.querySelectorAll(':scope > LNode'));
  }

  private isSelectedLNode(lnode: Element, subFunction: Element | null) {
    return (
      this.selectedLNode === lnode && this.selectedSubFunction === subFunction
    );
  }

  private selectLNode(lnode: Element, subFunction: Element | null) {
    const selectionChanged =
      this.selectedLNode !== lnode || this.selectedSubFunction !== subFunction;

    if (this.selectingLinkSource && selectionChanged && this.selectedLNode) {
      this.resetLinkSelectionUi = true;
      this.dispatchCancelCreateFunctionLink();
    }

    this.selectedLNode = lnode;
    this.selectedSubFunction = subFunction;
  }

  private dispatchCancelCreateFunctionLink() {
    this.dispatchEvent(
      new CustomEvent('cancel-create-function-link', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private dispatchStartCreateFunctionLink() {
    if (!this.functionElement || !this.selectedLNode) return;

    this.dispatchEvent(
      new CustomEvent<LNodeSelectionContext>('start-create-function-link', {
        detail: {
          functionElement: this.functionElement,
          subFunctionElement: this.selectedSubFunction,
          lNodeElement: this.selectedLNode,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleCreateFunctionLinkClick(e: Event) {
    e.stopPropagation();
    this.resetLinkSelectionUi = false;
    this.dispatchStartCreateFunctionLink();
  }

  private handleCancelFunctionLinkClick(e: Event) {
    e.stopPropagation();
    this.resetLinkSelectionUi = true;
    this.dispatchCancelCreateFunctionLink();
  }

  private handleCloseClick() {
    if (this.selectingLinkSource) {
      this.resetLinkSelectionUi = true;
      this.dispatchCancelCreateFunctionLink();
    }

    this.dispatchEvent(
      new CustomEvent('close', { bubbles: true, composed: true })
    );
  }

  private renderLNodeLinkActions() {
    const isSelectingLinkSource =
      this.selectingLinkSource &&
      !!this.selectedLNode &&
      !this.resetLinkSelectionUi;

    return html`
      <div class="lnode-actions">
        <oscd-filled-button
          disabled
          title="Incoming signals from outside Bay"
          data-testid="incoming-signal-btn"
          ><oscd-icon slot="icon">input</oscd-icon> In</oscd-filled-button
        >
        <oscd-filled-button
          disabled
          title="Outgoing signals outside Bay"
          data-testid="outgoing-signal-btn"
          ><oscd-icon slot="icon">output</oscd-icon> Out</oscd-filled-button
        >
        ${isSelectingLinkSource
          ? html` <oscd-filled-button
              @click=${this.handleCancelFunctionLinkClick}
              title="Cancel create function link"
              data-testid="cancel-create-function-link-btn"
              ><oscd-icon slot="icon">close</oscd-icon>
              Cancel</oscd-filled-button
            >`
          : html`<oscd-filled-button
              @click=${this.handleCreateFunctionLinkClick}
              title="Create Function link"
              data-testid="create-function-link-btn"
              ><oscd-icon slot="icon">add_link</oscd-icon>
              Link</oscd-filled-button
            >`}
      </div>
      ${isSelectingLinkSource
        ? html`
            <div class="link-source-hint" data-testid="link-source-hint">
              <oscd-icon class="link-source-hint-icon">ads_click</oscd-icon>
              <span>Select a source Function</span>
            </div>
          `
        : nothing}
    `;
  }

  render() {
    if (!this.functionElement) {
      return nothing;
    }
    const subFunctions = this.getSubFunctions();
    const functionLNodes = this.getFunctionLNodes();
    const name = this.functionElement.getAttribute('name') ?? '';
    const type = this.functionElement.getAttribute('type') ?? '';
    const isEmpty = subFunctions.length === 0 && functionLNodes.length === 0;

    return html`
      <div class="header">
        <oscd-icon class="header-icon">function</oscd-icon>
        <div class="header-text">
          <h3 title=${name}>${name}</h3>
          ${type ? html`<span class="type-badge">${type}</span>` : nothing}
        </div>
        <oscd-icon-button
          class="close-btn"
          @click=${this.handleCloseClick}
          title="Close"
        >
          <oscd-icon>close</oscd-icon>
        </oscd-icon-button>
      </div>

      <div class="content">
        ${isEmpty
          ? html`
              <div class="empty-state">
                <oscd-icon class="empty-icon">info</oscd-icon>
                <span>No SubFunctions or LNodes.</span>
              </div>
            `
          : nothing}
        ${subFunctions.length > 0
          ? html`
              <div class="section-label">SubFunctions</div>
              <oscd-list>
                ${subFunctions.map(subFn => {
                  const sfName = subFn.getAttribute('name') ?? '';
                  const sfDesc = subFn.getAttribute('desc') ?? '';
                  const lnodes = this.getLNodes(subFn);
                  return html`
                    <oscd-list-item>
                      <span slot="headline">${sfName}</span>
                      ${sfDesc
                        ? html`<span slot="supporting-text">${sfDesc}</span>`
                        : nothing}
                      ${lnodes.length > 0
                        ? html`
                            <div slot="supporting-text" class="lnode-chips">
                              ${lnodes.map(ln => {
                                const lnClass =
                                  ln.getAttribute('lnClass') || '';
                                const lnDesc = ln.getAttribute('desc') || '';
                                const isSelected = this.isSelectedLNode(
                                  ln,
                                  subFn
                                );

                                if (isSelected) {
                                  return html`
                                    <oscd-list-item
                                      type="button"
                                      @click=${() =>
                                        this.selectLNode(ln, subFn)}
                                      class="selected-lnode-item"
                                    >
                                      <span slot="headline" title=${lnClass}
                                        >${lnClass}</span
                                      >
                                      ${lnDesc
                                        ? html`<span slot="supporting-text"
                                            >${lnDesc}</span
                                          >`
                                        : nothing}
                                      <div
                                        slot="supporting-text"
                                        class="lnode-actions-wrapper"
                                      >
                                        ${this.renderLNodeLinkActions()}
                                      </div>
                                    </oscd-list-item>
                                  `;
                                }

                                return html`
                                  <oscd-list-item
                                    type="button"
                                    @click=${() => this.selectLNode(ln, subFn)}
                                  >
                                    <span slot="headline" title=${lnClass}
                                      >${lnClass}</span
                                    >
                                    ${lnDesc
                                      ? html`<span slot="supporting-text"
                                          >${lnDesc}</span
                                        >`
                                      : nothing}
                                  </oscd-list-item>
                                `;
                              })}
                            </div>
                          `
                        : nothing}
                    </oscd-list-item>
                  `;
                })}
              </oscd-list>
            `
          : nothing}
        ${functionLNodes.length > 0
          ? html`
              <div class="section-label">LNodes</div>
              <oscd-list>
                ${functionLNodes.map(ln => {
                  const desc = ln.getAttribute('desc') || '';
                  const lnClass = ln.getAttribute('lnClass') || '';
                  const isSelected = this.isSelectedLNode(ln, null);
                  return html`
                    <oscd-list-item
                      type="button"
                      @click=${() => this.selectLNode(ln, null)}
                      class=${isSelected ? 'selected-lnode-item' : ''}
                    >
                      <span slot="headline" title=${lnClass}>${lnClass}</span>
                      ${desc
                        ? html`<span slot="supporting-text">${desc}</span>`
                        : nothing}
                      ${isSelected
                        ? html`<div
                            slot="supporting-text"
                            class="lnode-actions-wrapper"
                          >
                            ${this.renderLNodeLinkActions()}
                          </div>`
                        : nothing}
                    </oscd-list-item>
                  `;
                })}
              </oscd-list>
            `
          : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--oscd-base3);
      border-left: 1px solid var(--md-sys-color-outline-variant, #ddd);
      margin-top: 33px;
      width: 350px;
      min-height: 100%;
      overflow: hidden;
      box-shadow: -2px 0 8px var(--md-sys-color-shadow, #0002);
      font-family: Roboto, Arial, sans-serif;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 0.75rem 0.75rem 1rem;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      flex-shrink: 0;
    }

    .header-icon {
      color: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
    }

    .header-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    h3 {
      font-size: 1rem;
      font-weight: 500;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .type-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-radius: 4px;
      padding: 1px 6px;
      letter-spacing: 0.02em;
    }

    .close-btn {
      flex-shrink: 0;
    }

    .content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      scrollbar-width: thin;
    }

    .content::-webkit-scrollbar {
      width: 6px;
    }

    .content::-webkit-scrollbar-thumb {
      border-radius: 3px;
      background: var(--md-sys-color-outline-variant, #ccc);
    }

    .content::-webkit-scrollbar-track {
      background: transparent;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin: 2rem auto;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.875rem;
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 0.5rem 0.25rem 0.125rem;
    }

    oscd-list {
      --md-list-container-color: transparent;
      padding: 0;
      margin-bottom: 0.25rem;
    }

    oscd-list-item {
      box-sizing: border-box;
      border: 1px solid var(--md-sys-color-outline-variant, #cad4d9);
      border-radius: 8px;
      margin-bottom: 0.35rem;
    }

    .lnode-chips {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: 6px;
    }

    .lnode-chip {
      display: flex;
      flex-direction: column;
      gap: 1px;
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-radius: 6px;
      padding: 5px 10px;
      overflow: hidden;
    }

    oscd-list-item.selected-lnode-item {
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      --md-list-item-hover-state-layer-opacity: 0;
      --md-list-item-pressed-state-layer-opacity: 0;
    }

    .lnode-actions-wrapper {
      margin-top: 6px;
    }

    .lnode-actions {
      display: flex;
      gap: 6px;
      margin-top: 2px;
      align-items: center;
      flex-wrap: wrap;
    }

    .lnode-actions oscd-filled-button {
      --md-filled-button-container-height: 32px;
      --md-filled-button-label-text-size: 0.8125rem;
      --md-filled-button-trailing-space: 14px;
      --md-filled-button-with-leading-icon-leading-space: 12px;
      --md-filled-button-with-leading-icon-trailing-space: 14px;
    }

    .lnode-actions oscd-icon-button {
      --md-icon-button-icon-size: 20px;
      flex-shrink: 0;
    }

    .link-source-hint {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      padding: 8px 14px;
      border-radius: 16px;
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.25rem;
      box-sizing: border-box;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .link-source-hint-icon {
      flex-shrink: 0;
      font-size: 1.25rem;
    }
  `;
}
