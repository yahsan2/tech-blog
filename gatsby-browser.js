import 'typeface-montserrat';
import 'typeface-merriweather';
import './src/normalize.css';
import './src/style.css';
import 'prismjs/themes/prism.css';

import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';

export const wrapRootElement = ({ element }) => <ChakraProvider>{element}</ChakraProvider>;
