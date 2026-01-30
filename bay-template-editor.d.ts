import { LitElement } from 'lit';
/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends LitElement {
    doc: XMLDocument;
    editCount: number;
    docVersion: number;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
