// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const getId = <E extends HTMLElement>(id: string) =>
  document.getElementById(id) as E;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const getEl = <E extends HTMLElement>(
  selector: string,
  el: ParentNode = document
) => el.querySelector(selector) as E;

export const getAll = <E extends HTMLElement>(
  selector: string,
  el: ParentNode = document
) => [...el.querySelectorAll<E>(selector)];

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const closestEl = <E extends HTMLElement>(
  el: HTMLElement,
  selector: string
) => el.closest(selector) as E;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const toHtml = <E extends HTMLElement>(str: string): E => {
  const el = document.createElement("template");
  el.innerHTML = str;
  return el.content.children.item(0) as E;
};
