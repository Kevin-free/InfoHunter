export interface ModelPricing {
  inputPrice: number;
  outputPrice: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Gemini
  'google/gemini-2.0-flash-exp:free': {
    inputPrice: 0,
    outputPrice: 0
  },
  'google/gemini-2.0-flash-001': {
    inputPrice: 0.1,
    outputPrice: 0.4
  },

  // DeepSeek
  'deepseek/deepseek-r1-distill-llama-70b': {
    inputPrice: 0.0,
    outputPrice: 0.0
  }
};

export const MODEL_OPTIONS = Object.keys(MODEL_PRICING).map((model) => ({
  value: model,
  label: model
}));
