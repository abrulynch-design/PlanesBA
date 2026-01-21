import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        blush: '#ffeff5'
      }
    }
  },
  plugins: []
};

export default config;
