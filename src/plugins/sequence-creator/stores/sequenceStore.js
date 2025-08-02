import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// Action templates organized by container type
const actionTemplates = {
  start: [
    {
      id: 'unpark-scope',
      name: 'Unpark Telescope',
      icon: 'telescope',
      description: 'Unpark the telescope mount',
      parameters: {},
      color: 'bg-blue-500',
    },
    {
      id: 'cool-camera',
      name: 'Cool Camera',
      icon: 'snowflake',
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
          default: 10,
          min: 0,
          max: 60,
          step: 1,
          label: 'Cooling Duration (minutes)',
          tooltip: 'Time to actively cool the camera (0 = cool until temperature reached)',
        },
      },
      color: 'bg-cyan-500',
    },
  ],
  target: [
    {
      id: 'target-settings',
      name: 'Target Settings',
      icon: 'crosshairs',
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
      id: 'slew-to-target',
      name: 'Slew to Target',
      icon: 'cursor-arrow-rays',
      description: 'Navigate to target with different options',
      parameters: {
        slewMode: {
          type: 'select',
          options: ['Slew Only', 'Slew and Center', 'Slew, Center and Rotate'],
          default: 'Slew and Center',
          label: 'Slew Mode',
          tooltip: 'Choose how to navigate to the target',
        },
      },
      color: 'bg-indigo-500',
    },
    {
      id: 'run-autofocus',
      name: 'Run Autofocus',
      icon: 'EyeIcon',
      description: 'Perform automatic focusing routine',
      parameters: {},
      color: 'bg-yellow-500',
    },
    {
      id: 'start-guiding',
      name: 'Start Guiding',
      icon: 'guider',
      description: 'Start autoguiding system',
      parameters: {
        forceCalibration: {
          type: 'boolean',
          default: false,
          label: 'Force Calibration',
          tooltip: 'Force new guider calibration',
        },
      },
      color: 'bg-red-500',
    },
    {
      id: 'smart-exposure',
      name: 'Smart Exposure (Imaging)',
      icon: 'CameraIcon',
      description: 'Intelligent exposure sequence with dithering and triggers',
      parameters: {
        exposureTime: {
          type: 'number',
          default: 120,
          min: 0.1,
          max: 3600,
          step: 0.1,
          label: 'Exposure Time (s)',
          tooltip: 'Duration of each exposure',
        },
        gain: {
          type: 'number',
          default: 100,
          min: 0,
          max: 500,
          label: 'Gain',
          tooltip: 'Camera gain setting',
        },
        offset: {
          type: 'number',
          default: -1,
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
          options: ['None', 'L', 'R', 'G', 'B', 'Ha', 'OIII', 'SII', 'Clear'],
          default: 'None',
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
          default: 100,
          min: 1,
          max: 1000,
          label: 'Image Count',
          tooltip: 'Number of exposures to take',
        },
        ditherAfter: {
          type: 'number',
          default: 4,
          min: 1,
          max: 20,
          label: 'Dither After N Exposures',
          tooltip: 'Dither frequency',
        },
      },
      color: 'bg-green-500',
    },
  ],
  end: [
    {
      id: 'stop-guiding',
      name: 'Stop Guiding',
      icon: 'guider',
      description: 'Stop autoguiding system',
      parameters: {},
      color: 'bg-red-600',
    },
    {
      id: 'warm-camera',
      name: 'Warm Camera',
      icon: 'fire',
      description: 'Warm up the camera',
      parameters: {
        duration: {
          type: 'number',
          default: 10,
          min: 0,
          max: 60,
          step: 1,
          label: 'Warming Duration (minutes)',
          tooltip: 'Time to actively warm up the camera (0 = warm to ambient temperature)',
        },
      },
      color: 'bg-orange-500',
    },
    {
      id: 'park-scope',
      name: 'Park Telescope',
      icon: 'telescope',
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

  // Global sequence settings
  const enableMeridianFlip = ref(true);

  // Localized templates storage
  const localizedActionTemplates = ref(null);

  // Function to initialize localized templates
  function initializeLocalizedTemplates(t) {
    localizedActionTemplates.value = {
      start: [
        {
          id: 'unpark-scope',
          name: t('plugins.sequenceCreator.actions.unparkTelescope.name'),
          icon: 'telescope',
          description: t('plugins.sequenceCreator.actions.unparkTelescope.description'),
          parameters: {},
          color: 'bg-blue-500',
        },
        {
          id: 'cool-camera',
          name: t('plugins.sequenceCreator.actions.coolCamera.name'),
          icon: 'snowflake',
          description: t('plugins.sequenceCreator.actions.coolCamera.description'),
          parameters: {
            temperature: {
              type: 'number',
              default: -10,
              min: -50,
              max: 30,
              step: 1,
              label: t('plugins.sequenceCreator.actions.coolCamera.temperatureLabel'),
              tooltip: t('plugins.sequenceCreator.actions.coolCamera.temperatureTooltip'),
            },
            duration: {
              type: 'number',
              default: 10,
              min: 0,
              max: 60,
              step: 1,
              label: t('plugins.sequenceCreator.actions.coolCamera.durationLabel'),
              tooltip: t('plugins.sequenceCreator.actions.coolCamera.durationTooltip'),
            },
          },
          color: 'bg-cyan-500',
        },
      ],
      target: [
        {
          id: 'target-settings',
          name: t('plugins.sequenceCreator.actions.targetSettings.name'),
          icon: 'crosshairs',
          description: t('plugins.sequenceCreator.actions.targetSettings.description'),
          parameters: {
            targetName: {
              type: 'text',
              default: 'M31 - Andromeda Galaxy',
              label: t('plugins.sequenceCreator.actions.targetSettings.targetNameLabel'),
              tooltip: t('plugins.sequenceCreator.actions.targetSettings.targetNameTooltip'),
            },
            ra: {
              type: 'text',
              default: '00:42:44',
              label: t('plugins.sequenceCreator.actions.targetSettings.raLabel'),
              tooltip: t('plugins.sequenceCreator.actions.targetSettings.raTooltip'),
            },
            dec: {
              type: 'text',
              default: '+41:16:07',
              label: t('plugins.sequenceCreator.actions.targetSettings.decLabel'),
              tooltip: t('plugins.sequenceCreator.actions.targetSettings.decTooltip'),
            },
            positionAngle: {
              type: 'number',
              default: 0,
              min: -180,
              max: 180,
              step: 0.1,
              label: t('plugins.sequenceCreator.actions.targetSettings.positionAngleLabel'),
              tooltip: t('plugins.sequenceCreator.actions.targetSettings.positionAngleTooltip'),
            },
          },
          color: 'bg-purple-500',
        },
        {
          id: 'slew-to-target',
          name: t('plugins.sequenceCreator.actions.slewToTarget.name'),
          icon: 'cursor-arrow-rays',
          description: t('plugins.sequenceCreator.actions.slewToTarget.description'),
          parameters: {
            slewMode: {
              type: 'select',
              options: ['Slew Only', 'Slew and Center', 'Slew, Center and Rotate'],
              default: 'Slew and Center',
              label: t('plugins.sequenceCreator.actions.slewToTarget.slewModeLabel'),
              tooltip: t('plugins.sequenceCreator.actions.slewToTarget.slewModeTooltip'),
            },
          },
          color: 'bg-indigo-500',
        },
        {
          id: 'run-autofocus',
          name: t('plugins.sequenceCreator.actions.runAutofocus.name'),
          icon: 'EyeIcon',
          description: t('plugins.sequenceCreator.actions.runAutofocus.description'),
          parameters: {},
          color: 'bg-yellow-500',
        },
        {
          id: 'start-guiding',
          name: t('plugins.sequenceCreator.actions.startGuiding.name'),
          icon: 'guider',
          description: t('plugins.sequenceCreator.actions.startGuiding.description'),
          parameters: {
            forceCalibration: {
              type: 'boolean',
              default: false,
              label: t('plugins.sequenceCreator.actions.startGuiding.forceCalibrationLabel'),
              tooltip: t('plugins.sequenceCreator.actions.startGuiding.forceCalibrationTooltip'),
            },
          },
          color: 'bg-red-500',
        },
        {
          id: 'smart-exposure',
          name: t('plugins.sequenceCreator.actions.smartExposure.name'),
          icon: 'CameraIcon',
          description: t('plugins.sequenceCreator.actions.smartExposure.description'),
          parameters: {
            exposureTime: {
              type: 'number',
              default: 120,
              min: 0.1,
              max: 3600,
              step: 0.1,
              label: t('plugins.sequenceCreator.actions.smartExposure.exposureTimeLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.exposureTimeTooltip'),
            },
            gain: {
              type: 'number',
              default: 100,
              min: 0,
              max: 500,
              label: t('plugins.sequenceCreator.actions.smartExposure.gainLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.gainTooltip'),
            },
            offset: {
              type: 'number',
              default: -1,
              min: -100,
              max: 100,
              label: t('plugins.sequenceCreator.actions.smartExposure.offsetLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.offsetTooltip'),
            },
            binning: {
              type: 'select',
              options: ['1x1', '2x2', '3x3', '4x4'],
              default: '1x1',
              label: t('plugins.sequenceCreator.actions.smartExposure.binningLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.binningTooltip'),
            },
            filter: {
              type: 'select',
              options: ['None', 'L', 'R', 'G', 'B', 'Ha', 'OIII', 'SII', 'Clear'],
              default: 'None',
              label: t('plugins.sequenceCreator.actions.smartExposure.filterLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.filterTooltip'),
            },
            imageType: {
              type: 'select',
              options: ['LIGHT', 'DARK', 'FLAT', 'BIAS', 'SNAPSHOT'],
              default: 'LIGHT',
              label: t('plugins.sequenceCreator.actions.smartExposure.imageTypeLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.imageTypeTooltip'),
            },
            count: {
              type: 'number',
              default: 100,
              min: 1,
              max: 1000,
              label: t('plugins.sequenceCreator.actions.smartExposure.countLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.countTooltip'),
            },
            ditherAfter: {
              type: 'number',
              default: 4,
              min: 1,
              max: 20,
              label: t('plugins.sequenceCreator.actions.smartExposure.ditherAfterLabel'),
              tooltip: t('plugins.sequenceCreator.actions.smartExposure.ditherAfterTooltip'),
            },
          },
          color: 'bg-green-500',
        },
      ],
      end: [
        {
          id: 'stop-guiding',
          name: t('plugins.sequenceCreator.actions.stopGuiding.name'),
          icon: 'guider',
          description: t('plugins.sequenceCreator.actions.stopGuiding.description'),
          parameters: {},
          color: 'bg-red-600',
        },
        {
          id: 'warm-camera',
          name: t('plugins.sequenceCreator.actions.warmCamera.name'),
          icon: 'fire',
          description: t('plugins.sequenceCreator.actions.warmCamera.description'),
          parameters: {
            duration: {
              type: 'number',
              default: 10,
              min: 0,
              max: 60,
              step: 1,
              label: t('plugins.sequenceCreator.actions.warmCamera.durationLabel'),
              tooltip: t('plugins.sequenceCreator.actions.warmCamera.durationTooltip'),
            },
          },
          color: 'bg-orange-500',
        },
        {
          id: 'park-scope',
          name: t('plugins.sequenceCreator.actions.parkTelescope.name'),
          icon: 'telescope',
          description: t('plugins.sequenceCreator.actions.parkTelescope.description'),
          parameters: {},
          color: 'bg-blue-500',
        },
      ],
    };
  }

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

    // Add Meridian Flip Trigger at root level if enabled (matching seqKomp.json structure)
    if (enableMeridianFlip.value) {
      sequence.Triggers.$values.push({
        $id: generateId(),
        $type: 'NINA.Sequencer.Trigger.MeridianFlip.MeridianFlipTrigger, NINA.Sequencer',
        Parent: { $ref: '1' },
        TriggerRunner: {
          $id: generateId(),
          $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
          Strategy: {
            $type: 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer',
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
      });
    }

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

    // Find target settings action to extract coordinates
    const targetSettingsAction = actions.find((action) => action.type === 'target-settings');

    // Parse RA and Dec coordinates from target-settings
    let raHours = 0,
      raMinutes = 0,
      raSeconds = 0.0;
    let negativeDecFlag = false,
      decDegrees = 0,
      decMinutes = 0,
      decSeconds = 0.0;
    let targetName = 'Basic Sequence Target';
    let positionAngle = 0.0;

    if (targetSettingsAction && targetSettingsAction.parameters) {
      // Extract target name
      if (targetSettingsAction.parameters.targetName?.value) {
        targetName = targetSettingsAction.parameters.targetName.value;
      }

      // Extract position angle
      if (targetSettingsAction.parameters.positionAngle?.value !== undefined) {
        positionAngle = targetSettingsAction.parameters.positionAngle.value;
      }

      // Parse RA (HH:MM:SS format)
      if (targetSettingsAction.parameters.ra?.value) {
        const raString = targetSettingsAction.parameters.ra.value.toString();
        const raParts = raString.split(':');
        if (raParts.length >= 1) raHours = parseInt(raParts[0]) || 0;
        if (raParts.length >= 2) raMinutes = parseInt(raParts[1]) || 0;
        if (raParts.length >= 3) raSeconds = parseFloat(raParts[2]) || 0.0;
      }

      // Parse Dec (±DD:MM:SS format)
      if (targetSettingsAction.parameters.dec?.value) {
        const decString = targetSettingsAction.parameters.dec.value.toString();
        negativeDecFlag = decString.startsWith('-');
        const cleanDecString = decString.replace(/^[+-]/, '');
        const decParts = cleanDecString.split(':');
        if (decParts.length >= 1) decDegrees = parseInt(decParts[0]) || 0;
        if (decParts.length >= 2) decMinutes = parseInt(decParts[1]) || 0;
        if (decParts.length >= 3) decSeconds = parseFloat(decParts[2]) || 0.0;
      }
    }

    const dsoContainer = {
      $id: dsoContainerId,
      $type: 'NINA.Sequencer.Container.DeepSkyObjectContainer, NINA.Sequencer',
      Target: {
        $id: generateId(),
        $type: 'NINA.Astrometry.InputTarget, NINA.Astrometry',
        Expanded: true,
        TargetName: targetName,
        PositionAngle: positionAngle,
        InputCoordinates: {
          $id: generateId(),
          $type: 'NINA.Astrometry.InputCoordinates, NINA.Astrometry',
          RAHours: raHours,
          RAMinutes: raMinutes,
          RASeconds: raSeconds,
          NegativeDec: negativeDecFlag,
          DecDegrees: decDegrees,
          DecMinutes: decMinutes,
          DecSeconds: decSeconds,
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
      Name: targetName,
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
          $values: [],
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
            Iterations: action.parameters.count?.value || 100,
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
            Filter:
              action.parameters.filter?.value && action.parameters.filter.value !== 'None'
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
            ExposureTime: action.parameters.exposureTime?.value || 120.0,
            Gain: action.parameters.gain?.value || 100,
            Offset: action.parameters.offset?.value || -1,
            Binning: {
              $id: generateId(),
              $type: 'NINA.Core.Model.Equipment.BinningMode, NINA.Core',
              X: parseInt((action.parameters.binning?.value || '1x1').split('x')[0]) || 1,
              Y: parseInt((action.parameters.binning?.value || '1x1').split('x')[1]) || 1,
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
        $values: [
          {
            $id: generateId(),
            $type: 'NINA.Sequencer.Trigger.Guider.DitherAfterExposures, NINA.Sequencer',
            AfterExposures: action.parameters.ditherAfter?.value || 4,
            Parent: null,
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
                    $type: 'NINA.Sequencer.SequenceItem.Guider.Dither, NINA.Sequencer',
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

    // Map action types to N.I.N.A types - slew-to-target will be handled specially
    const ninaTypeMap = {
      'unpark-scope': 'NINA.Sequencer.SequenceItem.Telescope.UnparkScope, NINA.Sequencer',
      'park-scope': 'NINA.Sequencer.SequenceItem.Telescope.ParkScope, NINA.Sequencer',
      'cool-camera': 'NINA.Sequencer.SequenceItem.Camera.CoolCamera, NINA.Sequencer',
      'warm-camera': 'NINA.Sequencer.SequenceItem.Camera.WarmCamera, NINA.Sequencer',
      'run-autofocus': 'NINA.Sequencer.SequenceItem.Autofocus.RunAutofocus, NINA.Sequencer',
      'start-guiding': 'NINA.Sequencer.SequenceItem.Guider.StartGuiding, NINA.Sequencer',
      'stop-guiding': 'NINA.Sequencer.SequenceItem.Guider.StopGuiding, NINA.Sequencer',
    };

    // Determine the N.I.N.A type and properties
    let ninaType;
    let additionalProperties = {};

    // Handle slew-to-target specially based on slewMode parameter
    if (action.type === 'slew-to-target') {
      const slewMode = action.parameters.slewMode?.value || 'Slew and Center';

      switch (slewMode) {
        case 'Slew Only':
          ninaType = 'NINA.Sequencer.SequenceItem.Telescope.SlewScopeToRaDec, NINA.Sequencer';
          additionalProperties.Inherited = true;
          additionalProperties.Coordinates = {
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
        case 'Slew and Center':
          ninaType = 'NINA.Sequencer.SequenceItem.Platesolving.Center, NINA.Sequencer';
          additionalProperties.Inherited = true;
          additionalProperties.Coordinates = {
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
        case 'Slew, Center and Rotate':
          ninaType = 'NINA.Sequencer.SequenceItem.Platesolving.CenterAndRotate, NINA.Sequencer';
          additionalProperties.PositionAngle = 0.0;
          additionalProperties.Inherited = true;
          additionalProperties.Coordinates = {
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
      }
    } else {
      ninaType =
        ninaTypeMap[action.type] ||
        'NINA.Sequencer.SequenceItem.Utility.Annotation, NINA.Sequencer';
    }

    const ninaItem = {
      ...baseItem,
      $type: ninaType,
      ...additionalProperties,
    };

    // Add specific properties based on action type
    switch (action.type) {
      case 'cool-camera':
        ninaItem.Temperature = action.parameters.temperature?.value || -10.0;
        ninaItem.Duration = action.parameters.duration?.value || 0;
        break;
      case 'warm-camera':
        ninaItem.Duration = action.parameters.duration?.value || 0;
        break;
      case 'slew-to-target':
        // Properties already set above based on slewMode
        break;
      case 'run-autofocus':
        // Run autofocus has no additional parameters
        break;
      case 'start-guiding':
        ninaItem.ForceCalibration = action.parameters.forceCalibration?.value || false;
        break;
      case 'stop-guiding':
        // Stop guiding has no additional parameters
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
    if (actionTemplates.target.find((t) => t.id === 'slew-to-target')) {
      addAction(
        actionTemplates.target.find((t) => t.id === 'slew-to-target'),
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
    actionTemplates: computed(() => localizedActionTemplates.value || actionTemplates),
    enableMeridianFlip,

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
    initializeLocalizedTemplates,
  };
});
