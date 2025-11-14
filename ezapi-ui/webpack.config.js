const path = require('path');
const process = require('process');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const DotenvFlow = require('dotenv-flow-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const CompressionPlugin = require('compression-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'prod';
const isStage = process.env.NODE_ENV === 'stage';
const isDev = process.env.NODE_ENV === 'dev';

const port = isDev ? 3003 : 3004;

const minimize = isProduction || isStage || process.argv.indexOf('--optimize-minimize') !== -1;

const babelLoaderConfiguration = {
    test: /\.jsx?$/,
    exclude: /node_modules.*/,
    use: {
        loader: 'babel-loader',
    },
};

const tsLoaderConfiguration = {
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: 'ts-loader',
};

const imageLoaderConfiguration = {
    test: /\.(png|jpe?g|gif|webp|tiff)(\?.*)?$/,
    type: 'asset/resource',
    generator: {
        filename: 'static/images/[name].[hash:8].[ext]',
    },
};

const svgLoaderConfiguration = {
    test: /\.svg$/,
    use: [
        '@svgr/webpack',
        {
            loader: 'file-loader',
            options: {
                name: 'static/images/[name].[hash:8].[ext]',
            },
        },
    ],
};

const fontsLoaderConfiguration = {
    test: /\.(woff2?|ttf|eot)(\?v=\w+)?$/,
    type: 'asset/resource',
    generator: {
        filename: 'fonts/[name][ext]',
    },
};

const styleLoaderConfiguration = {
    test: /\.css$/i,
    use: [isProduction || isStage ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader', 'postcss-loader'],
};

const config = {
    entry: {
        app: path.resolve(__dirname, './src/index.tsx'),
    },
    devServer: {
        // https: true,
        host: '127.0.0.1',
        port: port,
        historyApiFallback: true,
        hot: true,
        allowedHosts: ['127.0.0.1', 'localhost'],
    },
    plugins: [
        new DotenvFlow(),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: 'static/css/[name].[chunkhash].min.css',
            chunkFilename: 'static/css/[name].[chunkhash].css',
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: 'public/index.html',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'static/**/*',
                    context: path.resolve(__dirname, 'public'),
                },
                {
                    from: 'conektto.ico',
                    context: path.resolve(__dirname, 'public'),
                },
                {
                    from: 'manifest.json',
                    context: path.resolve(__dirname, 'public'),
                },
                {
                    from: 'msclarity.js',
                    context: path.resolve(__dirname, 'public'),
                },
            ],
        }),
        new NodePolyfillPlugin(),
        // new BundleAnalyzerPlugin(),
    ].filter(Boolean),
    devtool: 'source-map',
    mode: minimize ? 'production' : 'development',
    module: {
        rules: [
            imageLoaderConfiguration,
            svgLoaderConfiguration,
            fontsLoaderConfiguration,
            babelLoaderConfiguration,
            tsLoaderConfiguration,
            styleLoaderConfiguration,
        ],
    },
    optimization: {
        concatenateModules: minimize,
        minimize,
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
        nodeEnv: false,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `static/js/[name].[chunkhash].bundle${minimize ? '.min' : ''}.js`,
        chunkFilename: `static/js/[name].[chunkhash].bundle${minimize ? '.min' : ''}.js`,
        publicPath: '/',
        hashFunction: 'xxhash64',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        symlinks: false,
        fallback: {
            fs: false,
            module: false,
            os: false,
            path: false,
            tls: false,
            net: false,
        },
    },
};

module.exports = () => {
    // if (isProduction) {
    //     config.plugins.push(
    //         new CompressionPlugin({
    //             filename: '[path][base].gz',
    //             algorithm: 'gzip',
    //             test: /\.js$|\.css$/,
    //             deleteOriginalAssets: true,
    //         }),
    //     );
    // }
    return config;
};
