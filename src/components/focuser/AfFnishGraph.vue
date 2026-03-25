<template>
  <div class="flex flex-col">
    <div>
      <canvas ref="chartCanvas" class="w-full h-72 md:h-96 xl:h-[600px]"></canvas>
    </div>
    <div v-show="timestamp.length > 0" class="text-center mt-4 space-y-1">
      <p>{{ timestamp }}</p>
      <p v-show="temperature != null">{{ temperature }}°C</p>
      <template v-if="afRunData">
        <p v-show="afRunData.filter">
          {{ $t('components.focuser.filter') }}: {{ afRunData.filter }}
        </p>
        <p>
          {{ $t('components.focuser.hfr') }}: {{ afRunData.initialHFR }} &rarr;
          {{ afRunData.finalHFR
          }}<span v-show="afRunData.estimatedFinalHFR">
            ({{ $t('components.focuser.estimated') }}: {{ afRunData.estimatedFinalHFR }})</span
          >
        </p>
        <p>
          {{ $t('components.focuser.focuser_position') }}: {{ afRunData.initialPos }} &rarr;
          {{ afRunData.finalPos }}
        </p>
        <p v-show="afRunData.duration != null">
          {{ $t('components.focuser.duration_seconds') }}: {{ afRunData.duration }}s
        </p>
        <template v-if="afRunData.rSquares && afRunData.rSquaredValue != null">
          <p>R&sup2;: {{ afRunData.rSquaredValue }}</p>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

// Registriere alle Chart.js Komponenten
Chart.register(...registerables);

const chartCanvas = ref(null);
const timestamp = ref(''); // Timestamp für die Anzeige
const temperature = ref();
const afRunData = ref(null); // extra HocusFocus AF stats (null when unavailable)
const store = apiStore();
let chartInstance = null;
let fetchInterval = null;

