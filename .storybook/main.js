module.exports = {
  stories: ["../src/**/*.stories.(ts|tsx|js|jsx)"],
  addons: ["@storybook/addon-knobs/register"],
  webpackFinal: async config => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      loader: require.resolve("babel-loader")
    });
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  }
};
