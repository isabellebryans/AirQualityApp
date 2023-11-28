import { View, Text, Button, TextInput } from"react-native";
import myTextInput from "../components/textInput";
import myButton from "../components/button";
import Home from "./Home";
import { useNavigation } from "@react-navigation/native";
import React, {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import { Timestamp } from '@firebase/firestore-types';
import { format, subDays } from 'date-fns';
import {
    LineChart,
     BarChart,
     PieChart,
     ProgressChart,
     ContributionGraph,
     StackedBarChart
   } from "react-native-chart-kit";

interface DataPoint {
x: string; // Assuming x is a string representing the timestamp
y: number; // Assuming y is a number representing the air quality value
}

function ViewHistory(){
    const navigation = useNavigation()
    const currentTimestamp = useState(null);
    const [OldTimestamp, setOldTimestamp] = useState(null);
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const getCurrentTimestamp = (): number => {
        return Math.floor(new Date().getTime() / 1000);
      };


    const getReadings = async ()=>{
        try {
            console.log('Trying to get readings');
            // Calculate the timestamp for 24 hours ago
            const twentyFourHoursAgo = subDays(new Date(), 1).getTime() / 1000;
            // Create a reference to the "monitors" collection
            const airQualityRef = await firestore().collection('Nearby_air_quality').get();
    

            // Perform a Firestore query to get items within the last 24 hours
            console.log("got the goods. Time 24 hours ago is: ", twentyFourHoursAgo)
            //const querySnapshot = await airQualityRef.where('timestamp.toDate()', '>=', twentyFourHoursAgo).get();
            const newDataPoints = [];
            console.log("Got the goods.")
            airQualityRef.forEach((doc) => {
                console.log('Reading is', doc);
                const data = doc.data();
                console.log('Timestamp is ', data.timestamp.seconds);
                if(data.timestamp.seconds >= twentyFourHoursAgo){
                    newDataPoints.push({
                        x: format(new Date(data.timestamp.seconds* 1000), 'HH:mm'), // Format timestamp as desired
                        y: data.pm25Value, // Use the appropriate field from your data
                        });
                }
                
            });
            console.log('Readings are', newDataPoints);

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