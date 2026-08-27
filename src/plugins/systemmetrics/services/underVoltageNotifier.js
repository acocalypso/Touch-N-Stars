export const createUnderVoltageNotifier = ({ showToast, translate }) => {
  let alertActive = false;

  return (powerStatus, isPINS) => {
    const underVoltage = Boolean(isPINS && powerStatus?.underVoltage);

    if (!underVoltage) {
      alertActive = false;
      return false;
    }

    if (alertActive) {
      return false;
    }

    alertActive = true;
    showToast({
      type: 'warning',
      title: translate('plugins.systemMetrics.underVoltageActive'),
      message: translate('plugins.systemMetrics.underVoltageActiveHelp'),
      autoClose: false,
    });
    return true;
  };
};

export default createUnderVoltageNotifier;
