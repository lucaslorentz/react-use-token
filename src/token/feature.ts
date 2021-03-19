import {
  Cast,
  IfNever,
  IfUnknown,
  Remap,
  UnionToIntersection,
} from '../utils/types';

export type NoFeature = never;

export interface AnyFeature {
  self: { [U in string]: AnyFeature };
  payload?: Record<symbol, any>;
  baseFeatures?: AnyFeature;
  childFeatures?: Record<PropertyKey, AnyFeature>;
}

export interface FeatureBase<TId extends string, TSelf> {
  self: { [U in TId]: TSelf };
}

export type FeatureId<Features extends AnyFeature> = keyof IfNever<
  Features['self'],
  {}
>;
export type FeaturesPayload<Features extends AnyFeature> = Features['payload'];
export type BaseFeatures<Features extends AnyFeature> = NonNullable<
  Features['baseFeatures']
>;
export type ChildFeatures<Features extends AnyFeature> = Cast<
  Remap<NonNullable<Features['childFeatures']>>,
  Record<PropertyKey, AnyFeature>
>;

export type ExcludeFeatures<
  Features extends AnyFeature,
  FeaturesToExclude extends AnyFeature
> = Cast<
  UnionToIntersection<
    Features['self'][Cast<
      Exclude<FeatureId<Features>, FeatureId<FeaturesToExclude>>,
      keyof Features['self']
    >]
  >,
  AnyFeature
>;

export type CleanupFeatures<Features extends AnyFeature> = ExcludeFeatures<
  Features,
  BaseFeatures<Features>
>;

export interface FeaturesTransformation {
  remove?: AnyFeature;
  add?: AnyFeature;
}

export type TransformFeatures<
  Features extends AnyFeature,
  Transformation extends FeaturesTransformation
> = Cast<
  IfUnknown<
    IfNever<
      ExcludeFeatures<
        Features,
        IfUnknown<NonNullable<Transformation['remove']>, never>
      >,
      unknown
    > &
      Transformation['add'],
    never
  >,
  AnyFeature
>;
