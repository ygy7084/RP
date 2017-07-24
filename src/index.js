
import es6_promise from 'es6-promise';
es6_promise.polyfill();
import 'isomorphic-fetch';

import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './containers';

const rootElement = document.getElementById('root');

const render = (Component) => {
    ReactDOM.render(
            <Component/>
        , rootElement);
};

render(App);
