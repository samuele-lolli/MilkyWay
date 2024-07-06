import './style.css';

const customTheme = {
  colors: {
    brand: [
      "#D5D9DD",
      "#BEC6CD",
      "#A7B4C0",
      "#90A4B6",
      "#7996B0",
      "#6089AE",
      "#497DAC",
      "#4B7092",
      "#4A657D",
      "#475A6C",
      "#43515E",
      "#3F4952",
      "#3A4148"
    ],
  },
  primaryColor: 'brand',
  fontFamily: 'Product Sans, sans-serif',
  headings: {
    fontFamily: 'Product Sans, sans-serif',
    fontWeight: 'bold',
    sizes: {
      h1: { fontWeight: 'bold', fontSize: '36px', fontWeight: 'bold', lineHeight: 1.2 },
      h2: { fontSize: '32px', fontWeight: 'bold', lineHeight: 1.3 },
      h3: { fontSize: '28px', fontWeight: 'bold', lineHeight: 1.4 },
      h4: { fontSize: '24px', fontWeight: 'bold', lineHeight: 1.5 },
      h5: { fontSize: '20px', fontWeight: 'bold', lineHeight: 1.6 },
      h6: { fontSize: '16px', fontWeight: 'normal', lineHeight: 1.7 },
    },
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export default customTheme;
