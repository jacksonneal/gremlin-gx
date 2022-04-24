import { PropertyConstraint } from './PropertyConstraint';
import { v4 as uuidv4 } from 'uuid';
import { FROM, ID, TO } from '../constants';

export enum ElementType {
  VERTEX = 'VERTEX',
  EDGE = 'EDGE',
  UNKNOWN = 'UNKNOWN'
}

export interface ElementConstraint {
  uid: string;
  memberUids: Set<string>;
  properties: Map<string, PropertyConstraint>;
  annotations: Set<string>;
  type: ElementType;
  count: number;

  copy(): ElementConstraint;

  trySet(key: string, pc: PropertyConstraint);

  get(key: string): PropertyConstraint | undefined;

  canMerge(other: ElementConstraint): boolean;

  merge(other: ElementConstraint): ElementConstraint;

  diffKeyScore(other: ElementConstraint): number;

  coversId(uid: string): boolean;
}

export const elementConstraintFactory = (type: ElementType) => {
  switch (type) {
    case ElementType.VERTEX:
      return new VertexConstraint();
    case ElementType.EDGE:
      return new EdgeConstraint();
    case ElementType.UNKNOWN:
      return new StructConstraint();
  }
};

abstract class AbstractElementConstraint implements ElementConstraint {
  uid: string;
  memberUids: Set<string>;
  properties: Map<string, PropertyConstraint>;
  annotations: Set<string>;
  type: ElementType;
  count: number;

  protected constructor(type: ElementType) {
    this.uid = uuidv4();
    this.memberUids = new Set();
    this.properties = new Map();
    this.annotations = new Set();
    this.type = type;
    this.count = 1;
  }

  copy(): ElementConstraint {
    const copy = elementConstraintFactory(this.type);
    copy.uid = this.uid;
    copy.memberUids = new Set(this.memberUids);
    this.properties.forEach((val, key) => copy.trySet(key, val));
    copy.annotations = new Set(this.annotations);
    return copy;
  }

  trySet(key: string, pc: PropertyConstraint) {
    this.properties.set(key, pc);
  }

  get(key: string): PropertyConstraint | undefined {
    return this.properties.get(key);
  }

  canMerge(other: ElementConstraint): boolean {
    if (this.type !== other.type) {
      return false;
    }
    let canMerge = true;
    this.properties.forEach((property, key) => {
      const otherProperty = other.get(key);
      if (otherProperty) {
        if (!property.canMerge(otherProperty)) {
          canMerge = false;
        }
      }
    });
    if (
      !(
        this.annotations.size === other.annotations.size && [...this.annotations].every((a) => other.annotations.has(a))
      )
    ) {
      canMerge = false;
    }
    return canMerge;
  }

  merge(other: ElementConstraint): ElementConstraint {
    const mergedElement = elementConstraintFactory(this.type);
    mergedElement.memberUids = new Set([...this.memberUids, this.uid, ...other.memberUids, other.uid]);
    this.properties.forEach((value, key) => {
      const otherProperty = other.get(key);
      const mergedProperty = otherProperty ? value.merge(otherProperty) : value;
      mergedElement.trySet(key, mergedProperty);
    });
    other.properties.forEach((value, key) => {
      if (!this.get(key)) {
        mergedElement.trySet(key, value);
      }
    });
    mergedElement.annotations = new Set([...this.annotations, ...other.annotations]);
    return mergedElement;
  }

  diffKeyScore(other: ElementConstraint): number {
    let diff = 0;
    this.properties.forEach((value, key) => {
      if (!other.properties.has(key)) {
        diff++;
      }
    });
    other.properties.forEach((value, key) => {
      if (!this.properties.has(key)) {
        diff++;
      }
    });
    return diff;
  }

  coversId(uid: string): boolean {
    return this.uid === uid || this.memberUids.has(uid);
  }
}

export class VertexConstraint extends AbstractElementConstraint {
  constructor() {
    super(ElementType.VERTEX);
  }
}

export class EdgeConstraint extends AbstractElementConstraint {
  constructor() {
    super(ElementType.EDGE);
  }
}

export class StructConstraint extends AbstractElementConstraint {
  constructor() {
    super(ElementType.UNKNOWN);
  }
}
