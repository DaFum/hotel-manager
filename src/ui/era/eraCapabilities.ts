export interface EraAdoption {
  personalComputerBp: number;
  internetBp: number;
  smartphoneBp: number;
  channelManagerBp: number;
}
export interface EraCapabilities {
  digitalBackOffice: boolean;
  onlineDistribution: boolean;
  smartphoneVisuals: boolean;
  mobileCheckIn: boolean;
  channelAutomation: boolean;
}
export function eraCapabilities(
  adoption: EraAdoption | number,
): EraCapabilities {
  const values =
    typeof adoption === "number"
      ? {
          personalComputerBp: 0,
          internetBp: 0,
          smartphoneBp: adoption,
          channelManagerBp: 0,
        }
      : adoption;
  return {
    digitalBackOffice: values.personalComputerBp >= 2500,
    onlineDistribution: values.internetBp >= 3000,
    smartphoneVisuals: values.smartphoneBp >= 2000,
    mobileCheckIn: values.smartphoneBp >= 3500,
    channelAutomation: values.channelManagerBp >= 4000,
  };
}
