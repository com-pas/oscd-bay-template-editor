import { getReference } from '@openscd/scl-lib';
export const privType = 'OpenSCD-SLD-Layout';
export const sldNs = 'https://openscd.org/SCL/SSD/SLD/v0';
export const xmlnsNs = 'http://www.w3.org/2000/xmlns/';
export const svgNs = 'http://www.w3.org/2000/svg';
export const xlinkNs = 'http://www.w3.org/1999/xlink';
export const eqTypes = [
    'CAB',
    'CAP',
    'CBR',
    'CTR',
    'DIS',
    'GEN',
    'IFL',
    'LIN',
    'MOT',
    'REA',
    'RES',
    'SAR',
    'SMC',
    'VTR',
];
export function isEqType(str) {
    return eqTypes.includes(str);
}
export const ringedEqTypes = new Set(['GEN', 'MOT', 'SMC']);
export const singleTerminal = new Set([
    'BAT',
    'EFN',
    'FAN',
    'GEN',
    'IFL',
    'MOT',
    'PMP',
    'RRC',
    'SAR',
    'SMC',
    'VTR',
]);
function sections(element) {
    return Array.from(element.querySelectorAll(`:scope Private[type="${privType}"] > Section`));
}
function sldAttributes(element, nsPrefix) {
    const sldAttrs = element.querySelector(`:scope > Private[type="${privType}"] > SLDAttributes`);
    if (sldAttrs)
        return sldAttrs;
    if (!nsPrefix)
        return null;
    const priv = element.ownerDocument.createElement('Private');
    priv.setAttribute('type', privType);
    element.insertBefore(priv, getReference(element, 'Private'));
    const sldAttrsNew = element.ownerDocument.createElementNS(sldNs, `${nsPrefix}:SLDAttributes`);
    priv.insertBefore(sldAttrsNew, null);
    return sldAttrsNew;
}
export function setSLDAttributes(element, nsPrefix, values) {
    const isSectionOrVertex = ['Section', 'Vertex'].includes(element.localName);
    if (isSectionOrVertex) {
        Object.entries(values).forEach(([key, value]) => {
            element.setAttributeNS(sldNs, `${nsPrefix}:${key}`, value);
        });
    }
    else {
        Object.entries(values).forEach(([key, value]) => sldAttributes(element, nsPrefix)?.setAttributeNS(sldNs, `${nsPrefix}:${key}`, value));
    }
}
export function getSLDAttributes(element, key) {
    const isSecOrVert = ['Section', 'Vertex'].includes(element.localName);
    if (isSecOrVert)
        return element.getAttributeNS(sldNs, key);
    return sldAttributes(element)?.getAttributeNS(sldNs, key) ?? null;
}
export function updateSLDAttributes(element, nsPrefix, values) {
    const isSecOrVert = ['Section', 'Vertex'].includes(element.localName);
    const toBeUpdated = isSecOrVert ? element : sldAttributes(element, nsPrefix);
    return {
        element: toBeUpdated,
        attributesNS: {
            [sldNs]: Object.fromEntries(Object.entries(values).map(([key, value]) => [
                `${nsPrefix}:${key}`,
                value,
            ])),
        },
    };
}
export function busSections(element) {
    return sections(element).filter(section => getSLDAttributes(section, 'bus') === 'true');
}
function containsBusSection(element) {
    return busSections(element).length > 0;
}
export function isBusBar(element) {
    return element.tagName === 'Bay' && containsBusSection(element);
}
export function makeBusBar(doc, nsp) {
    const busBar = doc.createElementNS(doc.documentElement.namespaceURI, 'Bay');
    busBar.setAttribute('name', 'BB1');
    setSLDAttributes(busBar, nsp, { w: '2' });
    const cNode = doc.createElementNS(doc.documentElement.namespaceURI, 'ConnectivityNode');
    cNode.setAttribute('name', 'L');
    const priv = doc.createElementNS(doc.documentElement.namespaceURI, 'Private');
    priv.setAttribute('type', privType);
    const section = doc.createElementNS(sldNs, `${nsp}:Section`);
    setSLDAttributes(section, nsp, { bus: 'true' });
    const v1 = doc.createElementNS(sldNs, `${nsp}:Vertex`);
    setSLDAttributes(v1, nsp, { x: '0.5', y: '0.5' });
    section.appendChild(v1);
    const v2 = doc.createElementNS(sldNs, `${nsp}:Vertex`);
    setSLDAttributes(v2, nsp, { x: '1.5', y: '0.5' });
    section.appendChild(v2);
    priv.appendChild(section);
    cNode.appendChild(priv);
    busBar.appendChild(cNode);
    return busBar;
}
export function uniqueName(element, parent) {
    const children = Array.from(parent.children);
    const oldName = element.getAttribute('name');
    if (oldName &&
        !children.find(child => child.getAttribute('name') === oldName))
        return oldName;
    const baseName = element.getAttribute('name')?.replace(/[0-9]*$/, '') ??
        element.getAttribute('type') ??
        element.tagName.charAt(0);
    let index = 1;
    function hasName(child) {
        return child.getAttribute('name') === baseName + index.toString();
    }
    while (children.find(hasName))
        index += 1;
    return baseName + index.toString();
}
//# sourceMappingURL=util.js.map