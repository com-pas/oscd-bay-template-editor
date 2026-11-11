/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import { fixture, expect, waitUntil } from '@open-wc/testing';
import { spy } from 'sinon';
import type { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import type { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import type { OscdOutlinedSelect } from '@omicronenergy/oscd-ui/select/OscdOutlinedSelect.js';
import { AddInputDialog } from './add-input-dialog.js';
import type { SaveInputDetail } from './add-input-dialog.js';
import { eTr6100Ns } from '../../util.js';

if (!customElements.get('add-input-dialog')) {
  customElements.define('add-input-dialog', AddInputDialog);
}

describe('AddInputDialog', () => {
  describe('input fields', () => {
    let element: AddInputDialog;
    let doc: XMLDocument;

    beforeEach(async () => {
      element = await fixture<AddInputDialog>(
        html`<add-input-dialog></add-input-dialog>`
      );
      doc = new DOMParser().parseFromString(
        '<SCL><Substation name="S1"><VoltageLevel name="V1"><Bay name="B1"><Function name="F1"><LNode lnClass="PTOC"/></Function></Bay><Bay name="B2"/></VoltageLevel></Substation></SCL>',
        'application/xml'
      );
      element.showForLNode({
        functionElement: doc.querySelector('Function')!,
        subFunctionElement: null,
        lNodeElement: doc.querySelector('LNode')!,
      });
      await element.updateComplete;
      await waitUntil(() => element.open);
    });

    afterEach(async () => {
      element.close();
      await waitUntil(() => !element.open);
    });

    function field(name: string) {
      return element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        `[name="${name}"]`
      )!;
    }

    function button(testId: string) {
      return element.shadowRoot!.querySelector<OscdFilledButton>(
        `[data-testid="${testId}"]`
      )!;
    }

    async function enter(name: string, value: string) {
      field(name).value = value;
      field(name).dispatchEvent(new Event('input'));
      await element.updateComplete;
    }

    function selectField(name: string) {
      return element.shadowRoot!.querySelector<OscdOutlinedSelect>(
        `[name="${name}"]`
      )!;
    }

    async function selectValue(name: string, value: string) {
      const select = selectField(name);
      select.value = value;
      await select.updateComplete;
      select.dispatchEvent(new Event('change'));
      await element.updateComplete;
    }

    async function chooseObject() {
      const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
        '[data-testid="source-class"]'
      )!;
      await selectValue(
        'dataObject',
        source.value === 'TCTR' ? 'AmpSv' : 'Pos'
      );
    }

    async function selectClass(value: string) {
      const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
        '[data-testid="source-class"]'
      )!;
      select.value = value;
      await select.updateComplete;
      select.dispatchEvent(new Event('change'));
      await element.updateComplete;
    }

    function errors() {
      return element.shadowRoot!.querySelector(
        '[data-testid="validation-errors"]'
      )?.textContent;
    }

    it('shows required-field reasons and blocks Save until every required field is present', async () => {
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      expect(field('resourceName').error).to.be.false;
      expect(selectField('dataObject').error).to.be.false;
      expect(errors()).to.include(
        'Still needed: Resource name, Data object, Input name'
      );
      expect(button('save-button').disabled).to.be.true;
      button('save-button').dispatchEvent(new MouseEvent('click'));
      expect(saveSpy.called).to.be.false;
      expect(field('resourceName').error).to.be.true;
      expect(field('resourceName').errorText).to.equal(
        'Resource name is required.'
      );
      expect(selectField('dataObject').error).to.be.true;
      expect(errors()).to.include(
        'Still needed: Resource name, Data object, Input name'
      );
      expect(selectField('dataAttribute').disabled).to.be.true;

      await enter('resourceName', '   ');
      expect(errors()).to.include('Resource name');
      await enter('resourceName', 'BreakerPosition');
      expect(button('save-button').disabled).to.be.true;
      await chooseObject();
      expect(field('inputName').value).to.equal('Pos');
      expect(button('save-button').disabled).to.be.false;
      expect(field('resourceName').error).to.be.false;
      expect(selectField('dataObject').error).to.be.false;
      expect(errors()).to.be.undefined;

      await enter('inputName', ' ');
      expect(button('save-button').disabled).to.be.true;
      expect(errors()).to.include('Still needed: Input name');
      await enter('inputName', 'BreakerPos');
      expect(button('save-button').disabled).to.be.false;
      await enter('resourceName', '');
      expect(button('save-button').disabled).to.be.true;
    });

    it('shows the source-to-sink preview and locked scope for the selected LNode', async () => {
      const preview = (testId: string) =>
        element.shadowRoot!.querySelector(`[data-testid="${testId}"]`)!;
      expect(preview('source-preview').textContent).to.include('XCBR');
      expect(
        preview('source-preview').textContent?.replace(/\s+/g, ' ')
      ).to.include('in another bay of V1');
      expect(preview('sink-preview').textContent).to.include('PTOC');
      expect(preview('sink-preview').textContent).to.include(
        'S1 › V1 › B1 › F1'
      );
      expect(
        preview('search-scope').textContent?.replace(/\s+/g, ' ')
      ).to.include('Voltage Level V1');
      expect(selectField('dataAttribute').disabled).to.be.true;
      expect(selectField('dataAttribute').textContent).to.include(
        'Pick a data object first'
      );

      await selectClass('TCTR');
      expect(preview('source-preview').textContent).to.include('TCTR');
      await chooseObject();
      expect(selectField('dataAttribute').disabled).to.be.false;
      expect(selectField('dataAttribute').textContent).to.include(
        'No data attribute'
      );
      await selectClass('XCBR');
      expect(selectField('dataAttribute').disabled).to.be.true;
    });

    it('renders Input name help outside the white text-field background', () => {
      const help =
        element.shadowRoot!.querySelector<HTMLElement>('#input-name-help')!;
      expect(help.parentElement).to.equal(field('inputName').parentElement);
      expect(help.closest('oscd-outlined-text-field')).to.be.null;
      expect(getComputedStyle(help).backgroundColor).to.equal(
        'rgba(0, 0, 0, 0)'
      );
      expect(field('inputName').supportingText).to.equal('');
    });

    it('uses outlined selects with fixed options for source class, DO and DA', async () => {
      expect(
        element.shadowRoot!.querySelectorAll('oscd-outlined-select').length
      ).to.equal(4);
      expect(
        Array.from(
          selectField('sourceClass').querySelectorAll('oscd-select-option')
        ).map(option => option.getAttribute('value'))
      ).to.deep.equal(['XCBR', 'TCTR']);
      expect(
        selectField('dataObject').querySelectorAll('oscd-select-option').length
      ).to.equal(1);
      expect(selectField('dataObject').label).to.equal('Choose from list');
      expect(
        selectField('dataObject').querySelector('oscd-select-option[value=""]')
      ).to.be.null;
      expect(selectField('dataAttribute').disabled).to.be.true;
      await chooseObject();
      expect(selectField('dataObject').value).to.equal('Pos');
      expect(selectField('dataAttribute').disabled).to.be.false;
      await selectValue('dataAttribute', 'stVal');
      expect(selectField('dataAttribute').value).to.equal('stVal');
      await selectValue('dataAttribute', '');
      expect(selectField('dataAttribute').value).to.equal('');
    });

    it('shows disabled cardinality and Service placeholders without blocking Save', async () => {
      expect(field('maxSources').parentElement?.parentElement).to.equal(
        selectField('service').parentElement?.parentElement
      );
      expect(element.shadowRoot!.querySelector('.form h3')).to.be.null;
      expect(field('maxSources').disabled).to.be.true;
      expect(field('maxSources').value).to.equal('1');
      expect(selectField('service').disabled).to.be.true;
      expect(selectField('service').label).to.equal(
        'Available in a later step'
      );
      expect(selectField('service').value).to.equal('');

      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      await enter('resourceName', 'BreakerPosition');
      await chooseObject();
      expect(button('save-button').disabled).to.be.false;
      button('save-button').click();
      const { detail } = saveSpy.firstCall
        .args[0] as CustomEvent<SaveInputDetail>;
      expect(detail).not.to.have.property('service');
      expect(detail).not.to.have.property('maxSources');
    });

    it('uses non-typing DO/DA selects and dispatches optional-DA input data without changing XML', async () => {
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      const before = new XMLSerializer().serializeToString(doc);
      expect(selectField('dataObject').shadowRoot!.querySelector('input')).to.be
        .null;
      expect(selectField('dataAttribute').shadowRoot!.querySelector('input')).to
        .be.null;
      await enter('resourceName', 'BreakerPosition');
      await chooseObject();
      await enter('inputName', 'CustomInput');
      button('save-button').click();

      expect(saveSpy.calledOnce).to.be.true;
      const event = saveSpy.firstCall.args[0] as CustomEvent<SaveInputDetail>;
      expect(event.detail).to.deep.equal({
        context: element.context,
        resourceName: 'BreakerPosition',
        description: '',
        sourceClass: 'XCBR',
        dataObject: 'Pos',
        dataAttribute: '',
        inputName: 'CustomInput',
      });
      expect(event.bubbles).to.be.true;
      expect(event.composed).to.be.true;
      expect(element.open).to.be.true;
      expect(new XMLSerializer().serializeToString(doc)).to.equal(before);
    });

    it('offers the TCTR example and retains entered values after Save', async () => {
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      await enter('resourceName', 'OvercurrentPhaseCT');
      await enter('description', 'Phase CT feeding the overcurrent protection');
      await selectClass('TCTR');
      await chooseObject();
      expect(selectField('dataObject').value).to.equal('AmpSv');
      expect(field('inputName').value).to.equal('AmpSv');
      await selectValue('dataAttribute', 'instMag');
      button('save-button').click();

      const { detail } = saveSpy.firstCall
        .args[0] as CustomEvent<SaveInputDetail>;
      expect(detail.resourceName).to.equal('OvercurrentPhaseCT');
      expect(detail.description).to.equal(
        'Phase CT feeding the overcurrent protection'
      );
      expect(detail.sourceClass).to.equal('TCTR');
      expect(detail.dataObject).to.equal('AmpSv');
      expect(detail.dataAttribute).to.equal('instMag');
      expect(detail.inputName).to.equal('AmpSv');
      expect(field('resourceName').value).to.equal(detail.resourceName);
      expect(field('description').value).to.equal(detail.description);
      expect(selectField('dataAttribute').value).to.equal('instMag');
      expect(element.open).to.be.true;
    });

    it('allows clearing the optional DA and preserves an edited Input name on reselecting the same DO', async () => {
      await chooseObject();
      await enter('inputName', 'CustomInput');
      await selectValue('dataAttribute', 'stVal');
      expect(selectField('dataAttribute').value).to.equal('stVal');
      await chooseObject();
      expect(field('inputName').value).to.equal('CustomInput');
      await selectValue('dataAttribute', '');
      expect(selectField('dataAttribute').value).to.equal('');
    });

    it('clears dependent choices when the source class changes', async () => {
      await enter('resourceName', 'Resource');
      await enter('description', 'Description');
      await chooseObject();
      await selectValue('dataAttribute', 'stVal');
      await selectClass('TCTR');
      expect(selectField('dataObject').value).to.equal('');
      expect(selectField('dataAttribute').value).to.equal('');
      expect(field('inputName').value).to.equal('');
      expect(field('resourceName').value).to.equal('Resource');
      expect(field('description').value).to.equal('Description');
      expect(button('save-button').disabled).to.be.true;
      expect(selectField('dataAttribute').disabled).to.be.true;
      await chooseObject();
      expect(field('inputName').value).to.equal('AmpSv');
    });

    it('blocks duplicate resource names only within the current bay', async () => {
      const priv = doc.createElement('Private');
      priv.setAttribute('type', 'eIEC61850-6-100');
      const resources = doc.createElementNS(eTr6100Ns, 'ProcessResources');
      const resource = doc.createElementNS(eTr6100Ns, 'ProcessResource');
      resource.setAttribute('name', 'ExistingResource');
      resources.append(resource);
      priv.append(resources);
      doc.querySelector('Bay[name="B2"]')!.append(priv);
      await enter('resourceName', 'ExistingResource');
      await chooseObject();
      expect(button('save-button').disabled).to.be.false;

      doc.querySelector('Bay[name="B1"]')!.append(priv);
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      button('save-button').click();
      await element.updateComplete;
      expect(saveSpy.called).to.be.false;
      expect(button('save-button').disabled).to.be.true;
      expect(field('resourceName').errorText).to.equal(
        'Resource name already exists in this bay.'
      );
      expect(errors()).to.include('Resource name already exists in this bay.');
      await enter('resourceName', 'NewResource');
      expect(button('save-button').disabled).to.be.false;
    });

    it('starts fresh when the dialog is reopened for the next input', async () => {
      await enter('resourceName', 'Resource');
      await enter('description', 'Description');
      await selectClass('TCTR');
      await chooseObject();
      const context = element.context!;
      element.close();
      await waitUntil(() => !element.open);
      element.showForLNode(context);
      await element.updateComplete;
      await waitUntil(() => element.open);
      for (const name of [
        'resourceName',
        'description',
        'dataObject',
        'dataAttribute',
        'inputName',
      ]) {
        expect(field(name).value).to.equal('');
      }
      expect(button('save-button').disabled).to.be.true;
      expect(element.context).to.equal(context);
    });
  });

  it('opens for a sink LNode, closes, and can open for another LNode without editing XML', async () => {
    const element = await fixture<AddInputDialog>(
      html`<add-input-dialog></add-input-dialog>`
    );
    const doc = new DOMParser().parseFromString(
      '<SCL><Substation name="S1"><VoltageLevel name="V1"><Bay name="B1"><Function name="F1"><LNode lnClass="PTOC"/><SubFunction name="SF1"><LNode lnClass="CSWI"/></SubFunction></Function></Bay></VoltageLevel></Substation></SCL>',
      'application/xml'
    );
    const before = new XMLSerializer().serializeToString(doc);
    const functionElement = doc.querySelector('Function')!;
    const context = {
      functionElement,
      subFunctionElement: null,
      lNodeElement: functionElement.querySelector(':scope > LNode')!,
    };
    expect(element.open).to.be.false;
    element.showForLNode(context);
    await element.updateComplete;
    await waitUntil(() => element.open);

    expect(element.open).to.be.true;
    expect(element.context).to.equal(context);
    expect(
      element.shadowRoot!.querySelector('[data-testid="sink-preview"]')
        ?.textContent
    ).to.include('PTOC');
    element
      .shadowRoot!.querySelector<HTMLElement>('[data-testid="close-button"]')!
      .click();
    await waitUntil(() => !element.open);
    expect(element.open).to.be.false;

    const subFunctionElement = functionElement.querySelector('SubFunction')!;
    element.showForLNode({
      functionElement,
      subFunctionElement,
      lNodeElement: subFunctionElement.querySelector('LNode')!,
    });
    await element.updateComplete;
    await waitUntil(() => element.open);
    expect(element.open).to.be.true;
    expect(element.context?.subFunctionElement).to.equal(subFunctionElement);
    expect(
      element.shadowRoot!.querySelector('[data-testid="sink-preview"]')
        ?.textContent
    ).to.include('CSWI');
    expect(new XMLSerializer().serializeToString(doc)).to.equal(before);
    element.close();
    await waitUntil(() => !element.open);
  });
});
