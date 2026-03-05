import TakeExposureItem from './TakeExposureItem.vue';
import TakeManyExposuresItem from './TakeManyExposuresItem.vue';
import TakeSubframeExposureItem from './TakeSubframeExposureItem.vue';
import SwitchFilterItem from './SwitchFilterItem.vue';
import SwitchProfileItem from './SwitchProfileItem.vue';
import ToggleLightItem from './ToggleLightItem.vue';
import SetBrightnessItem from './SetBrightnessItem.vue';
import AutoBrightnessFlatItem from './AutoBrightnessFlatItem.vue';
import AutoExposureFlatItem from './AutoExposureFlatItem.vue';
import SkyFlatItem from './SkyFlatItem.vue';
import LoopConditionItem from './LoopConditionItem.vue';
import LoopForTimeSpanItem from './LoopForTimeSpanItem.vue';
import LoopWhileItem from './LoopWhileItem.vue';
import LoopWhileUnsafeItem from './LoopWhileUnsafeItem.vue';
import TimeConditionItem from './TimeConditionItem.vue';
import DitherAfterExposuresItem from './DitherAfterExposuresItem.vue';
import SmartExposureItem from './SmartExposureItem.vue';
import RunAutofocusItem from './RunAutofocusItem.vue';
import SequentialContainerItem from './SequentialContainerItem.vue';
import CenterItem from './CenterItem.vue';
import DeepSkyObjectContainerItem from './DeepSkyObjectContainerItem.vue';
import WarmCameraItem from './WarmCameraItem.vue';
import MoonAltitudeConditionItem from './MoonAltitudeConditionItem.vue';
import MoonIlluminationConditionItem from './MoonIlluminationConditionItem.vue';
import AltitudeConditionItem from './AltitudeConditionItem.vue';
import SunAltitudeConditionItem from './SunAltitudeConditionItem.vue';
import AboveHorizonConditionItem from './AboveHorizonConditionItem.vue';
import SafetyMonitorConditionItem from './SafetyMonitorConditionItem.vue';
import SynchronizeDomeTriggerItem from './SynchronizeDomeTriggerItem.vue';
import ReconnectTriggerItem from './ReconnectTriggerItem.vue';
import AutofocusAfterExposuresItem from './AutofocusAfterExposuresItem.vue';
import AutofocusAfterHFRIncreaseItem from './AutofocusAfterHFRIncreaseItem.vue';
import AutofocusAfterTemperatureChangeItem from './AutofocusAfterTemperatureChangeItem.vue';
import AutofocusAfterTimeItem from './AutofocusAfterTimeItem.vue';
import CenterAfterDriftTriggerItem from './CenterAfterDriftTriggerItem.vue';
import MeridianFlipTriggerItem from './MeridianFlipTriggerItem.vue';
import CoolCameraItem from './CoolCameraItem.vue';
import DewHeaterItem from './DewHeaterItem.vue';
import SetUSBLimitItem from './SetUSBLimitItem.vue';
import GenericItem from './GenericItem.vue';

