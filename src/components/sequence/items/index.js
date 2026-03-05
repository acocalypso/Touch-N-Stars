import TakeExposureItem from './TakeExposureItem.vue';
import SwitchFilterItem from './SwitchFilterItem.vue';
import LoopConditionItem from './LoopConditionItem.vue';
import LoopForTimeSpanItem from './LoopForTimeSpanItem.vue';
import DitherAfterExposuresItem from './DitherAfterExposuresItem.vue';
import SmartExposureItem from './SmartExposureItem.vue';
import RunAutofocusItem from './RunAutofocusItem.vue';
import SequentialContainerItem from './SequentialContainerItem.vue';
import CenterItem from './CenterItem.vue';
import DeepSkyObjectContainerItem from './DeepSkyObjectContainerItem.vue';
import WarmCameraItem from './WarmCameraItem.vue';
import MoonAltitudeConditionItem from './MoonAltitudeConditionItem.vue';
import GenericItem from './GenericItem.vue';

export const ITEM_COMPONENTS = {
  'NINA.Sequencer.SequenceItem.Imaging.TakeExposure': TakeExposureItem,
  'NINA.Sequencer.SequenceItem.FilterWheel.SwitchFilter': SwitchFilterItem,
  'NINA.Sequencer.Conditions.LoopCondition': LoopConditionItem,
  'NINA.Sequencer.Conditions.TimeSpanCondition': LoopForTimeSpanItem,
  'NINA.Sequencer.Trigger.Guider.DitherAfterExposures': DitherAfterExposuresItem,
  'NINA.Sequencer.SequenceItem.Imaging.SmartExposure': SmartExposureItem,
  'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.UnparkScope': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.ParkScope': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Telescope.FindHome': RunAutofocusItem,
  'NINA.Sequencer.SequenceItem.Guider.StartGuiding': RunAutofocusItem,
  'NINA.Sequencer.Container.SequentialContainer': SequentialContainerItem,
  'NINA.Sequencer.SequenceItem.Platesolving.Center': CenterItem,
  'NINA.Sequencer.Container.DeepSkyObjectContainer': DeepSkyObjectContainerItem,
  'NINA.Sequencer.SequenceItem.Camera.WarmCamera': WarmCameraItem,
  'NINA.Sequencer.Conditions.MoonAltitudeCondition': MoonAltitudeConditionItem,
};

export { GenericItem };
