import React from "react";
import { View, Text, Button, TextInput } from"react-native";
import myTextInput from "../components/textInput";
import myButton from "../components/button";
import Home from "./Home";
import { useNavigation } from "@react-navigation/native";

function ViewHistory(){
    const navigation = useNavigation()
    return <View>
        	<Text>This is sign in screen. Please enter your username below.</Text>
            <TextInput>

            </TextInput>
            <Button
                title= "Enter"
                onPress={()=>navigation.navigate('Home')}
            />
    </View>
}

export default ViewHistory;