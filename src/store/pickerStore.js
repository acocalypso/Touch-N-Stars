import { defineStore } from 'pinia';

export const usePickerStore = defineStore('pickerStore', {
  state: () => ({
    isOpen: false,
    label: 'Select Value',
    inputString: '',
    minValue: 0,
    maxValue: 100,
    callback: null,
    decimalPlaces: 0,
  }),

  getters: {
    currentValue: (state) => {
      const val = parseFloat(state.inputString);
      return isNaN(val) ? 0 : val;
    },
    displayValue: (state) => {
      return state.inputString || '0';
    },
    isNegativeAllowed: (state) => state.minValue < 0,
    hasDecimalPoint: (state) => state.inputString.includes('.'),
    isOutOfRange() {
      return this.currentValue < this.minValue || this.currentValue > this.maxValue;
    },
  },

  actions: {
    open(label, min, max, value, callback, decimalPlaces = 0) {
      this.label = label;
      this.minValue = min;
      this.maxValue = max;
      this.callback = callback;
      this.decimalPlaces = decimalPlaces;
      this.inputString = String(value);
      this.isOpen = true;
    },

    close() {
      if (this.isOutOfRange) return;
      const finalValue = this.currentValue;
      this.isOpen = false;

      if (this.callback) {
        this.callback(finalValue);
        this.callback = null;
      }

      this._reset();
    },

    cancel() {
      this.isOpen = false;
      this.callback = null;
      this._reset();
    },

    _reset() {
      this.inputString = '';
      this.label = 'Select Value';
    },

    appendDigit(digit) {
      if (this.inputString.includes('.')) {
        const decPart = this.inputString.split('.')[1];
        if (decPart.length >= this.decimalPlaces) return;
      }
      const raw = this.inputString.replace(/^-/, '');
      if (raw === '0' && digit === 0) return;
      if (raw === '0' && digit !== 0) {
        this.inputString = this.inputString.replace(/0$/, '') + String(digit);
        return;
      }
      this.inputString += String(digit);
    },

    appendDecimal() {
      if (this.decimalPlaces === 0) return;
      if (this.inputString.includes('.')) return;
      if (this.inputString === '' || this.inputString === '-') {
        this.inputString += '0.';
      } else {
        this.inputString += '.';
      }
    },

    backspace() {
      if (this.inputString.length <= 0) return;
      this.inputString = this.inputString.slice(0, -1);
    },

    setPositive() {
      if (this.inputString.startsWith('-')) {
        this.inputString = this.inputString.slice(1);
      }
    },

    setNegative() {
      if (!this.isNegativeAllowed) return;
      if (!this.inputString.startsWith('-')) {
        this.inputString = '-' + this.inputString;
      }
    },

    clearInput() {
      this.inputString = '';
    },

    // Backward compatibility shim for App.vue window.getPickerValue
    getValueFromDigits() {
      return this.currentValue;
    },
  },
});
