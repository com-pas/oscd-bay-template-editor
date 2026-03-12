import { __decorate } from "tslib";
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
export class FunctionContentPanel extends ScopedElementsMixin(LitElement) {
    static get scopedElements() {
        return {
            'oscd-list': OscdList,
            'oscd-list-item': OscdListItem,
            'oscd-icon': OscdIcon,
            'oscd-icon-button': OscdIconButton,
        };
    }
    getSubFunctions() {
        if (!this.functionElement)
            return [];
        return Array.from(this.functionElement.querySelectorAll(':scope > SubFunction'));
    }
    getFunctionLNodes() {
        if (!this.functionElement)
            return [];
        return Array.from(this.functionElement.querySelectorAll(':scope > LNode'));
    }
    // eslint-disable-next-line class-methods-use-this
    getLNodes(subFunction) {
        return Array.from(subFunction.querySelectorAll(':scope > LNode'));
    }
    render() {
        if (!this.functionElement) {
            return nothing;
        }
        const subFunctions = this.getSubFunctions();
        const functionLNodes = this.getFunctionLNodes();
        const name = this.functionElement.getAttribute('name') ?? '';
        const type = this.functionElement.getAttribute('type') ?? '';
        const hasBoth = subFunctions.length > 0 && functionLNodes.length > 0;
        const isEmpty = subFunctions.length === 0 && functionLNodes.length === 0;
        return html `
      <div class="header">
        <oscd-icon class="header-icon">function</oscd-icon>
        <div class="header-text">
          <h3 title=${name}>${name}</h3>
          ${type ? html `<span class="type-badge">${type}</span>` : nothing}
        </div>
        <oscd-icon-button
          class="close-btn"
          @click=${() => this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }))}
          title="Close"
        >
          <oscd-icon>close</oscd-icon>
        </oscd-icon-button>
      </div>

      <div class="content">
        ${isEmpty
            ? html `
              <div class="empty-state">
                <oscd-icon class="empty-icon">info</oscd-icon>
                <span>No SubFunctions or LNodes.</span>
              </div>
            `
            : nothing}
        ${subFunctions.length > 0
            ? html `
              ${hasBoth
                ? html `<div class="section-label">SubFunctions</div>`
                : nothing}
              <oscd-list>
                ${subFunctions.map(subFn => {
                const sfName = subFn.getAttribute('name') ?? '';
                const sfDesc = subFn.getAttribute('desc') ?? '';
                const lnodes = this.getLNodes(subFn);
                return html `
                    <oscd-list-item type="button">
                      <span slot="headline">${sfName}</span>
                      ${sfDesc
                    ? html `<span slot="supporting-text">${sfDesc}</span>`
                    : nothing}
                      ${lnodes.length > 0
                    ? html `
                            <div slot="supporting-text" class="lnode-chips">
                              ${lnodes.map(ln => {
                        const lnClass = ln.getAttribute('lnClass') || '';
                        const lnDesc = ln.getAttribute('desc') || '';
                        return html `<span
                                  class="lnode-chip"
                                  title=${lnClass}
                                >
                                  <span class="lnode-chip-label"
                                    >${lnClass}</span
                                  >
                                  ${lnDesc
                            ? html `<span class="lnode-chip-desc"
                                        >${lnDesc}</span
                                      >`
                            : nothing}
                                </span>`;
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
            ? html `
              ${hasBoth
                ? html `<div class="section-label">LNodes</div>`
                : nothing}
              <oscd-list>
                ${functionLNodes.map(ln => {
                const desc = ln.getAttribute('desc') || '';
                const lnClass = ln.getAttribute('lnClass') || '';
                return html `
                    <oscd-list-item type="button">
                      <span slot="headline" title=${lnClass}>${lnClass}</span>
                      ${desc
                    ? html `<span slot="supporting-text">${desc}</span>`
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
}
FunctionContentPanel.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      background: var(--oscd-base3);
      border-left: 1px solid var(--md-sys-color-outline-variant, #ddd);
      margin-top: 33px;
      width: 330px;
      height: 100%;
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

    .lnode-chip-label {
      font-size: 0.82rem;
      font-weight: 500;
      font-family: 'Roboto Mono', 'Consolas', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lnode-chip-desc {
      font-size: 0.75rem;
      font-family: Roboto, Arial, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
__decorate([
    property({ attribute: false })
], FunctionContentPanel.prototype, "functionElement", void 0);
//# sourceMappingURL=function-content-panel.js.map