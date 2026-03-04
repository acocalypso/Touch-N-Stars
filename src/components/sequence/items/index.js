import TakeExposureItem from './TakeExposureItem.vue';
import SwitchFilterItem from './SwitchFilterItem.vue';
import LoopConditionItem from './LoopConditionItem.vue';
import DitherAfterExposuresItem from './DitherAfterExposuresItem.vue';
import SmartExposureItem from './SmartExposureItem.vue';
import RunAutofocusItem from './RunAutofocusItem.vue';
import SequentialContainerItem from './SequentialContainerItem.vue';
import GenericItem from './GenericItem.vue';

export const ITEM_COMPONENTS = {
  'NINA.Sequencer.SequenceItem.Imaging.TakeExposure': TakeExposureItem,
  'NINA.Sequencer.SequenceItem.FilterWheel.SwitchFilter': SwitchFilterItem,
  'NINA.Sequencer.Conditions.LoopCondition': LoopConditionItem,
  'NINA.Sequencer.Trigger.Guider.DitherAfterExposures': DitherAfterExposuresItem,
  'NINA.Sequencer.SequenceItem.Imaging.SmartExposure': SmartExposureItem,
  'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus': RunAutofocusItem,
  'NINA.Sequencer.Container.SequentialContainer': SequentialContainerItem,
};

export { GenericItem };
