/**
 * Composable für die Picker-Integration in Number-Input-Feldern
 * Nutzt digit-basierte Picker (0-9 pro Stelle) für optimale Performance
 */

import { usePickerStore } from '@/store/pickerStore';

export function useNumberPicker() {
  /**
   * Öffnet den Number-Picker mit Digit-basierter Auswahl (0-9 pro Stelle)
   * @param {string} labelKey - Der i18n-Key für das Label (z.B. 'camera.exposure')
   * @param {number} min - Minimaler Wert
   * @param {number} max - Maximaler Wert
   * @param {number} step - Schrittweite (wird nur für Dezimalplanung verwendet)
   * @param {number} currentValue - Aktueller Wert
   * @param {Function} callback - Callback-Funktion mit dem neuen Wert
   * @param {number} decimalPlaces - Optional: Explizite Dezimalplätze (wenn nicht vorhanden, werden sie aus step berechnet)
   */
  function openPicker(labelKey, min, max, step, currentValue, callback, decimalPlaces = null) {
    const pickerStore = usePickerStore();

    // Bestimme Dezimalplätze basierend auf step (wenn nicht explizit vorgegeben)
    let calculatedDecimalPlaces = decimalPlaces;
    if (calculatedDecimalPlaces === null || calculatedDecimalPlaces === undefined) {
      const stepStr = String(step);
      calculatedDecimalPlaces = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    }

    // Erstelle ein einfaches Options-Array nur mit min und max
    // Der pickerStore wird daraus die Digit-Picker generieren
    const pickerOptions = [
      { name: min.toString(), value: min },
      { name: max.toString(), value: max },
    ];

    // Öffne den Picker mit digit-basierter Generierung
    pickerStore.open(labelKey, pickerOptions, currentValue, callback, calculatedDecimalPlaces);
  }

  return {
    openPicker,
  };
}
