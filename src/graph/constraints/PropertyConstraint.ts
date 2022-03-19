export interface PropertyConstraint {
  value(): any;

  canMerge(other: PropertyConstraint): boolean;

  canMergeEq(other: EqConstraint): boolean;

  canMergeNeq(other: NeqConstraint): boolean;

  canMergeWithout(other: WithoutConstraint): boolean;

  merge(other: PropertyConstraint): PropertyConstraint;

  mergeEq(other: EqConstraint): PropertyConstraint;

  mergeNeq(other: NeqConstraint): PropertyConstraint;

  mergeWithout(other: WithoutConstraint): PropertyConstraint;
}

export class EqConstraint implements PropertyConstraint {
  $eq: any;

  constructor($eq: any) {
    this.$eq = $eq;
  }

  value() {
    return this.$eq;
  }

  canMerge(other: PropertyConstraint): boolean {
    return other.canMergeEq(this);
  }

  canMergeEq(other: EqConstraint): boolean {
    return this.$eq === other.$eq;
  }

  canMergeNeq(other: NeqConstraint): boolean {
    return this.$eq !== other.$neq;
  }

  canMergeWithout(other: WithoutConstraint): boolean {
    return !other.$without.includes(this.$eq);
  }

  merge(other: PropertyConstraint): PropertyConstraint {
    return other.mergeEq(this);
  }

  mergeEq(_other: EqConstraint): PropertyConstraint {
    return new EqConstraint(this.$eq);
  }

  mergeNeq(_other: NeqConstraint): PropertyConstraint {
    return new EqConstraint(this.$eq);
  }

  mergeWithout(_other: WithoutConstraint): PropertyConstraint {
    return new EqConstraint(this.$eq);
  }
}

export class NeqConstraint implements PropertyConstraint {
  $neq: any;

  constructor($neq: any) {
    this.$neq = $neq;
  }

  canMerge(other: PropertyConstraint): boolean {
    return other.canMergeNeq(this);
  }

  canMergeEq(other: EqConstraint): boolean {
    return this.$neq !== other.$eq;
  }

  canMergeNeq(_other: NeqConstraint): boolean {
    return true;
  }

  canMergeWithout(_other: WithoutConstraint): boolean {
    return true;
  }

  merge(other: PropertyConstraint): PropertyConstraint {
    return other.mergeNeq(this);
  }

  mergeEq(other: EqConstraint): PropertyConstraint {
    return new EqConstraint(other.$eq);
  }

  mergeNeq(other: NeqConstraint): PropertyConstraint {
    return new WithoutConstraint([this.$neq, other.$neq]);
  }

  mergeWithout(other: WithoutConstraint): PropertyConstraint {
    return new WithoutConstraint([...other.$without, this.$neq]);
  }

  value(): any {
    // TODO: generate value
    return 'NOT' + this.$neq;
  }
}

export class WithoutConstraint implements PropertyConstraint {
  $without: any[];

  constructor($without: any[]) {
    this.$without = $without;
  }

  canMerge(other: PropertyConstraint): boolean {
    return other.canMergeWithout(this);
  }

  canMergeEq(other: EqConstraint): boolean {
    return !this.$without.includes(other.$eq);
  }

  canMergeNeq(_other: NeqConstraint): boolean {
    return true;
  }

  canMergeWithout(_other: WithoutConstraint): boolean {
    return true;
  }

  merge(other: PropertyConstraint): PropertyConstraint {
    return other.mergeWithout(this);
  }

  mergeEq(other: EqConstraint): PropertyConstraint {
    return new EqConstraint(other.$eq);
  }

  mergeNeq(other: NeqConstraint): PropertyConstraint {
    return new WithoutConstraint([...this.$without, other.$neq]);
  }

  mergeWithout(other: WithoutConstraint): PropertyConstraint {
    return new WithoutConstraint(this.$without.concat(other.$without));
  }

  value(): any {
    // TODO: generate value
    return 'WITHOUT VALUE';
  }
}
