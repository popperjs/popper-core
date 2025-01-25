import {markOthers} from '../../src/utils/markOthers';

afterEach(() => {
  document.body.innerHTML = '';
});

test('single call', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  document.body.appendChild(target);

  const cleanup = markOthers([target], true);

  expect(other.getAttribute('aria-hidden')).toBe('true');

  cleanup();

  expect(other.getAttribute('aria-hidden')).toBe(null);
});

test('multiple calls', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  document.body.appendChild(target);

  const cleanup = markOthers([target], true);

  expect(other.getAttribute('aria-hidden')).toBe('true');

  const nextTarget = document.createElement('div');
  document.body.appendChild(nextTarget);

  const nextCleanup = markOthers([nextTarget], true);

  expect(target.getAttribute('aria-hidden')).toBe('true');
  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);

  document.body.removeChild(nextTarget);

  nextCleanup();

  expect(target.getAttribute('aria-hidden')).toBe(null);
  expect(other.getAttribute('aria-hidden')).toBe('true');

  cleanup();

  expect(other.getAttribute('aria-hidden')).toBe(null);

  document.body.appendChild(nextTarget);
});

test('out of order cleanup', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  target.setAttribute('data-testid', '');
  document.body.appendChild(target);

  const cleanup = markOthers([target], true);

  expect(other.getAttribute('aria-hidden')).toBe('true');

  const nextTarget = document.createElement('div');
  document.body.appendChild(nextTarget);

  const nextCleanup = markOthers([nextTarget], true);

  expect(target.getAttribute('aria-hidden')).toBe('true');
  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);

  cleanup();

  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);
  expect(target.getAttribute('aria-hidden')).toBe('true');
  expect(other.getAttribute('aria-hidden')).toBe('true');

  nextCleanup();

  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);
  expect(other.getAttribute('aria-hidden')).toBe(null);
  expect(target.getAttribute('aria-hidden')).toBe(null);
});

test('multiple cleanups with differing controlAttribute', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  target.setAttribute('data-testid', '1');
  document.body.appendChild(target);

  const cleanup = markOthers([target], true);

  expect(other.getAttribute('aria-hidden')).toBe('true');

  const target2 = document.createElement('div');
  target.setAttribute('data-testid', '2');
  document.body.appendChild(target2);

  const cleanup2 = markOthers([target2]);

  expect(target.getAttribute('aria-hidden')).not.toBe('true');
  expect(target.getAttribute('data-floating-ui-inert')).toBe('');

  cleanup();

  expect(other.getAttribute('aria-hidden')).toBe(null);

  cleanup2();

  expect(target.getAttribute('data-floating-ui-inert')).toBe(null);
});

test('avoid descending into contenteditable nodes', () => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `
    <div>
      <div id="other"></div>  
      <div id="editor" contenteditable="true">
        <div id="widget" contenteditable="false">
          <div id="target"></div>
          <div id="sibling"></div>
        </div>
        <p>Some text</p>
      </div>
    </div>
  `,
    'text/html',
  );

  document.body.appendChild(doc.body.firstElementChild!);

  const target = document.getElementById('target')!;
  const cleanup = markOthers([target]);

  expect(target.getAttribute('data-floating-ui-inert')).toBe(null);

  const other = document.getElementById('other')!;
  expect(other.getAttribute('data-floating-ui-inert')).toBe('');

  const sibling = document.getElementById('other')!;
  expect(sibling.getAttribute('data-floating-ui-inert')).toBe('');

  const editor = document.getElementById('editor')!;
  expect(editor.getAttribute('data-floating-ui-inert')).toBe('');
  expect(
    editor.querySelector('p')!.getAttribute('data-floating-ui-inert'),
  ).toBe(null);

  cleanup();

  expect(target.getAttribute('data-floating-ui-inert')).toBe(null);
  expect(sibling.getAttribute('data-floating-ui-inert')).toBe(null);
  expect(other.getAttribute('data-floating-ui-inert')).toBe(null);
  expect(editor.getAttribute('data-floating-ui-inert')).toBe(null);
});
