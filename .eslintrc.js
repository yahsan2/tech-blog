module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "plugin:react/recommended",
    "airbnb",
    "airbnb/hooks",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  globals: {
    Atomics: "readonly",
    cy: "readonly",
    Cypress: "readonly",
    SharedArrayBuffer: "readonly",
    __DEV__: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    ecmaFeatures: {
      jsx: true,
    },
    project: ["./tsconfig.eslint.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "prefer-arrow",
    "react",
    "react-hooks",
  ],
  root: true,
  rules: {
    "no-use-before-define": "off",
    "no-console": "warn",
    "no-void": [
      "error",
      {
        allowAsStatement: true,
      },
    ],
    "no-param-reassign": [
      "error",
      { ignorePropertyModificationsFor: ["draft"] },
    ],
    "padding-line-between-statements": [
      "error",
      {
        blankLine: "always",
        prev: "*",
        next: "return",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "off",
      {
        vars: "all",
        args: "after-used",
        argsIgnorePattern: "_",
        ignoreRestSiblings: false,
        varsIgnorePattern: "_",
      },
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    "prefer-arrow/prefer-arrow-functions": [
      "error",
      {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false,
      },
    ],
    "react/jsx-filename-extension": [
      "error",
      {
        extensions: [".jsx", ".tsx"],
      },
    ],
    "react/jsx-props-no-spreading": [
      "error",
      {
        html: "enforce",
        custom: "ignore",
        explicitSpread: "ignore",
      },
    ],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/require-default-props": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/__specs__/**",
          "**/*/*.spec.*",
          "**/__tests__/**",
          "**/*/*.test.*",
          "src/setupTests.*",
          ".storybook/**",
          "stories/**",
          "**/*.stories.tsx",
          "**/mock/**",
        ],
      },
    ],
    "import/prefer-default-export": "off",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", "jsx", ".ts", ".tsx"],
        paths: ["src"],
      },
    },
  },
}
