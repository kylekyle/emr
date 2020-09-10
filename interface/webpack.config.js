const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	entry: './index.js', 
	output: {
		filename: 'interface.min.js',
		path: path.resolve(__dirname),
	},
	// jquery is needed outside the bundle, so we
	// load it from the google cdn
  externals: {
    jquery: 'jQuery'
  },
	optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
			extractComments: (astNode, comment) => false,
		})],
	},
	module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  }
};
