import { View, Text, Button, TextInput } from"react-native";
import myTextInput from "../components/textInput";
import myButton from "../components/button";
import Home from "./Home";
import { useNavigation } from "@react-navigation/native";
import React, {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import { format, subDays } from 'date-fns';
import {
    LineChart,
     BarChart,
     PieChart,
     ProgressChart,
     ContributionGraph,
     StackedBarChart
   } from "react-native-chart-kit";

function ViewHistory(){
    const navigation = useNavigation()
    const currentTimestamp = useState(null);
    const [OldTimestamp, setOldTimestamp] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);
    const getCurrentTimestamp = (): number => {
        return Math.floor(new Date().getTime() / 1000);
      };


    const getReadings = async ()=>{
        try {
            // Create a reference to the "monitors" collection
            const airQualityRef = firestore().collection('Nearby_air_quality');
        
            // Calculate the timestamp for 24 hours ago
            const twentyFourHoursAgo = subDays(new Date(), 1).getTime() / 1000;

            // Perform a Firestore query to get items within the last 24 hours
            const querySnapshot = await airQualityRef.where('timestamp', '>=', twentyFourHoursAgo).get();
            const newDataPoints = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                newDataPoints.push({
                x: format(new Date(data.timestamp * 1000), 'HH:mm'), // Format timestamp as desired
                y: data.pm25Value, // Use the appropriate field from your data
                });
            });
            // Iterate through the results
            querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Process each document data as needed
            console.log('Document data:', data);
            });
          } catch (error) {
            console.error('Error querying Firestore:', error);
          }
    }
    
    useEffect(() => {
        // Call get data
        getReadings();
      }, []);


    return (<View>
        	<Text>This is the Air Quality measurements from the last 24 hours.</Text>
            </View>)
}

export default ViewHistory;