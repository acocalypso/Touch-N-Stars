const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    open: true,
    hot: true,
  },
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(true),
      }),
    ],
  },
  chainWebpack: (config) => {
    if (process.env.EXCLUDE_STELLARIUM_DATA === 'true' && config.plugins.has('copy')) {
      config.plugin('copy').tap((args) => {
        const options = { ...(args[0] || {}) };

        if (Array.isArray(options.patterns)) {
          options.patterns = options.patterns.map((pattern) => {
            const globOptions = {
              ...(pattern.globOptions || {}),
            };
            const ignore = new Set(globOptions.ignore || []);
            ignore.add('**/stellarium-data/**');
            return {
              ...pattern,
              globOptions: {
                ...globOptions,
                ignore: Array.from(ignore),
              },
            };
          });
        } else if (options.from) {
          const globOptions = {
            ...(options.globOptions || {}),
          };
          const ignore = new Set(globOptions.ignore || []);
          ignore.add('**/stellarium-data/**');
          options.globOptions = {
            ...globOptions,
            ignore: Array.from(ignore),
          };
        }

        return [options];
      });
    }
  },
});
