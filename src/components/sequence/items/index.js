import TakeExposureItem from './TakeExposureItem.vue';
import SwitchFilterItem from './SwitchFilterItem.vue';
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
import GenericItem from './GenericItem.vue';

export const ITEM_COMPONENTS = {
  'NINA.Sequencer.SequenceItem.Imaging.TakeExposure': TakeExposureItem,
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
  'NINA.Sequencer.Trigger.Guider.DitherAfterExposures': DitherAfterExposuresItem,
  'NINA.Sequencer.SequenceItem.Imaging.SmartExposure': SmartExposureItem,
  'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.UnparkScope': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.ParkScope': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.FindHome': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Guider.StartGuiding': RunAutofocusItem,
  'ninaAPI.SequenceItems.SendErrorTrigger': RunAutofocusItem,
  'NINA.Sequencer.Trigger.Connect.ReconnectOnDownloadFailure': ReconnectTriggerItem,
  'NINA.Sequencer.Trigger.Connect.ReconnectTrigger': ReconnectTriggerItem,
  'NINA.Sequencer.Trigger.Dome.SynchronizeDomeTrigger': SynchronizeDomeTriggerItem,
  'NINA.Sequencer.Container.SequentialContainer': SequentialContainerItem,
  'NINA.Sequencer.SequenceItem.Platesolving.Center': CenterItem,
  'NINA.Sequencer.Container.DeepSkyObjectContainer': DeepSkyObjectContainerItem,
  'NINA.Sequencer.SequenceItem.Camera.WarmCamera': WarmCameraItem,
};

export { GenericItem };
