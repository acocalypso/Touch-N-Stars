<template>
    <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <setAutoFocusInitialOffsetSteps />
        <setAutoFocusStepSize />
        <setFocuserSettleTime />
        <setAutoFocusTotalNumberOfAttempts />
        <setAutoFocusNumberOfFramesPerPoint />
        <setAutoFocusInnerCropRatio />
        <setAutoFocusOuterCropRatio />
        <setAutoFocusUseBrightestStars />
        <setBacklashIn />
        <setBacklashOut />
        <setAutoFocusBinning />
        <setAutoFocusTimeoutSeconds />
        <setRSquaredThreshold />
        <setAutoFocusCurveFitting />
        <setAutoFocusDisableGuiding />
    </div>
</template>
<script setup >
import setAutoFocusInitialOffsetSteps from './setAutoFocusInitialOffsetSteps.vue';
import setAutoFocusStepSize from './setAutoFocusStepSize.vue';
import setFocuserSettleTime from './setFocuserSettleTime.vue';
import setAutoFocusTotalNumberOfAttempts from './setAutoFocusTotalNumberOfAttempts.vue';
import setAutoFocusNumberOfFramesPerPoint from './setAutoFocusNumberOfFramesPerPoint.vue';
import setAutoFocusInnerCropRatio from './setAutoFocusInnerCropRatio.vue';
import setAutoFocusOuterCropRatio from './setAutoFocusOuterCropRatio.vue';
import setAutoFocusUseBrightestStars from './setAutoFocusUseBrightestStars.vue';
import setBacklashIn from './setBacklashIn.vue';
import setBacklashOut from './setBacklashOut.vue';
import setAutoFocusBinning from './setAutoFocusBinning.vue';
import setAutoFocusTimeoutSeconds from './setAutoFocusTimeoutSeconds.vue';
import setRSquaredThreshold from './setRSquaredThreshold.vue';
import setAutoFocusCurveFitting from './setAutoFocusCurveFitting.vue';
import setAutoFocusDisableGuiding from './setAutoFocusDisableGuiding.vue';

</script>