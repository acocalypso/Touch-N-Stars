import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// Action templates based on N.I.N.A sequence structure
const actionTemplates = [
  // Telescope Actions
  {
    id: 'unpark-scope',
    name: 'Unpark Telescope',
    category: 'Telescope',
    icon: '🔭',
    description: 'Unpark the telescope mount',
    parameters: {},
    color: 'bg-blue-500',
  },
  {
    id: 'park-scope',
    name: 'Park Telescope',
    category: 'Telescope',
    icon: '🔭',
    description: 'Park the telescope mount',
    parameters: {},
    color: 'bg-blue-500',
  },
  {
    id: 'set-tracking',
    name: 'Set Tracking',
    category: 'Telescope',
    icon: '🎯',
    description: 'Enable or disable telescope tracking',
    parameters: {
      trackingMode: {
        type: 'select',
        options: ['Sidereal', 'Lunar', 'Solar', 'Off'],
        default: 'Sidereal',
      },
    },
    color: 'bg-blue-500',
  },
  {
    id: 'slew-to-target',
    name: 'Slew to Target',
    category: 'Telescope',
    icon: '🎯',
    description: 'Slew telescope to specified coordinates',
    parameters: {
      targetName: { type: 'text', default: 'M31' },
      ra: { type: 'text', default: '00:42:44' },
      dec: { type: 'text', default: '+41:16:07' },
    },
    color: 'bg-blue-500',
  },

  // Imaging Actions
  {
    id: 'take-exposure',
    name: 'Take Exposure',
    category: 'Imaging',
    icon: '📸',
    description: 'Capture a single exposure',
    parameters: {
      exposureTime: { type: 'number', default: 300, min: 0.1, max: 3600, step: 0.1 },
      gain: { type: 'number', default: 88, min: 0, max: 200 },
      offset: { type: 'number', default: 10, min: -50, max: 100 },
      binning: { type: 'select', options: ['1x1', '2x2', '3x3', '4x4'], default: '1x1' },
      imageType: { type: 'select', options: ['LIGHT', 'DARK', 'FLAT', 'BIAS'], default: 'LIGHT' },
      count: { type: 'number', default: 1, min: 1, max: 1000 },
    },
    color: 'bg-green-500',
  },
  {
    id: 'smart-exposure',
    name: 'Smart Exposure',
    category: 'Imaging',
    icon: '🤖',
    description: 'Intelligent exposure sequence with conditions',
    parameters: {
      exposureTime: { type: 'number', default: 300, min: 0.1, max: 3600, step: 0.1 },
      gain: { type: 'number', default: 88, min: 0, max: 200 },
      count: { type: 'number', default: 10, min: 1, max: 1000 },
      loops: { type: 'number', default: 2, min: 1, max: 100 },
    },
    color: 'bg-green-500',
  },

  // Filter Actions
  {
    id: 'switch-filter',
    name: 'Switch Filter',
    category: 'Filter',
    icon: '🌈',
    description: 'Change the active filter',
    parameters: {
      filter: {
        type: 'select',
        options: ['L', 'R', 'G', 'B', 'Ha', 'OIII', 'SII', 'Clear'],
        default: 'L',
      },
    },
    color: 'bg-purple-500',
  },

  // Focus Actions
  {
    id: 'auto-focus',
    name: 'Auto Focus',
    category: 'Focus',
    icon: '🔍',
    description: 'Perform automatic focusing routine',
    parameters: {
      method: { type: 'select', options: ['HFR', 'Contrast', 'FWHM'], default: 'HFR' },
      samples: { type: 'number', default: 7, min: 3, max: 15 },
    },
    color: 'bg-yellow-500',
  },

  // Guiding Actions
  {
    id: 'start-guiding',
    name: 'Start Guiding',
    category: 'Guiding',
    icon: '🎮',
    description: 'Start autoguiding',
    parameters: {
      settleTime: { type: 'number', default: 10, min: 1, max: 300 },
      settlePixels: { type: 'number', default: 1.5, min: 0.1, max: 10, step: 0.1 },
    },
    color: 'bg-red-500',
  },
  {
    id: 'stop-guiding',
    name: 'Stop Guiding',
    category: 'Guiding',
    icon: '⏹️',
    description: 'Stop autoguiding',
    parameters: {},
    color: 'bg-red-500',
  },
  {
    id: 'dither',
    name: 'Dither',
    category: 'Guiding',
    icon: '🎲',
    description: 'Dither the guiding position',
    parameters: {
      amount: { type: 'number', default: 3, min: 1, max: 20 },
      settleTime: { type: 'number', default: 10, min: 1, max: 300 },
    },
    color: 'bg-red-500',
  },

  // Plate Solving Actions
  {
    id: 'plate-solve',
    name: 'Plate Solve',
    category: 'Plate Solving',
    icon: '🗺️',
    description: 'Solve plate to determine exact position',
    parameters: {
      syncAfter: { type: 'boolean', default: true },
      timeout: { type: 'number', default: 60, min: 10, max: 300 },
    },
    color: 'bg-indigo-500',
  },

  // Utility Actions
  {
    id: 'annotation',
    name: 'Annotation',
    category: 'Utility',
    icon: '📝',
    description: 'Add a text note to the sequence',
    parameters: {
      text: { type: 'text', default: 'Note' },
    },
    color: 'bg-gray-500',
  },
  {
    id: 'wait',
    name: 'Wait',
    category: 'Utility',
    icon: '⏱️',
    description: 'Wait for specified duration',
    parameters: {
      duration: { type: 'number', default: 30, min: 1, max: 3600 },
    },
    color: 'bg-gray-500',
  },
  {
    id: 'conditional',
    name: 'Conditional',
    category: 'Utility',
    icon: '❓',
    description: 'Execute actions based on conditions',
    parameters: {
      condition: {
        type: 'select',
        options: ['Time', 'Altitude', 'Temperature', 'Custom'],
        default: 'Time',
      },
      value: { type: 'text', default: '' },
    },
    color: 'bg-gray-500',
  },
];

