export type AlertLocalizationKey = `alert.${string}`;

export type LocalizationValues = Record<string, string | number>;

export interface LocalizedAlertCause {
  cause: AlertLocalizationKey;
  causeValues?: LocalizationValues;
}
