const fs = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
const jsonImporter = require('node-sass-json-importer');
const merge = require('webpack-merge');

const environment = require('../environment');
const paths = require('../paths');
const parentAliases = require('../parentAliases')();
const collectEntries = require('../collectEntries');
const configPaths = [...Object.values(parentAliases), paths.src];

/**
 * Returns information for scripts building.
 */
const settings = {
    // Provide webpack configuration allowing child themes to introduce their own.
    webpack: configPaths.reduce(
        (config, srcPath) => {
            const parentConfigPath = path.resolve(
                srcPath,
                '../webpack.config.js'
            );
            let childConfig = {};
            try {
                childConfig = fs.readFileSync(parentConfigPath, 'utf-8');
            } catch (error) {}

            return merge({}, config, childConfig);
        },
        {
            entry: collectEntries('entries/*.ts'),
            output: {
                filename: 'js/[name].js',
                path: path.join(paths.dist, 'web'),
                library: '[name]',
                libraryTarget: 'umd',
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: {
                                    transpileOnly: true,
                                },
                            },
                        ],
                    },
                    {
                        test: /\.scss$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            {
                                loader: 'css-loader',
                                options: {
                                    url: false,
                                    sourceMap: environment.development,
                                },
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    sourceMap: environment.development,
                                    plugins: [
                                        require('postcss-flexbugs-fixes')(),
                                        require('autoprefixer')(),
                                    ],
                                },
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: environment.development,
                                    includePaths: [
                                        paths.src,
                                        'node_modules',
                                        ...Object.values(parentAliases),
                                    ],
                                    importer: jsonImporter(),
                                },
                            },
                        ],
                    },
                    {
                        test: /\.vue$/,
                        use: 'vue-loader',
                    },
                ],
            },
            plugins: [
                // FIX ISSUE: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/250
                new FilterWarningsPlugin({
                    exclude: /Conflicting order between:/,
                }),
                new MiniCssExtractPlugin({
                    // Options similar to the same options in webpackOptions.output
                    // both options are optional
                    filename: 'css/[name].css',
                    chunkFilename: 'css/[name].css',
                }),
                new VueLoaderPlugin(),
            ],
            resolve: {
                extensions: ['.tsx', '.ts', '.js'],
                alias: parentAliases,
                modules: [
                    paths.src,
                    'node_modules',
                    ...Object.values(parentAliases),
                ],
            },
            externals: {
                jquery: 'jquery',
                $: 'jquery',
                jQuery: 'jquery',
                Swiper: 'Swiper',
                'Magento_Ui/js/modal/modal': 'Magento_Ui/js/modal/modal',
                'Magento_Ui/js/lib/core/storage/local':
                    'Magento_Ui/js/lib/core/storage/local',
                Stickyfill: 'Stickyfill',
                'mage/translate': 'mage/translate',
                isMobile: 'isMobile',
                vendors: 'vendors',
                bootstrapSelect: 'bootstrapSelect',
            },
            devtool: environment.development ? 'inline-source-map' : false,
            mode: environment.development ? 'development' : 'production',
            watch: environment.watch,
            optimization: {
                splitChunks: {
                    cacheGroups: {
                        commons: {
                            name: 'commons',
                            chunks: 'initial',
                            minChunks: 5,
                        },
                    },
                },
            },
        }
    ),
};

module.exports = settings;
