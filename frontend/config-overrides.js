const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  webpack: function(config) {
    // Define entry points
    config.entry = {
      main: config.entry,
      counter: './src/index.counter.js'
    };
    
    // Define unique output files
    config.output.filename = 'static/js/[name].bundle.js';
    
    // Modify the main HTML plugin
    const mainHtmlPlugin = config.plugins.find(p => p.constructor.name === 'HtmlWebpackPlugin');
    mainHtmlPlugin.options.chunks = ['main'];
    
    // Add the new HTML plugin for the counter
    config.plugins.push(new HtmlWebpackPlugin({
      template: 'public/counter.html',
      filename: 'counter.html',
      chunks: ['counter']
    }));
    
    return config;
  }
};