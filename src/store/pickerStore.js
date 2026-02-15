import { defineStore } from 'pinia';

export const usePickerStore = defineStore('pickerStore', {
  state: () => ({
    isOpen: false,
    label: 'Select Value',
    value: 0,
    minValue: 0,
    maxValue: 100,
    digits: [],
    callback: null,
    decimalPlaces: 0,
  }),

  getters: {
    currentValue: (state) => {
      return state.value;
    },
    isValueExceedingMax: (state) => {
      return state.value > state.maxValue;
    },
  },

  actions: {
    open(label, min, max, value, callback, decimalPlaces = 0) {
      this.label = label;
      this.value = value;
      this.callback = callback;
      this.decimalPlaces = decimalPlaces;
      this.minValue = min;
      this.maxValue = max;

      this.digits = this.createDigitPickers(this.minValue, this.maxValue, value, decimalPlaces);
      this.isOpen = true;
    },

    close() {
      const finalValue = this.getValueFromDigits();
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
      this.digits = [];
      this.value = 0;
      this.label = 'Select Value';
    },

    updateFromInput(inputValue) {
      // Erlauben Sie die Eingabe ohne zu clampen
      this.digits = this.createDigitPickers(
        this.minValue,
        this.maxValue,
        inputValue,
        this.decimalPlaces
      );
      this.value = inputValue;
    },

    getValueFromDigits() {
      let intPart = '';
      let decPart = '';
      let isDecimal = false;
      let sign = '+';

      for (const digit of this.digits) {
        if (digit.isSign) {
          sign = digit.value;
        } else if (digit.isDecimalSeparator) {
          isDecimal = true;
        } else if (isDecimal) {
          decPart += digit.value;
        } else {
          intPart += digit.value;
        }
      }

      intPart = intPart.replace(/^0+/, '') || '0';

      let result;
      if (decPart) {
        decPart = decPart.replace(/0+$/, '');
        result = parseFloat(intPart + '.' + decPart);
      } else {
        result = parseInt(intPart);
      }

      return sign === '-' ? -result : result;
    },

    createDigitPickers(min, max, currentValue, requestedDecimalPlaces = 0) {
      // Prüfe ob negative Werte möglich sind
      const hasNegativeRange = min < 0;
      const isCurrentValueNegative = currentValue < 0;

      // Konvertiere zu String und teile auf bei Dezimalpunkt
      const minStr = Math.abs(min).toString();
      const maxStr = Math.abs(max).toString();
      const valueStr = Math.abs(currentValue).toString();

      // Prüfe ob Dezimalzahlen enthalten sind
      const hasDecimal = minStr.includes('.') || maxStr.includes('.') || valueStr.includes('.');

      // Parse min/max/value in Integer und Dezimal Teil
      const minParts = minStr.split('.');
      const maxParts = maxStr.split('.');
      const valueParts = valueStr.split('.');

      const maxIntStr = maxParts[0] || '0';
      const valueIntStr = valueParts[0] || '0';

      const minDecStr = minParts[1] || '';
      const maxDecStr = maxParts[1] || '';
      const valueDecStr = valueParts[1] || '';

      const digits = [];

      // Füge Vorzeichen-Picker am Anfang hinzu, wenn negativ möglich ist
      if (hasNegativeRange) {
        digits.push({
          isSign: true,
          options: ['+', '-'],
          value: isCurrentValueNegative ? '-' : '+',
        });
      }

      if (hasDecimal || requestedDecimalPlaces > 0) {
        // Dezimalzahlen-Logik
        // Verwende angeforderte DecimalPlaces oder berechne aus min/max
        let decimalPlaces = Math.max(minDecStr.length, maxDecStr.length, valueDecStr.length);
        if (requestedDecimalPlaces > 0) {
          decimalPlaces = requestedDecimalPlaces;
        }

        const paddedValueInt = valueIntStr.padStart(maxIntStr.length, '0');
        const paddedValueDec = valueDecStr.padEnd(decimalPlaces, '0');

        // Integer part
        for (let i = 0; i < paddedValueInt.length; i++) {
          const digitOptions = Array.from({ length: 10 }, (_, j) => j);
          digits.push({
            options: digitOptions,
            value: parseInt(paddedValueInt[i]),
            position: i,
            isDecimal: false,
          });
        }

        // Decimal separator
        digits.push({
          isDecimalSeparator: true,
        });

        // Decimal part
        for (let i = 0; i < decimalPlaces; i++) {
          const digitOptions = Array.from({ length: 10 }, (_, j) => j);
          digits.push({
            options: digitOptions,
            value: parseInt(paddedValueDec[i] || '0'),
            position: i,
            isDecimal: true,
          });
        }

        return digits;
      } else {
        // Integer-Logik
        const paddedValueInt = valueIntStr.padStart(maxIntStr.length, '0');

        for (let i = 0; i < paddedValueInt.length; i++) {
          const digitOptions = Array.from({ length: 10 }, (_, j) => j);
          digits.push({
            options: digitOptions,
            value: parseInt(paddedValueInt[i]),
            position: i,
            isDecimal: false,
          });
        }

        return digits;
      }
    },
  },
});
