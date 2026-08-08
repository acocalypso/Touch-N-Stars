<template>
  <div class="rounded-xl border border-gray-700/70 bg-gray-900/50 p-4">
    <h2 class="text-sm font-semibold text-gray-300">{{ $t('plugins.filterOffset.board') }}</h2>
    <p class="mt-1 text-xs text-gray-500">{{ $t('plugins.filterOffset.boardHint') }}</p>

    <p v-if="rows.length === 0" class="py-6 text-center text-sm text-gray-500">
      {{ $t('plugins.filterOffset.noMeasurements') }}
    </p>

    <!-- A run can be 20 iterations wide; the table scrolls inside this box instead of stretching
         the page, with the filter name pinned so a scrolled-away row is still identifiable. -->
    <div v-else class="mt-3 overflow-x-auto">
      <table class="w-full min-w-max text-sm">
        <thead>
          <tr class="border-b border-gray-700 text-xs text-gray-400">
            <th class="sticky left-0 bg-gray-900 pb-2 pr-4 text-left font-medium">
              {{ $t('plugins.filterOffset.filter') }}
            </th>
            <th v-for="loop in loopColumns" :key="loop" class="px-2 pb-2 text-right font-medium">
              {{ $t('plugins.filterOffset.loopShort', { n: loop }) }}
            </th>
            <th class="border-l border-gray-700/70 px-2 pb-2 text-right font-medium">
              {{ $t('plugins.filterOffset.samplesUsed') }}
            </th>
            <th class="px-2 pb-2 text-right font-medium">
              {{ $t('plugins.filterOffset.spread') }}
            </th>
            <th class="pb-2 pl-2 text-right font-medium">
              {{ $t('plugins.filterOffset.offset') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.position"
            class="border-b border-gray-800/50 last:border-0"
          >
            <td class="sticky left-0 bg-gray-900 py-1.5 pr-4 text-white">
              {{ row.name }}
              <span class="ml-1 text-xs text-gray-500">#{{ row.position }}</span>
            </td>

            <td
              v-for="cell in row.cells"
              :key="cell.loop"
              class="px-2 py-1.5 text-right font-mono"
              :class="cellClass(cell)"
              :title="cellTitle(cell, row)"
            >
              {{ cellText(cell) }}
              <!-- A measurement the retry rescued cost two AutoFocus runs and is a filter worth
                   watching, so it does not get to look like a clean first-try result. -->
              <span v-if="cell.measurement?.FirstFailure" class="text-amber-400">*</span>
            </td>

            <td
              class="border-l border-gray-700/70 px-2 py-1.5 text-right font-mono text-gray-300"
              :class="{ 'text-amber-300': row.hasDroppedSamples }"
              :title="summaryTitle(row)"
            >
              {{ row.used }}/{{ row.loops }}
            </td>
            <td class="px-2 py-1.5 text-right font-mono text-gray-300">
              {{ row.spread ?? '–' }}
            </td>
            <!-- An offset the run never measured is still a number the profile will be given, so it
                 is shown — just not in the colour that says "this was measured". -->
            <td
              class="py-1.5 pl-2 text-right font-mono"
              :class="row.used > 0 ? 'text-green-200' : 'text-gray-500'"
            >
              {{ row.offset ?? '–' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Only meaningful once the run has been aggregated; during the run there is no drift estimate.
         The rejection threshold is deliberately not stated here: it is usually set by each filter's
         own scatter, so it varies per row and lives in that row's tooltip instead of pretending to be
         one number for the whole run. -->
    <div v-if="details.length" class="mt-3 text-xs text-gray-500">
      {{ $t('plugins.filterOffset.drift') }}:
      <span class="font-mono text-gray-400">
        {{ $t('plugins.filterOffset.stepsPerLoop', { value: formatSigned(-temperatureDrift) }) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  // One entry per filter × iteration, as measured:
  // { Position, Name, Loop, FocusPosition, Failure, Rejected, Attempts, FirstFailure }
  measurements: { type: Array, default: () => [] },
  // Per-filter aggregation, only present once the run finished
  details: { type: Array, default: () => [] },
  // The offsets as the parent displays them ({ Position, FocusOffset }), so the board's last column
  // never contradicts the offset table next to it. Falls back to the run's own base-anchored value.
  offsets: { type: Array, default: () => [] },
  totalLoops: { type: Number, default: 0 },
  // Backend sign convention: positive means the focus position moved DOWN over the run. It is negated
  // for display, so what the user reads is the direction the focuser actually travelled — "+5" for a
  // focus position that climbed by 5 steps an iteration.
  temperatureDrift: { type: Number, default: 0 },
});

// The run's own iteration count, but never fewer columns than there are measurements: a stale
// TotalLoops must not hide a column that has values in it.
const loopColumns = computed(() => {
  const measured = props.measurements.reduce((max, m) => Math.max(max, m.Loop ?? 0), 0);
  const count = Math.max(props.totalLoops ?? 0, measured);
  return Array.from({ length: count }, (_, i) => i + 1);
});

const detailByPosition = computed(() => new Map(props.details.map((d) => [d.Position, d])));

const offsetByPosition = computed(
  () => new Map(props.offsets.map((o) => [o.Position, o.FocusOffset]))
);

/**
 * Rows in the order the filters are measured — which is the order they appear in the measurement
 * list, since the run walks the selection the same way in every iteration.
 *
 * Rows are derived from the measurements rather than from the profile's filter list on purpose: only
 * the filters this run actually covers belong on the board, and the client cannot otherwise know
 * which ones were selected (a browser that joined mid-run never saw the start request).
 */
const rows = computed(() => {
  const byPosition = new Map();

  for (const m of props.measurements) {
    let row = byPosition.get(m.Position);
    if (!row) {
      row = { position: m.Position, name: m.Name, byLoop: new Map() };
      byPosition.set(m.Position, row);
    }
    row.byLoop.set(m.Loop, m);
  }

  return [...byPosition.values()].map((row) => {
    const detail = detailByPosition.value.get(row.position);
    const taken = detail?.SamplesTaken ?? [...row.byLoop.values()].filter(hasPosition).length;

    return {
      position: row.position,
      name: row.name,
      cells: loopColumns.value.map((loop) => ({ loop, measurement: row.byLoop.get(loop) ?? null })),
      median: detail?.Median ?? null,
      loops: loopColumns.value.length,
      // While the run is still going nothing has been rejected yet, so everything taken is in play.
      used: detail?.SamplesUsed ?? taken,
      // Both the denominator and the warning colour count iterations, not successful AutoFocus runs:
      // a filter that lost two loops to a failed AF is exactly as short of data as one that lost two
      // to outlier rejection, and "3/3" would have hidden the first case entirely.
      hasDroppedSamples: detail ? detail.SamplesUsed < loopColumns.value.length : false,
      // Whether this row has been aggregated at all. Distinct from "aggregated but nothing to
      // reject": while the run is still going there is no cutoff because rejection has not happened,
      // not because there were too few samples for it.
      aggregated: detail != null,
      measured: taken,
      cutoff: detail?.Cutoff ?? null,
      estimatedFocus: detail?.EstimatedFocus ?? null,
      spread: detail?.Spread ?? null,
      offset: offsetByPosition.value.get(row.position) ?? (detail ? detail.FocusOffset : null),
    };
  });
});

function hasPosition(measurement) {
  return measurement?.FocusPosition != null;
}

function cellText(cell) {
  if (!cell.measurement) return '·';
  return hasPosition(cell.measurement) ? cell.measurement.FocusPosition : '×';
}

function cellClass(cell) {
  if (!cell.measurement) return 'text-gray-700';
  if (!hasPosition(cell.measurement)) return 'text-red-400';
  return cell.measurement.Rejected ? 'text-amber-400 line-through' : 'text-white';
}

function cellTitle(cell, row) {
  if (!cell.measurement) return t('plugins.filterOffset.notMeasuredYet');

  if (!hasPosition(cell.measurement)) {
    return cell.measurement.Failure || t('plugins.filterOffset.measurementFailed');
  }

  const parts = [];

  if (cell.measurement.Rejected) {
    // The deviation is what the rejection was decided on, so state it rather than just "outlier" —
    // but only when the median it was decided against is actually known. Rejection marks reach the
    // board a moment before the aggregation does, and on an error screen they arrive without it
    // entirely; stating a median of 0 there would be inventing the number the user came to read.
    parts.push(
      row.median != null
        ? t('plugins.filterOffset.rejectedTooltip', {
            deviation: formatSigned(cell.measurement.FocusPosition - row.median),
            median: round(row.median, 1),
          })
        : t('plugins.filterOffset.rejectedTooltipNoMedian')
    );
  }

  if (cell.measurement.FirstFailure) {
    parts.push(
      t('plugins.filterOffset.retriedTooltip', { failure: cell.measurement.FirstFailure })
    );
  }

  return parts.join(' ');
}

/**
 * The row's aggregation in words: how many iterations produced a measurement, how many of those the
 * offset was built from, and the distance from the median a sample had to exceed to be thrown out.
 *
 * That distance is normally set by the filter's own scatter, so it is per row — a filter whose
 * AutoFocus is consistently noisy tolerates more before anything is called an outlier — falling back
 * to a profile-wide floor only when the scatter is tiny. Which is why it belongs here and not in a
 * single figure under the table.
 */
function summaryTitle(row) {
  // Nothing has been aggregated yet — a run in progress, or one that died before it got there. Say
  // only what is true at that point: no offset was built from these, and no sample was rejected or
  // kept, so neither the "used for the offset" wording nor any statement about the cutoff applies.
  if (!row.aggregated) {
    return t('plugins.filterOffset.summaryTooltipPending', {
      measured: row.measured,
      loops: row.loops,
    });
  }

  const parts = [
    t('plugins.filterOffset.summaryTooltip', {
      measured: row.measured,
      loops: row.loops,
      used: row.used,
    }),
  ];

  if (row.cutoff != null && row.median != null) {
    parts.push(
      t('plugins.filterOffset.cutoffTooltip', {
        cutoff: round(row.cutoff, 1),
        median: round(row.median, 1),
      })
    );
  } else if (row.measured > 0) {
    parts.push(t('plugins.filterOffset.cutoffUnavailable'));
  }

  if (row.estimatedFocus != null) {
    parts.push(
      t('plugins.filterOffset.estimatedFocusTooltip', { focus: round(row.estimatedFocus, 1) })
    );
  }

  return parts.join(' ');
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatSigned(value) {
  const rounded = round(value, 1);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}
</script>
