import { LitElement } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
export interface DeleteEventDetail<TItem> {
    item: TItem;
}
declare const EditList_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class EditList<TItem> extends EditList_base {
    static get scopedElements(): {
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
    };
    title: string;
    itemName: string;
    collapsed: boolean;
    items: TItem[];
    itemHeadline: (item: TItem) => string;
    itemSupportingText: (item: TItem) => string;
    selectedItem: TItem | null;
    toggleCollapse(): void;
    addItem(): void;
    deleteItem(): void;
    selectItem(item: TItem): void;
    renderContent(): import("lit-html").TemplateResult<1>;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