export const useSequenceStore = defineStore('sequence', () => {
  // State
  const sequence = ref([]);
  const history = ref([]);
  const historyIndex = ref(-1);
  const selectedAction = ref(null);
  const draggedAction = ref(null);
  const isModified = ref(false);

  // Computed
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  const sequenceIsValid = computed(() => {
    return (
      sequence.value.length > 0 &&
      sequence.value.every((action) => action.name && action.id && action.type)
    );
  });

  const sequenceJSON = computed(() => {
    // Generate N.I.N.A compatible JSON structure
    const ninaSequence = {
      $id: '1',
      $type: 'NINA.Sequencer.Container.SequenceRootContainer, NINA.Sequencer',
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'Touch-N-Stars Custom Sequence',
      Conditions: {
        $id: '2',
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      IsExpanded: true,
      Items: {
        $id: '3',
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: sequence.value.map((action, index) => convertActionToNina(action, index + 4)),
      },
      Triggers: {
        $id: String(sequence.value.length + 4),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: null,
      ErrorBehavior: 0,
      Attempts: 1,
    };

    return JSON.stringify(ninaSequence, null, 2);
  });

  // Helper function to convert our actions to N.I.N.A format
  function convertActionToNina(action, id) {
    const baseItem = {
      $id: String(id),
      Parent: null,
      ErrorBehavior: 0,
      Attempts: 1,
    };

    // Map our action types to N.I.N.A types
    const ninaTypeMap = {
      'unpark-scope': 'NINA.Sequencer.SequenceItem.Telescope.UnparkScope, NINA.Sequencer',
      'park-scope': 'NINA.Sequencer.SequenceItem.Telescope.ParkScope, NINA.Sequencer',
      'set-tracking': 'NINA.Sequencer.SequenceItem.Telescope.SetTracking, NINA.Sequencer',
      'slew-to-target': 'NINA.Sequencer.SequenceItem.Telescope.SlewToCoordinates, NINA.Sequencer',
      'take-exposure': 'NINA.Sequencer.SequenceItem.Imaging.TakeExposure, NINA.Sequencer',
      'smart-exposure': 'NINA.Sequencer.SequenceItem.Imaging.SmartExposure, NINA.Sequencer',
      'switch-filter': 'NINA.Sequencer.SequenceItem.FilterWheel.SwitchFilter, NINA.Sequencer',
      'auto-focus': 'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus, NINA.Sequencer',
      'start-guiding': 'NINA.Sequencer.SequenceItem.Guider.StartGuiding, NINA.Sequencer',
      'stop-guiding': 'NINA.Sequencer.SequenceItem.Guider.StopGuiding, NINA.Sequencer',
      dither: 'NINA.Sequencer.SequenceItem.Guider.Dither, NINA.Sequencer',
      'plate-solve': 'NINA.Sequencer.SequenceItem.PlateSolving.SolveAndSync, NINA.Sequencer',
      annotation: 'NINA.Sequencer.SequenceItem.Utility.Annotation, NINA.Sequencer',
      wait: 'NINA.Sequencer.SequenceItem.Utility.WaitForTime, NINA.Sequencer',
      conditional: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
    };

    const ninaItem = {
      ...baseItem,
      $type:
        ninaTypeMap[action.type] ||
        'NINA.Sequencer.SequenceItem.Utility.Annotation, NINA.Sequencer',
    };

    // Add specific properties based on action type
    switch (action.type) {
      case 'set-tracking':
        ninaItem.TrackingMode = action.parameters.trackingMode?.value === 'Sidereal' ? 0 : 1;
        break;
      case 'take-exposure':
        ninaItem.ExposureTime = action.parameters.exposureTime?.value || 300;
        ninaItem.Gain = action.parameters.gain?.value || 88;
        ninaItem.Offset = action.parameters.offset?.value || 10;
        ninaItem.Binning = {
          $type: 'NINA.Core.Model.Equipment.BinningMode, NINA.Core',
          X: 1,
          Y: 1,
        };
        ninaItem.ImageType = action.parameters.imageType?.value || 'LIGHT';
        ninaItem.ExposureCount = action.parameters.count?.value || 1;
        break;
      case 'switch-filter':
        ninaItem.Filter = action.parameters.filter?.value || null;
        break;
      case 'annotation':
        ninaItem.Text = action.parameters.text?.value || 'Note';
        break;
      case 'wait':
        ninaItem.Time = action.parameters.duration?.value || 30;
        break;
    }

    return ninaItem;
  }

  const actionsByCategory = computed(() => {
    const categories = {};
    actionTemplates.forEach((template) => {
      if (!categories[template.category]) {
        categories[template.category] = [];
      }
      categories[template.category].push(template);
    });
    return categories;
  });

  // Actions
  function addToHistory() {
    // Remove any history after current index
    history.value = history.value.slice(0, historyIndex.value + 1);
    // Add current state
    history.value.push(JSON.parse(JSON.stringify(sequence.value)));
    historyIndex.value = history.value.length - 1;
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift();
      historyIndex.value--;
    }
    isModified.value = true;
  }

  function addAction(template, index = null) {
    const action = {
      id: uuidv4(),
      type: template.id,
      name: template.name,
      category: template.category,
      icon: template.icon,
      description: template.description,
      parameters: JSON.parse(JSON.stringify(template.parameters)),
      color: template.color,
      enabled: true,
    };

    // Set default parameter values
    Object.keys(action.parameters).forEach((key) => {
      const param = action.parameters[key];
      if (param.default !== undefined) {
        action.parameters[key].value = param.default;
      }
    });

    if (index !== null) {
      sequence.value.splice(index, 0, action);
    } else {
      sequence.value.push(action);
    }

    addToHistory();
    return action;
  }

  function removeAction(actionId) {
    const index = sequence.value.findIndex((action) => action.id === actionId);
    if (index !== -1) {
      sequence.value.splice(index, 1);
      addToHistory();
    }
  }

  function moveAction(oldIndex, newIndex) {
    const action = sequence.value[oldIndex];
    sequence.value.splice(oldIndex, 1);
    sequence.value.splice(newIndex, 0, action);
    addToHistory();
  }

  function duplicateAction(actionId) {
    const index = sequence.value.findIndex((action) => action.id === actionId);
    if (index !== -1) {
      const original = sequence.value[index];
      const duplicate = {
        ...JSON.parse(JSON.stringify(original)),
        id: uuidv4(),
        name: `${original.name} (Copy)`,
      };
      sequence.value.splice(index + 1, 0, duplicate);
      addToHistory();
    }
  }

  function updateActionParameter(actionId, parameterKey, value) {
    const action = sequence.value.find((action) => action.id === actionId);
    if (action && action.parameters[parameterKey]) {
      action.parameters[parameterKey].value = value;
      isModified.value = true;
    }
  }

  function toggleActionEnabled(actionId) {
    const action = sequence.value.find((action) => action.id === actionId);
    if (action) {
      action.enabled = !action.enabled;
      isModified.value = true;
    }
  }

  function clearSequence() {
    sequence.value = [];
    addToHistory();
  }

  function loadSequence(sequenceData) {
    try {
      const parsed = typeof sequenceData === 'string' ? JSON.parse(sequenceData) : sequenceData;
      sequence.value = parsed.actions || [];
      addToHistory();
      isModified.value = false;
    } catch (error) {
      console.error('Failed to load sequence:', error);
    }
  }

  function undo() {
    if (canUndo.value) {
      historyIndex.value--;
      sequence.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
    }
  }

  function redo() {
    if (canRedo.value) {
      historyIndex.value++;
      sequence.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
    }
  }

  function getActionTemplate(type) {
    return actionTemplates.find((template) => template.id === type);
  }

  function selectAction(action) {
    selectedAction.value = action;
  }

  function setDraggedAction(action) {
    draggedAction.value = action;
  }

  // Initialize with empty history
  if (history.value.length === 0) {
    addToHistory();
  }

  return {
    // State
    sequence,
    selectedAction,
    draggedAction,
    isModified,
    actionTemplates,

    // Computed
    canUndo,
    canRedo,
    sequenceIsValid,
    sequenceJSON,
    actionsByCategory,

    // Actions
    addAction,
    removeAction,
    moveAction,
    duplicateAction,
    updateActionParameter,
    toggleActionEnabled,
    clearSequence,
    loadSequence,
    undo,
    redo,
    getActionTemplate,
    selectAction,
    setDraggedAction,
  };
});
