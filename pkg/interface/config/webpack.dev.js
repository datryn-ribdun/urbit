const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const urbitrc = require('./urbitrc');
const _ = require('lodash');
const { execSync } = require('child_process');

const GIT_DESC = execSync('git describe --always', { encoding: 'utf8' }).trim();

let devServer = {
  hot: true,
  port: 9000,
  host: '0.0.0.0',
  disableHostCheck: true,
  // https: true,
  historyApiFallback: {
    index: '/apps/landscape/index.html',
    disableDotRule: true
  },
  publicPath: '/apps/escape/'
};

const router = _.mapKeys(
  urbitrc.FLEET || {},
  (value, key) => `${key}.localhost:9000`
);

if (urbitrc.URL) {
  devServer = {
    ...devServer,
    // headers: {
    //   'Service-Worker-Allowed': '/'
    // },
    proxy: [
      {
        context: (path) => {
          console.log(path);
          if (path === '/apps/escape/desk.js') {
            return true;
          }
          return !path.startsWith('/apps/escape');
        },
        changeOrigin: true,
        target: urbitrc.URL,
        router
      }
    ]
  };
}

module.exports = {
  mode: 'development',
  entry: {
    app: './src/index.tsx'
    // serviceworker: './src/serviceworker.js'
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/typescript',
              [
                '@babel/preset-react',
                {
                  runtime: 'automatic',
                  development: true
                }
              ]
            ],
            plugins: [
              '@babel/transform-runtime',
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-proposal-class-properties',
              process.env.NODE_ENV !== 'production' && 'react-refresh/babel'
            ]
          }
        },
        exclude: /node_modules\/(?!(@tlon\/indigo-dark|@tlon\/indigo-light|@tlon\/indigo-react|@urbit\/api)\/).*/
      },
      {
        test: /\.(sc|c)ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader'
        ]
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
          name: 'static/media/[name].[hash:8].[ext]'
        }
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json']
  },
  devtool: 'inline-source-map',
  devServer: devServer,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.LANDSCAPE_SHORTHASH': JSON.stringify(GIT_DESC),
      'process.env.LANDSCAPE_STORAGE_VERSION': JSON.stringify(Date.now()),
      'process.env.LANDSCAPE_LAST_WIPE': JSON.stringify('2021-10-20')
    }),

    // new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'EScape',
      template: './public/index.html'
    }),
    process.env.NODE_ENV !== 'production' && new ReactRefreshWebpackPlugin()
  ],
  watch: true,
  output: {
    filename: (pathData) => {
      return pathData.chunk.name === 'app' ? 'index.js' : '[name].js';
    },
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/apps/escape/',
    globalObject: 'this'
  },
  optimization: {
    minimize: false,
    usedExports: true
  }
};
