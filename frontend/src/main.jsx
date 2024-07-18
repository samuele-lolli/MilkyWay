import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import customTheme from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
    <MantineProvider theme={customTheme}  withGlobalStyles withNormalizeCSS>
      <App />
    </MantineProvider>
)
