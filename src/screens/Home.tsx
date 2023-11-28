import React from "react";
import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

function Home(){
    const navigation = useNavigation()
    return <View>

        <Text>This is home screen.</Text>
        <Button
                title= "Enter"
                onPress={()=>navigation.navigate('AQI Graph')}
            />
    </View>
}

export default Home