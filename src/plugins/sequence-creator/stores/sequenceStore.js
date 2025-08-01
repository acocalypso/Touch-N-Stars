import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// Action templates organized by container type
const actionTemplates = {
  start: [
    {
      id: 'unpark-scope',
      name: 'Unpark Telescope',
      icon: '🔭',
      description: 'Unpark the telescope mount',
      parameters: {},
      color: 'bg-blue-500',
    },
    {
      id: 'cool-camera',
      name: 'Cool Camera',
      icon: '❄️',
      description: 'Cool the camera to specified temperature',
      parameters: {
        temperature: {
          type: 'number',
          default: -10,
          min: -50,
          max: 30,
          step: 1,
          label: 'Temperature (°C)',
          tooltip: 'Target temperature for camera cooling',
        },
        duration: {
          type: 'number',
          default: 0,
          min: 0,
          max: 3600,
          step: 1,
          label: 'Duration (seconds)',
          tooltip: 'Time to wait for cooling (0 = no wait)',
        },
      },
      color: 'bg-cyan-500',
    },
  ],
  target: [
    {
      id: 'target-settings',
      name: 'Target Settings',
      icon: '🎯',
      description: 'Define target coordinates and settings',
      parameters: {
        targetName: {
          type: 'text',
          default: 'M31 - Andromeda Galaxy',
          label: 'Target Name',
          tooltip: 'Name of the celestial object',
        },
        ra: {
          type: 'text',
          default: '00:42:44',
          label: 'Right Ascension',
          tooltip: 'RA in HH:MM:SS format',
        },
        dec: {
          type: 'text',
          default: '+41:16:07',
          label: 'Declination',
          tooltip: 'Dec in DD:MM:SS format',
        },
        positionAngle: {
          type: 'number',
          default: 0,
          min: -180,
          max: 180,
          step: 0.1,
          label: 'Position Angle (°)',
          tooltip: 'Camera rotation angle',
        },
      },
      color: 'bg-purple-500',
    },
    {
      id: 'center-target',
      name: 'Center Target (Plate Solve)',
      icon: '🎯',
      description: 'Slew and center on target using plate solving',
      parameters: {
        tolerance: {
          type: 'number',
          default: 30,
          min: 1,
          max: 300,
          label: 'Tolerance (arcsec)',
          tooltip: 'Maximum allowed deviation from target',
        },
        attempts: {
          type: 'number',
          default: 3,
          min: 1,
          max: 10,
          label: 'Max Attempts',
          tooltip: 'Maximum centering attempts',
        },
      },
      color: 'bg-indigo-500',
    },
    {
      id: 'run-autofocus',
      name: 'Run Autofocus',
      icon: '🔍',
      description: 'Perform automatic focusing routine',
      parameters: {
        method: {
          type: 'select',
          options: ['HFR', 'Contrast', 'FWHM'],
          default: 'HFR',
          label: 'Focus Method',
          tooltip: 'Algorithm used for focusing',
        },
        samples: {
          type: 'number',
          default: 7,
          min: 3,
          max: 15,
          label: 'Sample Points',
          tooltip: 'Number of focus positions to sample',
        },
        initialStep: {
          type: 'number',
          default: 100,
          min: 10,
          max: 1000,
          label: 'Initial Step Size',
          tooltip: 'Initial focuser step size',
        },
      },
      color: 'bg-yellow-500',
    },
    {
      id: 'start-guiding',
      name: 'Start Guiding',
      icon: '🎮',
      description: 'Start autoguiding system',
      parameters: {
        forceCalibration: {
          type: 'boolean',
          default: false,
          label: 'Force Calibration',
          tooltip: 'Force new guider calibration',
        },
        settleTime: {
          type: 'number',
          default: 10,
          min: 1,
          max: 300,
          label: 'Settle Time (s)',
          tooltip: 'Time to wait for guiding to settle',
        },
        settlePixels: {
          type: 'number',
          default: 1.5,
          min: 0.1,
          max: 10,
          step: 0.1,
          label: 'Settle Threshold (px)',
          tooltip: 'Maximum pixel deviation for settled guiding',
        },
      },
      color: 'bg-red-500',
    },
    {
      id: 'smart-exposure',
      name: 'Smart Exposure (Imaging)',
      icon: '📸',
      description: 'Intelligent exposure sequence with dithering and triggers',
      parameters: {
        exposureTime: {
          type: 'number',
          default: 300,
          min: 0.1,
          max: 3600,
          step: 0.1,
          label: 'Exposure Time (s)',
          tooltip: 'Duration of each exposure',
        },
        gain: {
          type: 'number',
          default: 88,
          min: 0,
          max: 500,
          label: 'Gain',
          tooltip: 'Camera gain setting',
        },
        offset: {
          type: 'number',
          default: 10,
          min: -100,
          max: 100,
          label: 'Offset',
          tooltip: 'Camera offset setting',
        },
        binning: {
          type: 'select',
          options: ['1x1', '2x2', '3x3', '4x4'],
          default: '1x1',
          label: 'Binning',
          tooltip: 'Pixel binning mode',
        },
        filter: {
          type: 'select',
          options: ['L', 'R', 'G', 'B', 'Ha', 'OIII', 'SII', 'Clear'],
          default: 'L',
          label: 'Filter',
          tooltip: 'Filter wheel selection',
        },
        imageType: {
          type: 'select',
          options: ['LIGHT', 'DARK', 'FLAT', 'BIAS', 'SNAPSHOT'],
          default: 'LIGHT',
          label: 'Image Type',
          tooltip: 'Type of exposure to capture',
        },
        count: {
          type: 'number',
          default: 20,
          min: 1,
          max: 1000,
          label: 'Image Count',
          tooltip: 'Number of exposures to take',
        },
        ditherAfter: {
          type: 'number',
          default: 3,
          min: 1,
          max: 20,
          label: 'Dither After N Exposures',
          tooltip: 'Dither frequency',
        },
        ditherAmount: {
          type: 'number',
          default: 3,
          min: 1,
          max: 20,
          label: 'Dither Amount (px)',
          tooltip: 'Dithering distance in pixels',
        },
        meridianFlipEnabled: {
          type: 'boolean',
          default: true,
          label: 'Enable Meridian Flip',
          tooltip: 'Allow automatic meridian flip',
        },
        autofocusAfterHFR: {
          type: 'boolean',
          default: true,
          label: 'Autofocus on HFR Increase',
          tooltip: 'Run autofocus if HFR increases significantly',
        },
        hfrIncrease: {
          type: 'number',
          default: 1.5,
          min: 1.1,
          max: 3.0,
          step: 0.1,
          label: 'HFR Increase Factor',
          tooltip: 'HFR increase threshold for autofocus trigger',
        },
        hfrSampleSize: {
          type: 'number',
          default: 10,
          min: 3,
          max: 50,
          label: 'HFR Sample Size',
          tooltip: 'Number of images to analyze for HFR trend',
        },
      },
      color: 'bg-green-500',
    },
  ],
  end: [
    {
      id: 'warm-camera',
      name: 'Warm Camera',
      icon: '🌡️',
      description: 'Warm up the camera',
      parameters: {
        duration: {
          type: 'number',
          default: 0,
          min: 0,
          max: 3600,
          step: 1,
          label: 'Duration (seconds)',
          tooltip: 'Time to wait for warming (0 = no wait)',
        },
      },
      color: 'bg-orange-500',
    },
    {
      id: 'park-scope',
      name: 'Park Telescope',
      icon: '🏠',
      description: 'Park the telescope mount',
      parameters: {},
      color: 'bg-blue-500',
    },
  ],
};

