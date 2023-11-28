import React from "react";
import Navigator  from "./src/config/navigator";
import Home from "./src/screens/Home";
import { NavigationContainer } from '@react-navigation/native';
import SignIn from "./src/screens/SignIn";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DisplayImage from "./src/screens/AQI_image";
import ViewHistory from "./src/screens/History";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name = "Sign In" 
          component = {SignIn} 
        />
        <Stack.Screen 
          name = "Home" 
          component = {Home} 
        />
        <Stack.Screen
          name = "AQI Graph"
          component={DisplayImage}
        />
        <Stack.Screen
          name = "History"
          component={ViewHistory}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;