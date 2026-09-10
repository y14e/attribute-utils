/**
 * Attribute Utils
 *
 * @version 2.0.10
 * @author Yusuke Kamiyamane
 * @license MIT
 * @copyright Copyright (c) Yusuke Kamiyamane
 * @see {@link https://github.com/y14e/attribute-utils}
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AttributeUtilsOptions {
  caseInsensitive: boolean;
  parse: (value: string) => string[];
  serialize: (tokens: string[]) => string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_PARSER = (value: string): string[] => value.split(/\s+/);
const DEFAULT_SERIALIZER = (tokens: string[]): string => tokens.join(' ');

// -----------------------------------------------------------------------------
// APIs
// -----------------------------------------------------------------------------

export function addAttributeToken(
  element: Element,
  name: string,
  token: string,
  options: Partial<AttributeUtilsOptions> = {},
): void {
  if (!isValid(element, name, token)) {
    return;
  }

  const value = element.getAttribute(name)?.trim();
  const { caseInsensitive, parse, serialize } = resolveOptions(options);
  const tokens = value ? parse(value).filter(Boolean) : [];

  if (caseInsensitive) {
    const lower = token.toLowerCase();

    if (tokens.every((token) => token.toLowerCase() !== lower)) {
      tokens.push(token);
      element.setAttribute(name, serialize(tokens));
    }
  } else {
    const set = new Set<string>(tokens);
    set.add(token);
    element.setAttribute(name, serialize([...set]));
  }
}

export function removeAttributeToken(
  element: Element,
  name: string,
  token: string,
  options: Partial<AttributeUtilsOptions> = {},
): void {
  if (!isValid(element, name, token)) {
    return;
  }

  const value = element.getAttribute(name)?.trim();

  if (!value) {
    return;
  }

  const { caseInsensitive, parse, serialize } = resolveOptions(options);
  const tokens = parse(value).filter(Boolean);

  if (!tokens.length) {
    return;
  }

  if (caseInsensitive) {
    const lower = token.toLowerCase();
    const filtered = tokens.filter((token) => token.toLowerCase() !== lower);

    if (filtered.length !== tokens.length) {
      filtered.length
        ? element.setAttribute(name, serialize(filtered))
        : element.removeAttribute(name);
    }
  } else {
    const set = new Set<string>(tokens);
    set.delete(token);

    if (set.size !== tokens.length) {
      set.size
        ? element.setAttribute(name, serialize([...set]))
        : element.removeAttribute(name);
    }
  }
}

const snapshots = new WeakMap<Element, Map<string, string | null>>();

export function restoreAttributes(
  element_or_elements: Element | Element[],
): void {
  for (const element of Array.isArray(element_or_elements)
    ? element_or_elements
    : [element_or_elements]) {
    const snapshot = snapshots.get(element);

    if (!snapshot) {
      continue;
    }

    for (const [name, value] of snapshot.entries()) {
      value === null
        ? element.removeAttribute(name)
        : element.setAttribute(name, value);
    }

    snapshots.delete(element);
  }
}

export function saveAttributes(
  element_or_elements: Element | Element[],
  name_or_names: string | string[],
): void {
  const names = Array.isArray(name_or_names) ? name_or_names : [name_or_names];

  for (const element of Array.isArray(element_or_elements)
    ? element_or_elements
    : [element_or_elements]) {
    let snapshot = snapshots.get(element);

    if (!snapshot) {
      snapshot = new Map<string, string | null>();
      snapshots.set(element, snapshot);
    }

    for (const name of names) {
      snapshot.set(name, element.getAttribute(name));
    }
  }
}

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

function isValid(element: Element, name: string, token: string): boolean {
  if (!(element instanceof Element)) {
    console.warn('Invalid element');
    return false;
  }

  try {
    document.createElement('div').setAttribute(name, '');
  } catch {
    console.warn(`Invalid attribute name: '${name}'`);
    return false;
  }

  if (typeof token !== 'string' || !token.trim()) {
    console.warn('Invalid token');
    return false;
  }

  return true;
}

function resolveOptions(
  options: Partial<AttributeUtilsOptions>,
): AttributeUtilsOptions {
  let {
    caseInsensitive = false,
    parse = DEFAULT_PARSER,
    serialize = DEFAULT_SERIALIZER,
  } = options;

  if (typeof caseInsensitive !== 'boolean') {
    console.warn('Invalid caseInsensitive option. Fallback: false.');
    caseInsensitive = false;
  }

  if (typeof parse !== 'function') {
    console.warn(
      'Invalid parser. Fallback: default parser (splits by whitespace).',
    );
    parse = DEFAULT_PARSER;
  }

  if (typeof serialize !== 'function') {
    console.warn(
      'Invalid serializer. Fallback: default serializer (joins by whitespace).',
    );
    serialize = DEFAULT_SERIALIZER;
  }

  return { caseInsensitive, parse, serialize };
}
