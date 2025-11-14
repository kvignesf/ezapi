module.exports = {
  presets: [
    '@babel/preset-typescript',
    '@babel/preset-env',
    [
      '@babel/preset-react',
      {
          runtime: 'automatic',
      },
    ]
  ],
  plugins: [
    // "inline-react-svg",
    "@babel/plugin-transform-runtime",
    // "inline-import-data-uri",
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          /**
           * Regular expression is used to match all files inside `./src` directory and map each `.src/folder/[..]` to `~folder/[..]` path
           */
           "@": "./src/"
        },
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.jsx',
          '.json',
          '.tsx',
          '.ts',
          '.native.js',
        ],
      },
    ],
    "babel-plugin-macros",
  ],
};