export const useSequenceStore = defineStore('sequence', () => {
  // State - three separate containers
  const startSequence = ref([]);
  const targetSequence = ref([]);
  const endSequence = ref([]);

  const history = ref([]);
  const historyIndex = ref(-1);
  const selectedAction = ref(null);
  const isModified = ref(false);

  // Computed
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  const sequenceIsValid = computed(() => {
    // At minimum, we need target settings and smart exposure in target container
    const hasTargetSettings = targetSequence.value.some(
      (action) => action.type === 'target-settings'
    );
    const hasSmartExposure = targetSequence.value.some(
      (action) => action.type === 'smart-exposure'
    );
    return hasTargetSettings && hasSmartExposure;
  });

  const ninaSequenceJSON = computed(() => {
    let idCounter = 1;

    const generateId = () => String(idCounter++);

    // Create N.I.N.A sequence structure exactly matching basic.json format
    const sequence = {
      $id: generateId(),
      $type: 'NINA.Sequencer.Container.SequenceRootContainer, NINA.Sequencer',
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'Sequenz',
      Conditions: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      IsExpanded: true,
      Items: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Triggers: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: null,
      ErrorBehavior: 0,
      Attempts: 1,
    };

    // Add Start Area Container (with nested structure like basic.json)
    const startContainer = createBasicStartContainer(startSequence.value, generateId);
    sequence.Items.$values.push(startContainer);

    // Add Target Area Container (with proper DeepSkyObjectContainer structure)
    const targetContainer = createBasicTargetContainer(targetSequence.value, generateId);
    sequence.Items.$values.push(targetContainer);

    // Add End Area Container (with nested structure like basic.json)
    const endContainer = createBasicEndContainer(endSequence.value, generateId);
    sequence.Items.$values.push(endContainer);

    return JSON.stringify(sequence, null, 2);
  });

  // Helper function to create basic start container (matches basic.json structure)
  function createBasicStartContainer(actions, generateId) {
    const startId = generateId();
    const basicSequenceStartId = generateId();
    const equipmentCheckId = generateId();

    return {
      $id: startId,
      $type: 'NINA.Sequencer.Container.StartAreaContainer, NINA.Sequencer',
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'Start',
      Conditions: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      IsExpanded: true,
      Items: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: [
          {
            $id: basicSequenceStartId,
            $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
            Strategy: {
              $type:
                'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
            },
            Name: 'BASIC SEQUENCE START',
            Conditions: {
              $id: generateId(),
              $type:
                'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
              $values: [],
            },
            IsExpanded: true,
            Items: {
              $id: generateId(),
              $type:
                'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
              $values: [
                {
                  $id: generateId(),
                  $type: 'NINA.Sequencer.SequenceItem.Utility.Annotation, NINA.Sequencer',
                  Text: 'VERSION: 1',
                  Parent: { $ref: basicSequenceStartId },
                  ErrorBehavior: 0,
                  Attempts: 1,
                },
                {
                  $id: equipmentCheckId,
                  $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
                  Strategy: {
                    $type:
                      'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
                  },
                  Name: 'EQUIPMENT_CHECK',
                  Conditions: {
                    $id: generateId(),
                    $type:
                      'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
                    $values: [],
                  },
                  IsExpanded: true,
                  Items: {
                    $id: generateId(),
                    $type:
                      'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
                    $values: actions.map((action) =>
                      convertActionToNina(action, generateId, equipmentCheckId)
                    ),
                  },
                  Triggers: {
                    $id: generateId(),
                    $type:
                      'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
                    $values: [],
                  },
                  Parent: { $ref: basicSequenceStartId },
                  ErrorBehavior: 0,
                  Attempts: 1,
                },
              ],
            },
            Triggers: {
              $id: generateId(),
              $type:
                'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
              $values: [],
            },
            Parent: { $ref: startId },
            ErrorBehavior: 0,
            Attempts: 1,
          },
        ],
      },
      Triggers: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: { $ref: '1' },
      ErrorBehavior: 0,
      Attempts: 1,
    };
  }

  // Helper function to create basic target container (matches basic.json structure)
  function createBasicTargetContainer(actions, generateId) {
    const targetAreaId = generateId();
    const dsoContainerId = generateId();

    return {
      $id: targetAreaId,
      $type: 'NINA.Sequencer.Container.TargetAreaContainer, NINA.Sequencer',
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'Targets',
      Conditions: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      IsExpanded: true,
      Items: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: [
          createBasicDeepSkyObjectContainer(actions, generateId, dsoContainerId, targetAreaId),
        ],
      },
      Triggers: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: { $ref: '1' },
      ErrorBehavior: 0,
      Attempts: 1,
    };
  }

  // Helper function to create basic end container (matches basic.json structure)
  function createBasicEndContainer(actions, generateId) {
    const endId = generateId();
    const basicSequenceEndId = generateId();
    const endInstructionsId = generateId();

    return {
      $id: endId,
      $type: 'NINA.Sequencer.Container.EndAreaContainer, NINA.Sequencer',
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'End',
      Conditions: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      IsExpanded: true,
      Items: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: [
          {
            $id: basicSequenceEndId,
            $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
            Strategy: {
              $type:
                'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
            },
            Name: 'BASIC SEQUENCE END',
            Conditions: {
              $id: generateId(),
              $type:
                'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
              $values: [],
            },
            IsExpanded: true,
            Items: {
              $id: generateId(),
              $type:
                'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
              $values: [
                {
                  $id: endInstructionsId,
                  $type: 'NINA.Sequencer.Container.ParallelContainer, NINA.Sequencer',
                  Strategy: {
                    $type:
                      'NINA.Sequencer.Container.ExecutionStrategy.ParallelStrategy, NINA.Sequencer',
                  },
                  Name: 'END_INSTRUCTIONS',
                  Conditions: {
                    $id: generateId(),
                    $type:
                      'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
                    $values: [],
                  },
                  IsExpanded: true,
                  Items: {
                    $id: generateId(),
                    $type:
                      'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
                    $values: actions.map((action) =>
                      convertActionToNina(action, generateId, endInstructionsId)
                    ),
                  },
                  Triggers: {
                    $id: generateId(),
                    $type:
                      'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
                    $values: [],
                  },
                  Parent: { $ref: basicSequenceEndId },
                  ErrorBehavior: 0,
                  Attempts: 1,
                },
              ],
            },
            Triggers: {
              $id: generateId(),
              $type:
                'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
              $values: [],
            },
            Parent: { $ref: endId },
            ErrorBehavior: 0,
            Attempts: 1,
          },
        ],
      },
      Triggers: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: { $ref: '1' },
      ErrorBehavior: 0,
      Attempts: 1,
    };
  }

  function createBasicDeepSkyObjectContainer(actions, generateId, dsoContainerId, parentId) {
    const targetImagingId = generateId();

    const dsoContainer = {
      $id: dsoContainerId,
      $type: 'NINA.Sequencer.Container.DeepSkyObjectContainer, NINA.Sequencer',
      Target: {
        $id: generateId(),
        $type: 'NINA.Astrometry.InputTarget, NINA.Astrometry',
        Expanded: true,
        TargetName: '',
        PositionAngle: 0.0,
        InputCoordinates: {
          $id: generateId(),
          $type: 'NINA.Astrometry.InputCoordinates, NINA.Astrometry',
          RAHours: 0,
          RAMinutes: 0,
          RASeconds: 0.0,
          NegativeDec: false,
          DecDegrees: 0,
          DecMinutes: 0,
          DecSeconds: 0.0,
        },
      },
      ExposureInfoListExpanded: false,
      ExposureInfoList: {
        $id: generateId(),
        $type:
          'NINA.Core.Utility.AsyncObservableCollection`1[[NINA.Sequencer.Utility.ExposureInfo, NINA.Sequencer]], NINA.Core',
        $values: [],
      },
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'Basic Sequence Target',
      Conditions: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      IsExpanded: true,
      Items: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Triggers: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: { $ref: parentId },
      ErrorBehavior: 0,
      Attempts: 1,
    };

    // Add actions to DSO container (excluding target-settings and smart-exposure)
    const regularActions = actions.filter(
      (action) => action.type !== 'target-settings' && action.type !== 'smart-exposure'
    );

    regularActions.forEach((action) => {
      dsoContainer.Items.$values.push(convertActionToNina(action, generateId, dsoContainerId));
    });

    // Add Target Imaging Instructions container with Smart Exposure
    const smartExposureAction = actions.find((action) => action.type === 'smart-exposure');
    if (smartExposureAction) {
      const targetImagingContainer = {
        $id: targetImagingId,
        $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
        Strategy: {
          $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
        },
        Name: 'Target Imaging Instructions',
        Conditions: {
          $id: generateId(),
          $type:
            'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
          $values: [],
        },
        IsExpanded: true,
        Items: {
          $id: generateId(),
          $type:
            'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
          $values: [createBasicSmartExposureContainer(smartExposureAction, generateId)],
        },
        Triggers: {
          $id: generateId(),
          $type:
            'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
          $values: [
            // Meridian Flip Trigger
            {
              $id: generateId(),
              $type: 'NINA.Sequencer.Trigger.MeridianFlip.MeridianFlipTrigger, NINA.Sequencer',
              Parent: { $ref: targetImagingId },
              TriggerRunner: {
                $id: generateId(),
                $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
                Strategy: {
                  $type:
                    'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
                },
                Name: null,
                Conditions: {
                  $id: generateId(),
                  $type:
                    'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
                  $values: [],
                },
                IsExpanded: true,
                Items: {
                  $id: generateId(),
                  $type:
                    'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
                  $values: [],
                },
                Triggers: {
                  $id: generateId(),
                  $type:
                    'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
                  $values: [],
                },
                Parent: null,
                ErrorBehavior: 0,
                Attempts: 1,
              },
            },
            // Autofocus Trigger
            {
              $id: generateId(),
              $type:
                'NINA.Sequencer.Trigger.Autofocus.AutofocusAfterHFRIncreaseTrigger, NINA.Sequencer',
              Amount: 5.0,
              SampleSize: 10,
              Parent: { $ref: targetImagingId },
              TriggerRunner: {
                $id: generateId(),
                $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
                Strategy: {
                  $type:
                    'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
                },
                Name: null,
                Conditions: {
                  $id: generateId(),
                  $type:
                    'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
                  $values: [],
                },
                IsExpanded: true,
                Items: {
                  $id: generateId(),
                  $type:
                    'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
                  $values: [
                    {
                      $id: generateId(),
                      $type: 'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus, NINA.Sequencer',
                      Parent: null,
                      ErrorBehavior: 0,
                      Attempts: 1,
                    },
                  ],
                },
                Triggers: {
                  $id: generateId(),
                  $type:
                    'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
                  $values: [],
                },
                Parent: null,
                ErrorBehavior: 0,
                Attempts: 1,
              },
            },
          ],
        },
        Parent: { $ref: dsoContainerId },
        ErrorBehavior: 0,
        Attempts: 1,
      };

      dsoContainer.Items.$values.push(targetImagingContainer);
    }

    return dsoContainer;
  }

  function createBasicSmartExposureContainer(action, generateId) {
    const smartExposure = {
      $id: generateId(),
      $type: 'NINA.Sequencer.SequenceItem.Imaging.SmartExposure, NINA.Sequencer',
      ErrorBehavior: 0,
      Attempts: 1,
      Strategy: {
        $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
      },
      Name: 'Smart Exposure',
      Conditions: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Conditions.ISequenceCondition, NINA.Sequencer]], System.ObjectModel',
        $values: [
          {
            $id: generateId(),
            $type: 'NINA.Sequencer.Conditions.LoopCondition, NINA.Sequencer',
            CompletedIterations: 0,
            Iterations: action.parameters.count?.value || 20,
            Parent: null,
          },
        ],
      },
      IsExpanded: false,
      Items: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.SequenceItem.ISequenceItem, NINA.Sequencer]], System.ObjectModel',
        $values: [
          {
            $id: generateId(),
            $type: 'NINA.Sequencer.SequenceItem.FilterWheel.SwitchFilter, NINA.Sequencer',
            Filter: action.parameters.filter?.value
              ? {
                  Name: action.parameters.filter.value,
                  Position: -1,
                  AutoFocusOffset: null,
                  FlatWizardFilterSettings: {
                    HistogramMeanTarget: 0.5,
                    HistogramTolerance: 0.1,
                    MaxFlatExposureTime: 30.0,
                    MinFlatExposureTime: 0.01,
                    StepSize: 0.1,
                  },
                }
              : null,
            Parent: null,
            ErrorBehavior: 0,
            Attempts: 1,
          },
          {
            $id: generateId(),
            $type: 'NINA.Sequencer.SequenceItem.Imaging.TakeExposure, NINA.Sequencer',
            ExposureTime: action.parameters.exposureTime?.value || 300.0,
            Gain: action.parameters.gain?.value || 88,
            Offset: action.parameters.offset?.value || 10,
            Binning: {
              $id: generateId(),
              $type: 'NINA.Core.Model.Equipment.BinningMode, NINA.Core',
              X: 1,
              Y: 1,
            },
            ImageType: action.parameters.imageType?.value || 'LIGHT',
            ExposureCount: 0,
            Parent: null,
            ErrorBehavior: 0,
            Attempts: 1,
          },
        ],
      },
      Triggers: {
        $id: generateId(),
        $type:
          'System.Collections.ObjectModel.ObservableCollection`1[[NINA.Sequencer.Trigger.ISequenceTrigger, NINA.Sequencer]], System.ObjectModel',
        $values: [],
      },
      Parent: null,
    };

    return smartExposure;
  }

  // Helper function to convert actions to N.I.N.A format
  function convertActionToNina(action, generateId, parentId = null) {
    const baseItem = {
      $id: generateId(),
      Parent: parentId ? { $ref: parentId } : null,
      ErrorBehavior: 0,
      Attempts: 1,
    };

    // Map action types to N.I.N.A types
    const ninaTypeMap = {
      'unpark-scope': 'NINA.Sequencer.SequenceItem.Telescope.UnparkScope, NINA.Sequencer',
      'park-scope': 'NINA.Sequencer.SequenceItem.Telescope.ParkScope, NINA.Sequencer',
      'cool-camera': 'NINA.Sequencer.SequenceItem.Camera.CoolCamera, NINA.Sequencer',
      'warm-camera': 'NINA.Sequencer.SequenceItem.Camera.WarmCamera, NINA.Sequencer',
      'center-target': 'NINA.Sequencer.SequenceItem.Platesolving.Center, NINA.Sequencer',
      'run-autofocus': 'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus, NINA.Sequencer',
      'start-guiding': 'NINA.Sequencer.SequenceItem.Guider.StartGuiding, NINA.Sequencer',
    };

    const ninaItem = {
      ...baseItem,
      $type:
        ninaTypeMap[action.type] ||
        'NINA.Sequencer.SequenceItem.Utility.Annotation, NINA.Sequencer',
    };

    // Add specific properties based on action type
    switch (action.type) {
      case 'cool-camera':
        ninaItem.Temperature = action.parameters.temperature?.value || -10.0;
        ninaItem.Duration = action.parameters.duration?.value || 0.0;
        break;
      case 'warm-camera':
        ninaItem.Duration = action.parameters.duration?.value || 0.0;
        break;
      case 'center-target':
        ninaItem.Inherited = true;
        ninaItem.Coordinates = {
          $id: generateId(),
          $type: 'NINA.Astrometry.InputCoordinates, NINA.Astrometry',
          RAHours: 0,
          RAMinutes: 0,
          RASeconds: 0.0,
          NegativeDec: false,
          DecDegrees: 0,
          DecMinutes: 0,
          DecSeconds: 0.0,
        };
        break;
      case 'start-guiding':
        ninaItem.ForceCalibration = action.parameters.forceCalibration?.value || false;
        break;
    }

    return ninaItem;
  }

  // Actions
  function addToHistory() {
    // Remove any history after current index
    history.value = history.value.slice(0, historyIndex.value + 1);
    // Add current state
    history.value.push({
      start: JSON.parse(JSON.stringify(startSequence.value)),
      target: JSON.parse(JSON.stringify(targetSequence.value)),
      end: JSON.parse(JSON.stringify(endSequence.value)),
    });
    historyIndex.value = history.value.length - 1;
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift();
      historyIndex.value--;
    }
    isModified.value = true;
  }

  function addAction(template, containerType, index = null) {
    if (!actionTemplates[containerType]) {
      console.error(`Invalid container type: ${containerType}`);
      return null;
    }

    const action = {
      id: uuidv4(),
      type: template.id,
      name: template.name,
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

    // Add to appropriate container
    let targetContainer;
    switch (containerType) {
      case 'start':
        targetContainer = startSequence;
        break;
      case 'target':
        targetContainer = targetSequence;
        break;
      case 'end':
        targetContainer = endSequence;
        break;
      default:
        console.error(`Unknown container type: ${containerType}`);
        return null;
    }

    if (index !== null) {
      targetContainer.value.splice(index, 0, action);
    } else {
      targetContainer.value.push(action);
    }

    addToHistory();
    return action;
  }

  function removeAction(actionId, containerType) {
    let targetContainer;
    switch (containerType) {
      case 'start':
        targetContainer = startSequence;
        break;
      case 'target':
        targetContainer = targetSequence;
        break;
      case 'end':
        targetContainer = endSequence;
        break;
      default:
        return;
    }

    const index = targetContainer.value.findIndex((action) => action.id === actionId);
    if (index !== -1) {
      targetContainer.value.splice(index, 1);
      addToHistory();
    }
  }

  function moveAction(oldIndex, newIndex, containerType) {
    let targetContainer;
    switch (containerType) {
      case 'start':
        targetContainer = startSequence;
        break;
      case 'target':
        targetContainer = targetSequence;
        break;
      case 'end':
        targetContainer = endSequence;
        break;
      default:
        return;
    }

    const action = targetContainer.value[oldIndex];
    targetContainer.value.splice(oldIndex, 1);
    targetContainer.value.splice(newIndex, 0, action);
    addToHistory();
  }

  function duplicateAction(actionId, containerType) {
    let targetContainer;
    switch (containerType) {
      case 'start':
        targetContainer = startSequence;
        break;
      case 'target':
        targetContainer = targetSequence;
        break;
      case 'end':
        targetContainer = endSequence;
        break;
      default:
        return;
    }

    const index = targetContainer.value.findIndex((action) => action.id === actionId);
    if (index !== -1) {
      const original = targetContainer.value[index];
      const duplicate = {
        ...JSON.parse(JSON.stringify(original)),
        id: uuidv4(),
        name: `${original.name} (Copy)`,
      };
      targetContainer.value.splice(index + 1, 0, duplicate);
      addToHistory();
    }
  }

  function updateActionParameter(actionId, parameterKey, value) {
    // Search all containers for the action
    const containers = [startSequence.value, targetSequence.value, endSequence.value];
    for (const container of containers) {
      const action = container.find((action) => action.id === actionId);
      if (action && action.parameters[parameterKey]) {
        action.parameters[parameterKey].value = value;
        isModified.value = true;
        return;
      }
    }
  }

  function toggleActionEnabled(actionId) {
    const containers = [startSequence.value, targetSequence.value, endSequence.value];
    for (const container of containers) {
      const action = container.find((action) => action.id === actionId);
      if (action) {
        action.enabled = !action.enabled;
        isModified.value = true;
        return;
      }
    }
  }

  function clearSequence() {
    startSequence.value = [];
    targetSequence.value = [];
    endSequence.value = [];
    addToHistory();
  }

  function loadSequence(sequenceData) {
    try {
      const parsed = typeof sequenceData === 'string' ? JSON.parse(sequenceData) : sequenceData;
      startSequence.value = parsed.start || [];
      targetSequence.value = parsed.target || [];
      endSequence.value = parsed.end || [];
      addToHistory();
      isModified.value = false;
    } catch (error) {
      console.error('Failed to load sequence:', error);
    }
  }

  function loadBasicSequence() {
    // Load a basic sequence with recommended actions
    clearSequence();

    // Add basic start actions
    if (actionTemplates.start.find((t) => t.id === 'unpark-scope')) {
      addAction(
        actionTemplates.start.find((t) => t.id === 'unpark-scope'),
        'start'
      );
    }
    if (actionTemplates.start.find((t) => t.id === 'cool-camera')) {
      addAction(
        actionTemplates.start.find((t) => t.id === 'cool-camera'),
        'start'
      );
    }

    // Add basic target actions
    if (actionTemplates.target.find((t) => t.id === 'target-settings')) {
      addAction(
        actionTemplates.target.find((t) => t.id === 'target-settings'),
        'target'
      );
    }
    if (actionTemplates.target.find((t) => t.id === 'center-target')) {
      addAction(
        actionTemplates.target.find((t) => t.id === 'center-target'),
        'target'
      );
    }
    if (actionTemplates.target.find((t) => t.id === 'run-autofocus')) {
      addAction(
        actionTemplates.target.find((t) => t.id === 'run-autofocus'),
        'target'
      );
    }
    if (actionTemplates.target.find((t) => t.id === 'start-guiding')) {
      addAction(
        actionTemplates.target.find((t) => t.id === 'start-guiding'),
        'target'
      );
    }
    if (actionTemplates.target.find((t) => t.id === 'smart-exposure')) {
      addAction(
        actionTemplates.target.find((t) => t.id === 'smart-exposure'),
        'target'
      );
    }

    // Add basic end actions
    if (actionTemplates.end.find((t) => t.id === 'warm-camera')) {
      addAction(
        actionTemplates.end.find((t) => t.id === 'warm-camera'),
        'end'
      );
    }
    if (actionTemplates.end.find((t) => t.id === 'park-scope')) {
      addAction(
        actionTemplates.end.find((t) => t.id === 'park-scope'),
        'end'
      );
    }

    isModified.value = false;
  }

  function undo() {
    if (canUndo.value) {
      historyIndex.value--;
      const state = history.value[historyIndex.value];
      startSequence.value = JSON.parse(JSON.stringify(state.start));
      targetSequence.value = JSON.parse(JSON.stringify(state.target));
      endSequence.value = JSON.parse(JSON.stringify(state.end));
    }
  }

  function redo() {
    if (canRedo.value) {
      historyIndex.value++;
      const state = history.value[historyIndex.value];
      startSequence.value = JSON.parse(JSON.stringify(state.start));
      targetSequence.value = JSON.parse(JSON.stringify(state.target));
      endSequence.value = JSON.parse(JSON.stringify(state.end));
    }
  }

  function getActionTemplate(type, containerType) {
    if (!actionTemplates[containerType]) return null;
    return actionTemplates[containerType].find((template) => template.id === type);
  }

  function selectAction(action) {
    selectedAction.value = action;
  }

  function exportSequenceJSON() {
    return ninaSequenceJSON.value;
  }

  function exportSequenceData() {
    return {
      start: startSequence.value,
      target: targetSequence.value,
      end: endSequence.value,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0',
        generator: 'Touch-N-Stars Sequence Creator',
      },
    };
  }

  // Initialize with empty history
  if (history.value.length === 0) {
    addToHistory();
  }

  return {
    // State
    startSequence,
    targetSequence,
    endSequence,
    selectedAction,
    isModified,
    actionTemplates,

    // Computed
    canUndo,
    canRedo,
    sequenceIsValid,
    ninaSequenceJSON,

    // Actions
    addAction,
    removeAction,
    moveAction,
    duplicateAction,
    updateActionParameter,
    toggleActionEnabled,
    clearSequence,
    loadSequence,
    loadBasicSequence,
    undo,
    redo,
    getActionTemplate,
    selectAction,
    exportSequenceJSON,
    exportSequenceData,
  };
});
