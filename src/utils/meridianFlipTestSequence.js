// NINA sequence for the real meridian flip test.
//
// The sequence slews to a point a few minutes east of the meridian, turns tracking on and
// then only waits, in steps as long as the user's exposures. NINA's own MeridianFlipTrigger
// sits on the root, so the flip happens exactly as at night: with the profile's flip
// settings, NINA's flip routine and at the real time - and without the app having to stay
// open. The JSON shape follows what the sequence creator plugin produces.

const COLLECTION = (itemType) =>
  `System.Collections.ObjectModel.ObservableCollection\`1[[${itemType}, NINA.Sequencer]], System.ObjectModel`;
const ITEMS = COLLECTION('NINA.Sequencer.SequenceItem.ISequenceItem');
const CONDITIONS = COLLECTION('NINA.Sequencer.Conditions.ISequenceCondition');
const TRIGGERS = COLLECTION('NINA.Sequencer.Trigger.ISequenceTrigger');
const SEQUENTIAL = 'NINA.Sequencer.Container.ExecutionStrategy.SequentialStrategy, NINA.Sequencer';

export const FLIP_TEST_SEQUENCE_NAME = 'TNS meridian flip test';

// Splits RA (hours) and Dec (degrees) into NINA's InputCoordinates fields.
export function toInputCoordinates(raHours, decDeg) {
  const ra = ((raHours % 24) + 24) % 24;
  const raH = Math.floor(ra);
  const raM = Math.floor((ra - raH) * 60);
  const raS = Math.round(((ra - raH) * 60 - raM) * 60 * 100) / 100;
  const dec = Math.abs(decDeg);
  const decD = Math.floor(dec);
  const decM = Math.floor((dec - decD) * 60);
  const decS = Math.round(((dec - decD) * 60 - decM) * 60 * 100) / 100;
  return {
    RAHours: raH,
    RAMinutes: raM,
    RASeconds: raS,
    NegativeDec: decDeg < 0,
    DecDegrees: decD,
    DecMinutes: decM,
    DecSeconds: decS,
  };
}

export function buildFlipTestSequence({ raHours, decDeg, waitSeconds, waitCount }) {
  let nextId = 1;
  const id = () => String(nextId++);

  const container = (type, name, parentId, items = [], conditions = []) => {
    const containerId = id();
    return {
      $id: containerId,
      $type: `NINA.Sequencer.Container.${type}, NINA.Sequencer`,
      Strategy: { $type: SEQUENTIAL },
      Name: name,
      Conditions: { $id: id(), $type: CONDITIONS, $values: conditions(containerId) },
      IsExpanded: true,
      Items: { $id: id(), $type: ITEMS, $values: items(containerId) },
      Triggers: { $id: id(), $type: TRIGGERS, $values: [] },
      Parent: parentId ? { $ref: parentId } : null,
      ErrorBehavior: 0,
      Attempts: 1,
    };
  };
  const none = () => [];

  const rootId = id();
  const root = {
    $id: rootId,
    $type: 'NINA.Sequencer.Container.SequenceRootContainer, NINA.Sequencer',
    Strategy: { $type: SEQUENTIAL },
    Name: FLIP_TEST_SEQUENCE_NAME,
    Conditions: { $id: id(), $type: CONDITIONS, $values: [] },
    IsExpanded: true,
    Items: { $id: id(), $type: ITEMS, $values: [] },
    Triggers: { $id: id(), $type: TRIGGERS, $values: [] },
    Parent: null,
    ErrorBehavior: 0,
    Attempts: 1,
  };

  root.Items.$values.push(container('StartAreaContainer', 'Start', rootId, none, none));

  const target = container(
    'TargetAreaContainer',
    'Targets',
    rootId,
    (targetId) => [
      container(
        'SequentialContainer',
        FLIP_TEST_SEQUENCE_NAME,
        targetId,
        (testId) => [
          {
            $id: id(),
            $type: 'NINA.Sequencer.SequenceItem.Telescope.SlewScopeToRaDec, NINA.Sequencer',
            Inherited: false,
            Coordinates: {
              $id: id(),
              $type: 'NINA.Astrometry.InputCoordinates, NINA.Astrometry',
              ...toInputCoordinates(raHours, decDeg),
            },
            Parent: { $ref: testId },
            ErrorBehavior: 0,
            Attempts: 1,
          },
          {
            $id: id(),
            $type: 'NINA.Sequencer.SequenceItem.Telescope.SetTracking, NINA.Sequencer',
            TrackingMode: 0,
            Parent: { $ref: testId },
            ErrorBehavior: 0,
            Attempts: 1,
          },
          // Stand-ins for exposures: the trigger decides on their estimated duration.
          container(
            'SequentialContainer',
            'Exposures',
            testId,
            (waitsId) => [
              {
                $id: id(),
                $type: 'NINA.Sequencer.SequenceItem.Utility.WaitForTimeSpan, NINA.Sequencer',
                Time: waitSeconds,
                Parent: { $ref: waitsId },
                ErrorBehavior: 0,
                Attempts: 1,
              },
            ],
            (waitsId) => [
              {
                $id: id(),
                $type: 'NINA.Sequencer.Conditions.LoopCondition, NINA.Sequencer',
                CompletedIterations: 0,
                Iterations: waitCount,
                Parent: { $ref: waitsId },
              },
            ]
          ),
        ],
        none
      ),
    ],
    none
  );
  root.Items.$values.push(target);

  root.Items.$values.push(container('EndAreaContainer', 'End', rootId, none, none));

  root.Triggers.$values.push({
    $id: id(),
    $type: 'NINA.Sequencer.Trigger.MeridianFlip.MeridianFlipTrigger, NINA.Sequencer',
    Parent: { $ref: rootId },
    TriggerRunner: {
      $id: id(),
      $type: 'NINA.Sequencer.Container.SequentialContainer, NINA.Sequencer',
      Strategy: { $type: SEQUENTIAL },
      Name: null,
      Conditions: { $id: id(), $type: CONDITIONS, $values: [] },
      IsExpanded: true,
      Items: { $id: id(), $type: ITEMS, $values: [] },
      Triggers: { $id: id(), $type: TRIGGERS, $values: [] },
      Parent: null,
      ErrorBehavior: 0,
      Attempts: 1,
    },
  });

  return root;
}
