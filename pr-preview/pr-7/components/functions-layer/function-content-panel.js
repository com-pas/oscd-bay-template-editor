import { __decorate } from "tslib";
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
/**
 * Displays the structure of a Function element: SubFunctions and LNodes.
 * Usage: <function-content-panel .functionElement=${Element}>
 */
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
        return html `
      <div class="panel">
        <div class="header">
          <oscd-icon>function</oscd-icon>
          <h3>${this.functionElement.getAttribute('name') ?? ''}</h3>
          <oscd-icon-button
            class="close-btn"
            @click=${() => this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }))}
            title="Close"
          >
            <oscd-icon>close</oscd-icon>
          </oscd-icon-button>
        </div>
        <oscd-list>
          ${subFunctions.length === 0 && functionLNodes.length === 0
            ? html `<oscd-list-item type="button"
                ><span slot="supporting-text" disabled
                  >No SubFunctions or LNodes.</span
                ></oscd-list-item
              >`
            : nothing}
          ${subFunctions.map(subFn => {
            const name = subFn.getAttribute('name') ?? '';
            const desc = subFn.getAttribute('desc') ?? '';
            const lnodes = this.getLNodes(subFn);
            return html `
              <oscd-list-item type="button">
                <span slot="headline">${name}</span>
                ${desc
                ? html `<span slot="supporting-text">${desc}</span>`
                : nothing}
                ${lnodes.length > 0
                ? html `<oscd-list slot="supporting-text">
                      ${lnodes.map(ln => {
                    const id = ln.getAttribute('id') || '';
                    const lnClass = ln.getAttribute('lnClass') || '';
                    return html `
                          <oscd-list-item type="button" class="ln-item">
                            <span slot="headline" title=${id}
                              >${id || lnClass}</span
                            >
                          </oscd-list-item>
                        `;
                })}
                    </oscd-list>`
                : nothing}
              </oscd-list-item>
            `;
        })}
          ${functionLNodes.map(ln => {
            const id = ln.getAttribute('id') || '';
            const desc = ln.getAttribute('desc') || '';
            const lnClass = ln.getAttribute('lnClass') || '';
            return html `
              <oscd-list-item type="button">
                <span slot="headline" title=${id}>${id || lnClass}</span>
                <span slot="supporting-text">${desc}</span>
              </oscd-list-item>
            `;
        })}
        </oscd-list>
      </div>
    `;
    }
}
FunctionContentPanel.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      background: var(--oscd-base3);
      border-left: 1px solid #ddd;
      margin-top: 33px;
      width: 330px;
      height: 100%;
      overflow: hidden;
      box-shadow: 0 0 8px #0001;
      font-family: Roboto, Arial, sans-serif;
    }
    .panel {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      padding: 1rem;
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    h3 {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
      flex: 1;
    }
    .close-btn {
      margin-left: auto;
    }
    oscd-list {
      flex: 1 1 auto;
      min-height: 0;
      gap: 0.5rem;
      overflow-y: auto;
      scrollbar-width: thin;
      padding: 0;
      --md-list-container-color: transparent;
    }
    oscd-list::-webkit-scrollbar {
      width: 8px;
    }
    oscd-list::-webkit-scrollbar-thumb {
      border-radius: 4px;
    }
    oscd-list::-webkit-scrollbar-track {
      background: transparent;
    }
    oscd-list-item {
      box-sizing: border-box;
      border: 1px solid var(--md-sys-color-outline, #ccc);
      border-radius: 8px;
    }
    .ln-item {
      background-color: var(--oscd-base2);
    }
  `;
__decorate([
    property({ attribute: false })
], FunctionContentPanel.prototype, "functionElement", void 0);
//# sourceMappingURL=function-content-panel.js.map