// Funktion, um die Größe des Charts beim Fenster-Resize anzupassen
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// Funktion zum Parsen der Quadratischen Fitting-Formel
function parseQuadraticFormula(formula) {
  // Normalisiere die Formel, um "+ -" zu "-"
  const normalizedFormula = formula.replace(/\+\s*-/g, '- ').replace(/-\s*-/g, '+ ');

  //console.log('Normalisierte Quadratische Formel:', normalizedFormula); // Debugging

  // Neuer Regex für Exponentialnotation
  const regex =
    /y\s*=\s*([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*\*\s*x\^2\s*([+-]?\s*\d*\.?\d+(?:[eE][+-]?\d+)?)\s*\*\s*x\s*([+-]?\s*\d*\.?\d+(?:[eE][+-]?\d+)?)/i;
  const match = normalizedFormula.match(regex);
  if (match) {
    const a = parseFloat(match[1]);
    const b = parseFloat(match[2].replace(/\s+/g, ''));
    const c = parseFloat(match[3].replace(/\s+/g, ''));
    return { a, b, c };
  }
  return null;
}

// Funktion zum Parsen der Hyperbolischen Fitting-Formel
function parseHyperbolicFormula(formula) {
  //console.log('Hyperbolic Fitting Formel:', formula); // Debugging

  // Neuer Regex für Exponentialnotation und Hyperbolische Funktion
  const regex =
    /y\s*=\s*([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*\*\s*cosh\s*\(\s*asinh\s*\(\s*\(\s*([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*-\s*x\s*\)\s*\/\s*([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*\)\s*\)/i;
  const match = formula.match(regex);
  if (match) {
    const A = parseFloat(match[1]);
    const B = parseFloat(match[2]);
    const C = parseFloat(match[3]);
    return { A, B, C };
  }
  return null;
}

// Daten von der API abrufen und Chart aktualisieren
async function fetchLastAf() {
  try {
    const response = await apiService.focusAction('last-af');
    const apiData = response.Response;
    //console.log('API Data for Last AF:', apiData);
    const dateLastAf = new Date(apiData.Timestamp);
    const dateProfilLastUsed = new Date(store.profileInfo.LastUsed);
    const temp = parseFloat(apiData?.Temperature);
    temperature.value = isNaN(temp) ? null : temp.toFixed(2);
    //console.log(dateLastAf, ' : ', dateProfilLastUsed);

    if (dateLastAf < dateProfilLastUsed) {
      return;
    }
    const measurePoints = apiData.MeasurePoints || [];

    // Neue Daten extrahieren
    const positions = measurePoints.map((point) => point.Position);
    const values = measurePoints.map((point) => parseFloat(point.Value.toFixed(2)));

    // Minima aus Intersections
    const hyperbolicMinimum = {
      position: apiData.Intersections?.HyperbolicMinimum?.Position,
      value: apiData.Intersections?.HyperbolicMinimum?.Value,
    };
    const quadraticMinimum = {
      position: apiData.Intersections?.QuadraticMinimum?.Position,
      value: apiData.Intersections?.QuadraticMinimum?.Value,
    };

    // Timestamp aus API speichern
    const dateObject = new Date(apiData.Timestamp);
    const dateTimeText = `${dateObject.toLocaleDateString()} ${dateObject.toLocaleTimeString()}`;
    timestamp.value = dateTimeText;

    // Fittings aus API extrahieren
    const fittings = apiData.Fittings || {};

    // Quadratisch parsen
    let quadraticTrendline = [];
    if (fittings.Quadratic) {
      const quadraticParams = parseQuadraticFormula(fittings.Quadratic);
      if (!quadraticParams) {
        console.warn('Quadratic fitting formula could not be parsed.');
      } else {
        // Falls parse erfolgreich, Trendline berechnen
        const quadraticFunction = (x) =>
          quadraticParams.a * Math.pow(x, 2) + quadraticParams.b * x + quadraticParams.c;
        quadraticTrendline = positions.map((x) => quadraticFunction(x));
      }
    } else {
      console.warn('No quadratic formula available. (fittings.Quadratic empty)');
    }

    // Hyperbolisch parsen
    let hyperbolicTrendline = [];
    if (fittings.Hyperbolic) {
      const hyperbolicParams = parseHyperbolicFormula(fittings.Hyperbolic);
      if (!hyperbolicParams) {
        console.warn('Hyperbolic fitting formula could not be parsed.');
      } else {
        // Falls parse erfolgreich, Trendline berechnen
        const hyperbolicFunction = (x) =>
          hyperbolicParams.A * Math.cosh(Math.asinh((hyperbolicParams.B - x) / hyperbolicParams.C));
        hyperbolicTrendline = positions.map((x) => hyperbolicFunction(x));
      }
    } else {
      console.warn('No hyperbolic formula available. (fittings.Hyperbolic empty)');
    }

    // Chart aktualisieren, falls vorhanden
    if (chartInstance) {
      chartInstance.data.labels = positions;
      // 0 = Measure Points
      chartInstance.data.datasets[0].data = values;
      // 1 = Quadratic Trendline
      chartInstance.data.datasets[1].data = quadraticTrendline;
      // 2 = Hyperbolic Trendline
      chartInstance.data.datasets[2].data = hyperbolicTrendline;
      // 3 = Quadratic Min (nur setzen, falls es Werte gibt)
      chartInstance.data.datasets[3].data =
        quadraticMinimum?.position !== undefined
          ? [{ x: quadraticMinimum.position, y: quadraticMinimum.value }]
          : [];
      // 4 = Hyperbolic Min (nur setzen, falls es Werte gibt)
      chartInstance.data.datasets[4].data =
        hyperbolicMinimum?.position !== undefined
          ? [{ x: hyperbolicMinimum.position, y: hyperbolicMinimum.value }]
          : [];

      chartInstance.update();
    }
    // Try to enrich with HocusFocus last-run data (silently degrades if unavailable)
    try {
      const hfData = await apiService.hocusfocus.getLastAutoFocusRun();
      if (hfData?.Success) {
        afRunData.value = {
          initialHFR: hfData.InitialHFR != null ? parseFloat(hfData.InitialHFR).toFixed(2) : null,
          finalHFR: hfData.FinalHFR != null ? parseFloat(hfData.FinalHFR).toFixed(2) : null,
          estimatedFinalHFR:
            hfData.EstimatedFinalHFR != null && !isNaN(parseFloat(hfData.EstimatedFinalHFR))
              ? parseFloat(hfData.EstimatedFinalHFR).toFixed(2)
              : null,
          initialPos: hfData.InitialFocuserPosition,
          finalPos: hfData.FinalFocuserPosition,
          duration:
            hfData.DurationSeconds != null ? parseFloat(hfData.DurationSeconds).toFixed(1) : null,
          filter: hfData.Filter || null,
          fitting: hfData.Fitting || null,
          rSquares: hfData.RSquares || null,
          rSquaredValue: (() => {
            const rs = hfData.RSquares;
            if (!rs) return null;
            const f = (hfData.Fitting || '').toUpperCase();
            let raw;
            if (f.includes('HYPERBOLIC')) raw = rs.Hyperbolic;
            else if (f.includes('PARABOLIC') || f.includes('QUADRATIC')) raw = rs.Quadratic;
            else if (f.includes('TREND'))
              raw = Math.max(parseFloat(rs.LeftTrend) || 0, parseFloat(rs.RightTrend) || 0);
            else raw = rs.Hyperbolic ?? rs.Quadratic ?? rs.LeftTrend;
            const n = parseFloat(raw);
            return !isNaN(n) && n > 0 ? n.toFixed(4) : null;
          })(),
        };
      } else {
        afRunData.value = null;
      }
    } catch {
      afRunData.value = null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

onMounted(async () => {
  const ctx = chartCanvas.value.getContext('2d');
  console.log('Loading graph');

  // Initialer Chart
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Initial leer
      datasets: [
        {
          label: 'Measure Points',
          data: [],
          borderColor: 'blue',
          borderWidth: 2,
          fill: false,
          pointRadius: 5,
        },
        {
          label: 'Quadratic Trendline',
          data: [],
          borderColor: 'red',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Hyperbolic Trendline',
          data: [],
          borderColor: 'green',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Quadratic Min',
          data: [], // Dynamisch aktualisiert
          borderColor: 'red',
          backgroundColor: 'red',
          pointRadius: 6,
          pointStyle: 'circle',
          showLine: false,
        },
        {
          label: 'Hyperbolic Min',
          data: [], // Dynamisch aktualisiert
          borderColor: 'green',
          backgroundColor: 'green',
          pointRadius: 6,
          pointStyle: 'circle',
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#CCCCCC',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Position',
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
        y: {
          title: {
            display: true,
            text: 'Value',
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
      },
    },
  });

  // Starte Intervall zum regelmäßigen Nachladen
  fetchInterval = setInterval(() => {
    fetchLastAf();
  }, 15000); // 30 Sekunden

  // Daten laden nach nextTick, um sicherzustellen, dass Chart vollständig initialisiert ist
  await nextTick();
  fetchLastAf();

  // Event Listener hinzufügen
  window.addEventListener('resize', resizeChart);
});

onUnmounted(() => {
  // Event Listener entfernen
  window.removeEventListener('resize', resizeChart);

  if (chartInstance) {
    chartInstance.destroy();
  }
  // Intervall stoppen
  if (fetchInterval) {
    clearInterval(fetchInterval);
  }
});
</script>

<style scoped></style>
