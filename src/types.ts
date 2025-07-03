export interface ForeachAble<A> {
  forEach: (callback: (arg: A) => void) => void;
}
