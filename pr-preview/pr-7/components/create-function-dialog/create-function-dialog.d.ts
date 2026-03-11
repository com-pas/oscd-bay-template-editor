import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';
declare const CreateFunctionDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class CreateFunctionDialog extends CreateFunctionDialog_base {
    static get scopedElements(): {
        'oscd-dialog': typeof OscdDialog;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-filled-text-field': typeof OscdFilledTextField;
        'oscd-scl-text-field': typeof OscdSclTextField;
    };
    parent: Element | null;
    dialog: OscdDialog;
    nameField: OscdFilledTextField;
    descriptionField: OscdSclTextField;
    typeField: OscdSclTextField;
    name: string;
    description: null;
    type: null;
    private formGroup;
    show(): void;
    close(): void;
    cancel(): void;
    reset(): void;
    private nameTakenValidator;
    private handleSubmit;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
