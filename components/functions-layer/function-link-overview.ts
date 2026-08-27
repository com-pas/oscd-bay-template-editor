import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import {
  buildSourceRefDisplay,
  buildSourceRefKey,
  type FunctionLink,
} from './function-links.js';

export class FunctionLinkOverview extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-icon': OscdIcon,
      'oscd-filled-button': OscdFilledButton,
      'oscd-icon-button': OscdIconButton,
    };
  }

  @property({ attribute: false })
  selectedLink?: FunctionLink;

  @property({ type: Boolean })
  expandedDetails = true;

  @property({ type: Boolean })
  pendingDelete = false;

  @property({ type: Number })
  overviewTop?: number;

  @property({ attribute: false })
  pendingRemovedSourceRefKeys: string[] = [];

  private hasPendingSourceRefDeletion(sourceRef: Element): boolean {
    return this.pendingRemovedSourceRefKeys.includes(
      buildSourceRefKey(sourceRef)
    );
  }

  private getVisibleSourceRefs(sourceRefs: Element[]): Element[] {
    return sourceRefs.filter(
      sourceRef => !this.hasPendingSourceRefDeletion(sourceRef)
    );
  }

  private renderDeleteWarning() {
    const sourceName = this.selectedLink?.sourceFunction.getAttribute('name');
    const sinkName = this.selectedLink?.sinkFunction.getAttribute('name');

    return html`
      <div
        class="link-overview-warning"
        data-testid="link-overview-delete-warning"
      >
        <div class="link-overview-warning-badge">
          <oscd-icon class="link-overview-warning-icon">warning</oscd-icon>
        </div>
        <p class="link-overview-warning-headline">This will delete the link</p>
        <p class="link-overview-warning-body">
          All source references between <strong>${sourceName}</strong> and
          <strong>${sinkName}</strong> have been removed. Saving now will delete
          the link entirely.
        </p>
      </div>
    `;
  }

  private renderSelectedLink() {
    const { selectedLink } = this;
    if (!selectedLink || this.pendingDelete) return this.renderDeleteWarning();

    const visibleSourceRefs = this.getVisibleSourceRefs(
      selectedLink.sourceRefs
    );

    return html`<div class="link-overview-item">
      <div class="link-overview-item-main" data-testid="link-level-1-row">
        <button
          class="link-overview-source-button"
          type="button"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('toggle-details', {
                bubbles: true,
                composed: true,
              })
            )}
          title="Toggle source references"
        >
          <oscd-icon class="link-overview-expand-icon"
            >${this.expandedDetails
              ? 'expand_more'
              : 'chevron_right'}</oscd-icon
          >
          <span class="link-overview-title"
            >${selectedLink.sourceFunction.getAttribute('name')}</span
          >
        </button>
        <span class="link-overview-service">${selectedLink.service}</span>
        <span class="link-overview-description"
          >${selectedLink.sourceFunction.getAttribute('desc') ?? ''}</span
        >
        <div class="link-overview-actions-cell" aria-label="Link actions">
          <oscd-icon-button
            class="link-overview-row-action"
            title="Delete link"
            data-testid="main-row-delete-button"
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('delete-link', {
                  bubbles: true,
                  composed: true,
                })
              )}
          >
            <oscd-icon>delete</oscd-icon>
          </oscd-icon-button>
        </div>
      </div>
      ${this.expandedDetails
        ? html`<div class="link-overview-details" data-testid="link-details">
            ${visibleSourceRefs.map(
              sourceRef => html`<div
                class="link-overview-detail-row"
                data-testid="link-level-2-row"
              >
                <span class="link-overview-detail-ref"
                  >${buildSourceRefDisplay(sourceRef)}</span
                >
                <span class="link-overview-detail-service"
                  >${selectedLink.service}</span
                >
                <span class="link-overview-detail-description"></span>
                <div
                  class="link-overview-actions-cell"
                  aria-label="Data reference actions"
                >
                  <oscd-icon-button
                    class="link-overview-row-action"
                    title="Reference info"
                    data-testid="detail-row-info-button"
                  >
                    <oscd-icon>info</oscd-icon>
                  </oscd-icon-button>
                  <oscd-icon-button
                    class="link-overview-row-action"
                    title="Delete data reference"
                    data-testid="detail-row-delete-button"
                    @click=${() =>
                      this.dispatchEvent(
                        new CustomEvent('delete-source-ref', {
                          bubbles: true,
                          composed: true,
                          detail: sourceRef,
                        })
                      )}
                  >
                    <oscd-icon>delete</oscd-icon>
                  </oscd-icon-button>
                </div>
              </div>`
            )}
          </div>`
        : nothing}
    </div>`;
  }

  render() {
    if (!this.selectedLink) return nothing;

    return html`
      <div
        class="link-overview"
        data-testid="function-link-overview"
        style=${this.overviewTop === undefined
          ? ''
          : `top: ${this.overviewTop}px; bottom: auto;`}
      >
        <div class="link-overview-list">
          <div
            class="link-overview-columns"
            data-testid="link-overview-columns"
          >
            <span>Source</span>
            <span>Service</span>
            <span>Description</span>
            <span class="link-overview-actions-cell"> </span>
          </div>
          ${this.renderSelectedLink()}
        </div>
        <div class="link-overview-footer">
          <oscd-filled-button
            data-testid="link-overview-cancel-button"
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('close', {
                  bubbles: true,
                  composed: true,
                })
              )}
          >
            Cancel
          </oscd-filled-button>
          <oscd-filled-button
            data-testid="link-overview-save-button"
            class=${this.pendingDelete ? 'link-overview-danger-button' : ''}
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('save', {
                  bubbles: true,
                  composed: true,
                })
              )}
          >
            ${this.pendingDelete ? 'Delete link' : 'Save'}
          </oscd-filled-button>
        </div>
      </div>
    `;
  }

  static styles = css`
    .link-overview {
      --link-overview-cols: minmax(0, 1fr) 150px minmax(0, 1fr) auto;
      position: absolute;
      left: 16px;
      right: 16px;
      bottom: 8px;
      max-width: 1000px;
      pointer-events: auto;
      z-index: 4;
      background: #fff;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
      max-height: 280px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .link-overview-row-action oscd-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .link-overview-list {
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
    .link-overview-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 14px 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #e5dfe8);
      background: #fff;
    }
    .link-overview-columns,
    .link-overview-item-main,
    .link-overview-detail-row {
      display: grid;
      grid-template-columns: var(--link-overview-cols);
      gap: 12px;
      align-items: center;
    }
    .link-overview-columns {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      background: #fff;
      padding: 8px 14px;
      position: sticky;
      top: 0;
      z-index: 1;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #e5dfe8);
    }
    .link-overview-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #e5dfe8);
    }
    .link-overview-source-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 0;
      background: transparent;
      font: inherit;
      padding: 0;
      cursor: pointer;
      min-width: 0;
      justify-self: start;
    }
    .link-overview-title,
    .link-overview-description,
    .link-overview-detail-ref {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .link-overview-title {
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }
    .link-overview-expand-icon {
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .link-overview-service,
    .link-overview-description,
    .link-overview-detail-service,
    .link-overview-detail-description {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #6a656f);
    }
    .link-overview-actions-cell {
      width: 80px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex: none;
      justify-self: flex-end;
      justify-content: flex-end;
    }
    .link-overview-details {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-left: 0;
    }
    .link-overview-detail-row {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #6a656f);
      padding: 7px 0;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    .link-overview-detail-row:first-child {
      border-top: none;
    }
    .link-overview-detail-ref {
      color: var(--md-sys-color-on-surface, #1d1b20);
      padding-left: 24px;
    }
    .link-overview-detail-description {
      min-height: 1em;
    }
    .link-overview-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      padding: 28px 24px;
    }
    .link-overview-warning-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--md-sys-color-warning-container, #fbe6c8);
      margin-bottom: 4px;
    }
    .link-overview-warning-icon {
      color: var(--md-sys-color-on-warning-container, #b06a00);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .link-overview-warning-headline {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }
    .link-overview-warning-body {
      margin: 0;
      max-width: 520px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #6a656f);
    }
    .link-overview-danger-button {
      --md-filled-button-container-color: var(--md-sys-color-error, #b3261e);
      --md-filled-button-label-text-color: var(
        --md-sys-color-on-error,
        #ffffff
      );
      --md-filled-button-hover-container-color: var(
        --md-sys-color-error,
        #b3261e
      );
    }
  `;
}
