import presetWeapp from "unocss-preset-weapp";
import {
  extractorAttributify,
  transformerClass,
} from "unocss-preset-weapp/transformer";

const { presetWeappAttributify, transformerAttributify } =
  extractorAttributify();

export default {
  presets: [
    // https://github.com/MellowCo/unocss-preset-weapp
    presetWeapp(),
    // attributify autocomplete
    presetWeappAttributify(),
  ],
  shortcuts: [
    {
      "border-base": "border border-gray-500_10",
      center: "flex justify-center items-center",
      "app-page-shell": "bg-[var(--app-bg)] text-[var(--app-text-primary)]",
      "app-text-primary": "text-[var(--app-text-primary)]",
      "app-text-secondary": "text-[var(--app-text-secondary)]",
      "app-text-tertiary": "text-[var(--app-text-muted)]",
      "app-text-disabled": "text-[var(--app-text-disabled)]",
      "app-brand-text": "text-[var(--app-brand)]",
      "app-surface": "bg-[var(--app-surface)]",
      "app-surface-raised": "bg-[var(--app-surface-raised)]",
      "app-control": "bg-[var(--app-surface-control)]",
      "app-divider": "border-[var(--app-divider)]",
    },
  ],

  transformers: [
    // https://github.com/MellowCo/unocss-preset-weapp/tree/main/src/transformer/transformerAttributify
    transformerAttributify(),

    // https://github.com/MellowCo/unocss-preset-weapp/tree/main/src/transformer/transformerClass
    transformerClass(),
  ],
};
