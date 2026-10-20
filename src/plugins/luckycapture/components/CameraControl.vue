<script setup>
import { useId } from 'vue';
import { useI18n } from 'vue-i18n';
const props = defineProps({
  control: { type: Object, required: true },
  modelValue: { type: [Number, String], default: null },
  invalid: Boolean,
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();
const id = useId();
function update(event) {
  const value = event.target.value;
  emit(
    'update:modelValue',
    props.control.type === 'enum' || props.control.options?.length
      ? value
      : value === ''
        ? null
        : Number(value)
  );
}
</script>
<template>
  <div class="camera-field">
    <label :for="id"
      >{{ t(`luckycapture.${control.id}`)
      }}<span v-if="control.unit"> ({{ control.unit }})</span></label
    >
    <output v-if="control.readOnly" :id="id" :aria-describedby="`${id}-help`">{{
      control.currentValue
    }}</output>
    <select
      v-else-if="control.type === 'enum' || control.options?.length"
      :id="id"
      :value="modelValue"
      :aria-describedby="`${id}-help`"
      @change="update"
    >
      <option v-for="option in control.options" :key="option" :value="option">{{ option }}</option>
    </select>
    <input
      v-else
      :id="id"
      :value="modelValue"
      :data-control="control.id"
      :aria-invalid="invalid"
      :aria-describedby="`${id}-help`"
      type="number"
      :inputmode="control.id === 'exposure' ? 'decimal' : 'numeric'"
      :required="control.id === 'exposure'"
      :min="control.min"
      :max="control.max"
      :step="control.step || 'any'"
      @input="update"
    />
    <p :id="`${id}-help`" class="field-help">{{ t(`luckycapture.help${control.id}`) }}</p>
  </div>
</template>
<style scoped>
.camera-field {
  min-width: 0;
}
label {
  display: block;
  font-size: 0.9rem;
  line-height: 1.45;
}
input,
select,
output {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-height: 48px;
  margin-top: 0.25rem;
  border: 1px solid var(--lc-border, #69758a);
  border-radius: var(--radius-control, 12px);
  padding: 0.6rem 0.75rem;
  font: inherit;
  font-size: 1rem;
  background: var(--color-surface-1, #111827);
  color: inherit;
}
input:focus-visible,
select:focus-visible {
  outline: 3px solid var(--color-accent, #22d3ee);
  outline-offset: 3px;
}
input[aria-invalid='true'] {
  border-color: #ff978a;
}
.field-help {
  color: var(--lc-muted, #b8c5d8);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0.35rem 0 0;
  overflow-wrap: anywhere;
}
select option {
  background: #111827;
  color: #e2e8f0;
}
</style>
