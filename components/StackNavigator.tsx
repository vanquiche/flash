import { View, Text } from 'react-native';
import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';
import AppBar from './AppBar';

import { StackNavigationTypes } from './types';

const Stack = createStackNavigator();

interface Screen {
  id?: string;
  name: string;
  component: React.FC<any>;
}

interface Props {
  screens: Screen[];
}

const StackNavigator: React.FC<Props> = ({ screens }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <AppBar {...props}/>
      }}
    >
      {screens.map((screen) => (
        <Stack.Screen name={screen.name} component={screen.component} key={screen.id} />
      ))}
    </Stack.Navigator>
  );
};

export default StackNavigator;
