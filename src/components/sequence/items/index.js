import TakeExposureItem from './TakeExposureItem.vue';
import SwitchFilterItem from './SwitchFilterItem.vue';
import LoopConditionItem from './LoopConditionItem.vue';
import DitherAfterExposuresItem from './DitherAfterExposuresItem.vue';
import GenericItem from './GenericItem.vue';

export const ITEM_COMPONENTS = {
  'NINA.Sequencer.SequenceItem.Imaging.TakeExposure': TakeExposureItem,
  'NINA.Sequencer.SequenceItem.FilterWheel.SwitchFilter': SwitchFilterItem,
  'NINA.Sequencer.Conditions.LoopCondition': LoopConditionItem,
  'NINA.Sequencer.Trigger.Guider.DitherAfterExposures': DitherAfterExposuresItem,
};

export { GenericItem };
