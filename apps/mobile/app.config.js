module.exports = ({ config }) => {
  if (process.env.EXPO_GO_PUBLISH !== '1') return config;

  return {
    ...config,
    runtimeVersion: { policy: 'sdkVersion' },
  };
};
