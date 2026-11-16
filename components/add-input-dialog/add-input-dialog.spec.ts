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
import { docWithSubFunctionLNode } from '../../testfiles.js';

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
        docWithSubFunctionLNode,
        'application/xml'
      );
      const sclNamespace = doc.documentElement.namespaceURI!;
      const functionElement = doc.getElementsByTagNameNS(
        sclNamespace,
        'Function'
      )[0];
      const lNodeElement = doc.getElementsByTagNameNS(sclNamespace, 'LNode')[0];
      const otherBay = doc.createElementNS(sclNamespace, 'Bay');
      otherBay.setAttribute('name', 'B1');
      doc
        .getElementsByTagNameNS(sclNamespace, 'VoltageLevel')[0]
        .append(otherBay);
      element.showForLNode({
        functionElement,
        subFunctionElement: null,
        lNodeElement,
      });
      await element.updateComplete;
      await waitUntil(() => element.open);
    });

    afterEach(async () => {
      element.close();
      await waitUntil(() => !element.open);
    });

    it('shows required-field reasons and blocks Save until every required field is present', async () => {
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.error
      ).to.be.false;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataObject"]'
        )!.error
      ).to.be.false;
      expect(
        element.shadowRoot!.querySelector('[data-testid="validation-errors"]')
          ?.textContent
      ).to.include('Still needed: Resource name, Data object, Input name');
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
      element
        .shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!
        .dispatchEvent(new MouseEvent('click'));
      expect(saveSpy.called).to.be.false;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.error
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.errorText
      ).to.equal('Resource name is required.');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataObject"]'
        )!.error
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector('[data-testid="validation-errors"]')
          ?.textContent
      ).to.include('Still needed: Resource name, Data object, Input name');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.disabled
      ).to.be.true;

      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = '   ';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      expect(
        element.shadowRoot!.querySelector('[data-testid="validation-errors"]')
          ?.textContent
      ).to.include('Resource name');
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'BreakerPosition';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="inputName"]'
        )!.value
      ).to.equal('Pos');
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.false;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.error
      ).to.be.false;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataObject"]'
        )!.error
      ).to.be.false;
      expect(
        element.shadowRoot!.querySelector('[data-testid="validation-errors"]')
          ?.textContent
      ).to.be.undefined;

      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="inputName"]'
      )!.value = ' ';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>('[name="inputName"]')!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector('[data-testid="validation-errors"]')
          ?.textContent
      ).to.include('Still needed: Input name');
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="inputName"]'
      )!.value = 'BreakerPos';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>('[name="inputName"]')!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.false;
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = '';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
    });

    it('shows the source-to-sink preview and locked scope for the selected LNode', async () => {
      const preview = (testId: string) =>
        element.shadowRoot!.querySelector(`[data-testid="${testId}"]`)!;
      expect(preview('source-preview').textContent).to.include('XCBR');
      expect(
        preview('source-preview').textContent?.replace(/\s+/g, ' ')
      ).to.include('in another bay');
      expect(preview('sink-preview').textContent).to.include('XSWI');
      expect(preview('sink-preview').textContent).to.include(
        'S1 › V1 › B2 › TEST2'
      );
      expect(
        preview('search-scope').textContent?.replace(/\s+/g, ' ')
      ).to.include('Voltage Level V1');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.disabled
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.textContent
      ).to.include('Pick a data object first');

      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        select.value = 'TCTR';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      expect(preview('source-preview').textContent).to.include('TCTR');
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.disabled
      ).to.be.false;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.textContent
      ).to.include('No data attribute');
      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        select.value = 'XCBR';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.disabled
      ).to.be.true;
    });

    it('shows disabled cardinality and Service placeholders without blocking Save', async () => {
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="maxSources"]'
        )!.parentElement?.parentElement
      ).to.equal(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="service"]'
        )!.parentElement?.parentElement
      );
      expect(element.shadowRoot!.querySelector('.form h3')).to.be.null;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="maxSources"]'
        )!.disabled
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="maxSources"]'
        )!.value
      ).to.equal('1');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="service"]'
        )!.disabled
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="service"]'
        )!.label
      ).to.equal('Available in a later step');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="service"]'
        )!.value
      ).to.equal('');

      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'BreakerPosition';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.false;
      element
        .shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!
        .click();
      const { detail } = saveSpy.firstCall
        .args[0] as CustomEvent<SaveInputDetail>;
      expect(detail).not.to.have.property('service');
      expect(detail).not.to.have.property('maxSources');
    });

    it('offers the TCTR example and retains entered values after Save', async () => {
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'OvercurrentPhaseCT';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="description"]'
      )!.value = 'Phase CT feeding the overcurrent protection';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="description"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        select.value = 'TCTR';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataObject"]'
        )!.value
      ).to.equal('AmpSv');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="inputName"]'
        )!.value
      ).to.equal('AmpSv');
      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!;
        select.value = 'instMag';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      element
        .shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!
        .click();

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
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.value
      ).to.equal(detail.resourceName);
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="description"]'
        )!.value
      ).to.equal(detail.description);
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.value
      ).to.equal('instMag');
      expect(element.open).to.be.true;
    });

    it('clears dependent choices when the source class changes', async () => {
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'Resource';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="description"]'
      )!.value = 'Description';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="description"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!;
        select.value = 'stVal';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        select.value = 'TCTR';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataObject"]'
        )!.value
      ).to.equal('');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.value
      ).to.equal('');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="inputName"]'
        )!.value
      ).to.equal('');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.value
      ).to.equal('Resource');
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="description"]'
        )!.value
      ).to.equal('Description');
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[name="dataAttribute"]'
        )!.disabled
      ).to.be.true;
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="inputName"]'
        )!.value
      ).to.equal('AmpSv');
    });

    it('blocks duplicate resource names only within the current bay', async () => {
      const priv = doc.createElement('Private');
      priv.setAttribute('type', 'eIEC61850-6-100');
      const resources = doc.createElementNS(eTr6100Ns, 'ProcessResources');
      const resource = doc.createElementNS(eTr6100Ns, 'ProcessResource');
      resource.setAttribute('name', 'ExistingResource');
      resources.append(resource);
      priv.append(resources);
      doc
        .getElementsByTagNameNS(doc.documentElement.namespaceURI, 'Bay')[1]
        .append(priv);
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'ExistingResource';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.false;

      doc
        .getElementsByTagNameNS(doc.documentElement.namespaceURI, 'Bay')[0]
        .append(priv);
      const saveSpy = spy();
      element.addEventListener('save-input', saveSpy);
      element
        .shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!
        .click();
      await element.updateComplete;
      expect(saveSpy.called).to.be.false;
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
      expect(
        element.shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!.errorText
      ).to.equal('Resource name already exists in this bay.');
      expect(
        element.shadowRoot!.querySelector('[data-testid="validation-errors"]')
          ?.textContent
      ).to.include('Resource name already exists in this bay.');
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'NewResource';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.false;
    });

    it('starts fresh when the dialog is reopened for the next input', async () => {
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="resourceName"]'
      )!.value = 'Resource';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="resourceName"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      element.shadowRoot!.querySelector<OscdOutlinedTextField>(
        '[name="description"]'
      )!.value = 'Description';
      element
        .shadowRoot!.querySelector<OscdOutlinedTextField>(
          '[name="description"]'
        )!
        .dispatchEvent(new Event('input'));
      await element.updateComplete;
      {
        const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        select.value = 'TCTR';
        await select.updateComplete;
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;
      }
      {
        const source = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
          '[data-testid="source-class"]'
        )!;
        {
          const select = element.shadowRoot!.querySelector<OscdOutlinedSelect>(
            '[name="dataObject"]'
          )!;
          select.value = source.value === 'TCTR' ? 'AmpSv' : 'Pos';
          await select.updateComplete;
          select.dispatchEvent(new Event('change'));
          await element.updateComplete;
        }
      }
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
        expect(
          element.shadowRoot!.querySelector<OscdOutlinedTextField>(
            `[name="${name}"]`
          )!.value
        ).to.equal('');
      }
      expect(
        element.shadowRoot!.querySelector<OscdFilledButton>(
          '[data-testid="save-button"]'
        )!.disabled
      ).to.be.true;
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
