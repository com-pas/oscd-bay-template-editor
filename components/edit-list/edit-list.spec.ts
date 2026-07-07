/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import sinon from 'sinon';
import { EditList } from './edit-list.js';

if (!customElements.get('edit-list')) {
  customElements.define('edit-list', EditList);
}

interface Person {
  name: string;
  age: number;
}

describe('EditList', () => {
  let element: EditList<Person>;

  const title = 'Test List';
  const itemName = 'Person';
  const items: Person[] = [
    { name: 'John', age: 30 },
    { name: 'Mary', age: 25 },
    { name: 'Vincent', age: 55 },
  ];
  const addHandler = sinon.spy();
  const deleteHandler = sinon.spy();

  beforeEach(async () => {
    element = await fixture(
      html`
        <edit-list
          title=${title}
          itemName=${itemName}
          .items=${items}
          .itemHeadline=${(person: Person) => person.name}
          @add-item=${addHandler}
          @delete-item=${(e: CustomEvent<{ item: Person }>) =>
            deleteHandler(e.detail.item)}
        >
        </edit-list>
      `
    );
    await element.updateComplete;
  });

  it('renders title', () => {
    const titleElement = element.shadowRoot?.querySelector('.title');
    expect(titleElement?.textContent).to.contain(title);
  });

  it('renders items', () => {
    const johnItem = element.shadowRoot?.querySelector(
      'oscd-list-item[data-testid="edit-list-item-0"]'
    )! as HTMLElement;
    const maryItem = element.shadowRoot?.querySelector(
      'oscd-list-item[data-testid="edit-list-item-1"]'
    )! as HTMLElement;
    const vincentItem = element.shadowRoot?.querySelector(
      'oscd-list-item[data-testid="edit-list-item-2"]'
    )! as HTMLElement;

    expect(johnItem.textContent).to.contain('John');
    expect(maryItem.textContent).to.contain('Mary');
    expect(vincentItem.textContent).to.contain('Vincent');
  });

  it('deletes selected item', async () => {
    const johnItem = element.shadowRoot?.querySelector(
      'oscd-list-item[data-testid="edit-list-item-0"]'
    )! as HTMLElement;

    johnItem.click();
    await new Promise(r => {
      setTimeout(r, 0);
    });

    const deleteButton = element.shadowRoot?.querySelector(
      'oscd-icon-button[data-testid="edit-list-delete-button"]'
    )! as HTMLElement;
    deleteButton.click();
    await new Promise(r => {
      setTimeout(r, 0);
    });

    const john = items[0];

    expect(deleteHandler.calledOnce).to.be.true;
    expect(deleteHandler.firstCall).to.have.been.calledWith(john);
  });

  it('calls add handler on add', async () => {
    const addButton = element.shadowRoot?.querySelector(
      'oscd-icon-button[data-testid="edit-list-add-button"]'
    )! as HTMLElement;

    addButton.click();
    await new Promise(r => {
      setTimeout(r, 0);
    });

    expect(addHandler.calledOnce).to.be.true;
  });
});