export const ITEM_COMPONENTS = {
  'NINA.Sequencer.SequenceItem.Imaging.TakeExposure': TakeExposureItem,
  'NINA.Sequencer.SequenceItem.Imaging.TakeSubframeExposure': TakeSubframeExposureItem,
  'NINA.Sequencer.SequenceItem.FilterWheel.SwitchFilter': SwitchFilterItem,
  'NINA.Sequencer.Conditions.LoopCondition': LoopConditionItem,
  'NINA.Sequencer.Conditions.TimeSpanCondition': LoopForTimeSpanItem,
  'NINA.Sequencer.Conditions.TimeCondition': TimeConditionItem,
  'NINA.Sequencer.Conditions.LoopWhile': LoopWhileItem,
  'NINA.Sequencer.Conditions.LoopWhileUnsafe': LoopWhileUnsafeItem,
  'NINA.Sequencer.Conditions.AltitudeCondition': AltitudeConditionItem,
  'NINA.Sequencer.Conditions.SunAltitudeCondition': SunAltitudeConditionItem,
  'NINA.Sequencer.Conditions.AboveHorizonCondition': AboveHorizonConditionItem,
  'NINA.Sequencer.Conditions.SafetyMonitorCondition': SafetyMonitorConditionItem,
  'NINA.Sequencer.Conditions.MoonAltitudeCondition': MoonAltitudeConditionItem,
  'NINA.Sequencer.Conditions.MoonIlluminationCondition': MoonIlluminationConditionItem,
  'NINA.Sequencer.Trigger.Autofocus.AutofocusAfterExposures': AutofocusAfterExposuresItem,
  'NINA.Sequencer.Trigger.Autofocus.AutofocusAfterFilterChange': RunAutofocusItem,
  'NINA.Sequencer.Trigger.Autofocus.AutofocusAfterHFRIncreaseTrigger': AutofocusAfterHFRIncreaseItem,
  'NINA.Sequencer.Trigger.Autofocus.AutofocusAfterTemperatureChangeTrigger': AutofocusAfterTemperatureChangeItem,
  'NINA.Sequencer.Trigger.Autofocus.AutofocusAfterTimeTrigger': AutofocusAfterTimeItem,
  'NINA.Sequencer.Trigger.Guider.DitherAfterExposures': DitherAfterExposuresItem,
  'NINA.Sequencer.Trigger.Guider.RestoreGuiding': RunAutofocusItem,
  'NINA.Sequencer.Trigger.Platesolving.CenterAfterDriftTrigger': CenterAfterDriftTriggerItem,
  'NINA.Sequencer.Trigger.MeridianFlip.MeridianFlipTrigger': MeridianFlipTriggerItem,
  'NINA.Sequencer.SequenceItem.Imaging.TakeManyExposures': TakeManyExposuresItem,
  'NINA.Sequencer.SequenceItem.Imaging.SmartExposure': SmartExposureItem,
  'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.UnparkScope': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.ParkScope': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.FindHome': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Guider.StartGuiding': RunAutofocusItem,
  'ninaAPI.SequenceItems.SendErrorTrigger': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Connect.SwitchProfile': SwitchProfileItem,
  'NINA.Sequencer.SequenceItem.Connect.ConnectAllEquipment': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Connect.DisconnectAllEquipment': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Connect.ConnectEquipment': ReconnectTriggerItem,
  'NINA.Sequencer.SequenceItem.Connect.DisconnectEquipment': ReconnectTriggerItem,
  'NINA.Sequencer.Trigger.Connect.ReconnectOnDownloadFailure': ReconnectTriggerItem,
  'NINA.Sequencer.Trigger.Connect.ReconnectTrigger': ReconnectTriggerItem,
  'NINA.Sequencer.Trigger.Dome.SynchronizeDomeTrigger': SynchronizeDomeTriggerItem,
  'NINA.Sequencer.Container.SequentialContainer': SequentialContainerItem,
  'NINA.Sequencer.SequenceItem.Platesolving.Center': CenterItem,
  'NINA.Sequencer.Container.DeepSkyObjectContainer': DeepSkyObjectContainerItem,
  'NINA.Sequencer.SequenceItem.Camera.WarmCamera': WarmCameraItem,
  'NINA.Sequencer.SequenceItem.Camera.CoolCamera': CoolCameraItem,
  'NINA.Sequencer.SequenceItem.Camera.DewHeater': DewHeaterItem,
  'NINA.Sequencer.SequenceItem.Camera.SetUSBLimit': SetUSBLimitItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.CloseCover': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.OpenCover': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.ToggleLight': ToggleLightItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.SetBrightness': SetBrightnessItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.AutoBrightnessFlat': AutoBrightnessFlatItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.AutoExposureFlat': AutoExposureFlatItem,
  'NINA.Sequencer.SequenceItem.FlatDevice.SkyFlat': SkyFlatItem,
};

export { GenericItem };
