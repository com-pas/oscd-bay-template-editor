import { LitElement } from 'lit';
declare const BayTemplatePlugin_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends BayTemplatePlugin_base {
    static scopedElements: {};
    /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
    doc: XMLDocument;
    /** SCL change indicator */
    editCount: number;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
