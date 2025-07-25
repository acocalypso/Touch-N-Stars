import SequenceEditor from './components/SequenceEditor.vue';
import { useSequenceStore } from './store/sequenceStore';

export default {
  install(app) {
    // Register the main component globally
    app.component('SequenceEditor', SequenceEditor);

    // Make the store available
    app.config.globalProperties.$sequenceStore = useSequenceStore;
  },
};

export { SequenceEditor, useSequenceStore };
