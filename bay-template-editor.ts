/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends LitElement {
  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ type: Number })
  editCount = 0;

  @property({ type: Number })
  docVersion: number = -1;

  render() {
    return html` <h1>Bay Template Editor Plugin</h1> `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: var(--oscd-theme-text-font, 'Roboto'), sans-serif;
    }

    h1 {
      color: var(--oscd-theme-primary, #2aa198);
      font-size: 2rem;
      font-weight: 300;
      margin: 0;
    }
  `;
}
