import { LitElement } from 'lit';
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
declare const LNodePicker_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
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
export declare class LNodePicker extends LNodePicker_base {
    static get scopedElements(): {
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-filled-text-field': typeof OscdFilledTextField;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
    };
    library: Document | Element | null;
    existingIds: string[];
    private query;
    private selectedIds;
    private entriesCache;
    private get allEntries();
    private parseEntries;
    private get filteredEntries();
    private handleSearchInput;
    private handleToggle;
    private handleConfirm;
    private handleCancel;
    reset(): void;
    private renderEntry;
    private renderEmpty;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
