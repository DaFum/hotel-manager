export interface NarrativeCondition {
  key: string;
  min?: number;
  max?: number;
}
export interface NarrativeChoiceDefinition {
  id: string;
  labelKey: string;
}
export interface NarrativeDefinition {
  id: string;
  titleKey: string;
  bodyKey: string;
  conditions: NarrativeCondition[];
  choices: NarrativeChoiceDefinition[];
  priority: number;
  cooldownMonths: number;
}
export interface ActiveNarrativeEvent {
  id: string;
  definitionId: string;
  triggeredDateKey: string;
  choices: NarrativeChoiceDefinition[];
}
