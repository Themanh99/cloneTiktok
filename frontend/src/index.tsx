import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import GlobalStyles from '../src/components/GlobalStyles/GlobalStyles';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { VolumeProvider } from './context';

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <VolumeProvider>
        <GlobalStyles>
          <App />
        </GlobalStyles>
      </VolumeProvider>
    </PersistGate>
  </Provider>,
);

reportWebVitals(console.log);
