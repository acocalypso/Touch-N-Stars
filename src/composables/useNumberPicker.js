/**
 * Composable for picker integration in number input fields
 * Uses digit-based pickers (0-9 per position) for optimal performance
 */

import { usePickerStore } from '@/store/pickerStore';

export function useNumberPicker() {
  /**
   * Opens the number picker with digit-based selection (0-9 per position)
   * @param {string} labelKey - The i18n key for the label (e.g., 'camera.exposure')
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} step - Step size (only used for decimal place calculation)
   * @param {number} currentValue - Current value
   * @param {Function} callback - Callback function with the new value
   * @param {number} decimalPlaces - Optional: Explicit decimal places (if not provided, calculated from step)
   */
  function openPicker(labelKey, min, max, step, currentValue, callback, decimalPlaces = null) {
    const pickerStore = usePickerStore();

    // Determine decimal places based on step (if not explicitly provided)
    let calculatedDecimalPlaces = decimalPlaces;
    if (calculatedDecimalPlaces === null || calculatedDecimalPlaces === undefined) {
      const stepStr = String(step);
      calculatedDecimalPlaces = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    }

    // Create a simple options array with only min and max
    // The pickerStore will generate digit pickers from this
    const pickerOptions = [
      { name: min.toString(), value: min },
      { name: max.toString(), value: max },
    ];

    // Open the picker with digit-based generation
    pickerStore.open(labelKey, pickerOptions, currentValue, callback, calculatedDecimalPlaces);
  }

  return {
    openPicker,
  };
}
