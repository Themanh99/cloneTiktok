import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { publicRoutes } from './routes'
import DefaultLayout from './layouts/DefaultLayout/DefaultLayout'

function App() {
  return (
    <Router>
      <div className='App'>
        <Routes>
          {publicRoutes.map((route: any, index: number) => {
            const Page = route.component;
            let Layout = DefaultLayout as React.ComponentType<any> | typeof Fragment
            if (route.layout) {
              Layout = route.layout
            } else if (route.layout === null) {
              Layout = Fragment
            }
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout>
                    <Page />
                  </Layout>}
              />
            );
          })}
        </Routes>
      </div>
    </Router>
  );
}

export default App;


