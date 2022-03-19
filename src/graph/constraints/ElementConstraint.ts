import { PropertyConstraint } from './PropertyConstraint';

export enum ElementType {
  VERTEX = 'VERTEX',
  EDGE = 'EDGE',
  UNKNOWN = 'UNKNOWN'
}

export interface ElementConstraint {
  properties: Map<string, PropertyConstraint>;
  type: ElementType;

  copy(): ElementConstraint;

  trySet(key: string, pc: PropertyConstraint);

  get(key: string): PropertyConstraint | undefined;

  canMerge(other: ElementConstraint): boolean;

  merge(other: ElementConstraint): ElementConstraint;
}

const elementConstraintFactory = (type: ElementType) => {
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
  type: ElementType;
  properties: Map<string, PropertyConstraint>;

  protected constructor(type: ElementType) {
    this.properties = new Map<string, PropertyConstraint>();
    this.type = type;
  }

  copy(): ElementConstraint {
    const copy = elementConstraintFactory(this.type);
    this.properties.forEach((val, key) => copy.trySet(key, val));
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
    this.properties.forEach((value, key) => {
      const otherProperty = other.get(key);
      if (otherProperty && !value.canMerge(otherProperty)) {
        return false;
      }
    });
    return true;
  }

  merge(other: ElementConstraint): ElementConstraint {
    const merged = elementConstraintFactory(this.type);
    this.properties.forEach((value, key) => {
      const otherProperty = other.get(key);
      const mergedProperty = otherProperty ? value.merge(otherProperty) : value;
      merged.trySet(key, mergedProperty);
    });
    other.properties.forEach((value, key) => {
      if (!this.get(key)) {
        this.trySet(key, value);
      }
    });
    return merged;
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
