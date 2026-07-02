/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
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

  beforeEach(async () => {
    element = await fixture(
      html`
        <edit-list
          title=${title}
          itemName=${itemName}
          .items=${items}
          .itemHeadline=${(person: Person) => person.name}
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
});
