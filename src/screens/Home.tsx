
import { useNavigation } from "@react-navigation/native";

/**
* Sample React Native App
* https://github.com/facebook/react-native
*
* @format
* @flow strict-local
*/
import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Button, PermissionsAndroid} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import firebase from 'firebase/app';
// Function to get permission for location
const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    console.log('granted', granted);
    if (granted === 'granted') {
      console.log('You can use Geolocation');
      return true;
    } else {
      console.log('You cannot use Geolocation');
      return false;
    }
  } catch (err) {
    return false;
  }
};

const Home = () => {
// state to hold location
  const [location, setLocation] = useState(false);
  const [closestMonitor, setClosestMonitor] = useState(null);
  const [closestMonitorLocation, setClosestMonitorLocation] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [OldTimestamp, setOldTimestamp] = useState(null);
  const [pm25Value, setPm25Value] = useState(null);
  const navigation = useNavigation();

    const getCurrentUnixTimestamp = () => {
      const unixTimestamp = Math.floor(Date.now() / 1000);
      setCurrentTimestamp(unixTimestamp);
    };
    const getOldUnixTimestamp = () => {
          // Get the current Unix timestamp in milliseconds
            const currentTimestampMilliseconds = Date.now();

            // Subtract 2 hours (in milliseconds) from the current timestamp
            const twoHoursAgoTimestampMilliseconds = currentTimestampMilliseconds - 2 * 60 * 60 * 1000;

            // Convert the result to seconds (Unix timestamp)
            const twoHoursAgoUnixTimestamp = Math.floor(twoHoursAgoTimestampMilliseconds / 1000);
          setOldTimestamp(twoHoursAgoUnixTimestamp);
        };

  // function to check permissions and get Location
  const getLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      console.log('res is:', res);
      if (res) {
        Geolocation.getCurrentPosition(
          position => {
            console.log(position);
            const { latitude, longitude } = position.coords;
            getCurrentUnixTimestamp();
            setLocation(position);
            sendLocationToFirestore(latitude, longitude);
            findClosestMonitor(latitude, longitude);
            getCurrentUnixTimestamp();
            getOldUnixTimestamp();
            sendHttpRequestToAPI();
             // After setting pm25Value, call sendAirQualityDataToFirestore
             const pm25 = pm25Value; // Ensure you have the right pm25Value
             const monitor = closestMonitor; // Ensure you have the right closestMonitor
             sendAirQualityDataToFirestore(pm25, monitor);
             },
          error => {
            // See error code charts below.
            console.log(error.code, error.message);
            setLocation(false);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      }
    });
    console.log(location);
  };

const findClosestMonitor = async (latitude, longitude) => {
  try {
    // Create a reference to the "monitors" collection
    const monitorsRef = firestore().collection('Monitors');

    // Perform a Firestore query to get the nearest monitor based on the Haversine distance
   // Perform a Firestore query to get the nearest monitor based on the Haversine distance
       const querySnapshot = await monitorsRef.where('label', 'not-in', ['Noise', 'noise']).get();

   let closestDistance = Number.MAX_VALUE;
    let closestMonitorSerialNumber = null;

    querySnapshot.forEach((doc) => {
      const monitorData = doc.data();
      const monitorLocation = monitorData.position;
      if (monitorLocation) {
        // Calculate Haversine distance between your location and the monitor's location
        const monitorLatitude = monitorLocation.latitude;
        const monitorLongitude = monitorLocation.longitude;
        const distance = calculateHaversineDistance(latitude, longitude, monitorLatitude, monitorLongitude);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestMonitorSerialNumber = monitorData.serial_number;
          setClosestMonitorLocation(monitorData.location);
          console.log('monitor: ', closestMonitorSerialNumber);
        }
      }
    });
    setClosestMonitor(closestMonitorSerialNumber); // Now it includes the closest monitor's serial_number
  } catch (error) {
    console.error('Error querying Firestore:', error);
  }
};



    const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
      const earthRadius = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earthRadius * c;
    };

    // You can call this function to send the HTTP request
    const sendHttpRequestToAPI = () => {
        // Ensure that you have valid values for currentTimestamp, oldTimestamp, and closestMonitorSerialNumber
        sendHttpRequest(currentTimestamp, OldTimestamp, closestMonitor);
      };

    const sendHttpRequest = async (currentTimestamp, oldTimestamp, closestMonitorSerialNumber) => {
      const apiUrl = 'https://data.smartdublin.ie/sonitus-api/api/data';

      // Define the request data, including the Unix timestamps and serial number
      const requestData = {
        "username":"dublincityapi",
        "password":"Xpa5vAQ9ki",
        "monitor":closestMonitorSerialNumber,
        "start":oldTimestamp,
        "end":currentTimestamp,
      };

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (response.ok) {
              const responseData = await response.json();
              if (Array.isArray(responseData) && responseData.length > 0) {
                // Sort the response data by "datetime" in descending order
                responseData.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

                // Extract the most recent "pm2_5" value
                const mostRecentPm25Value = responseData[0].pm2_5;
                console.log('most recent pm25 value', mostRecentPm25Value);

                setPm25Value(mostRecentPm25Value);
              } else {
                setPm25Value(null); // No valid data in the response
              }
              console.log('HTTP POST request successful');
            } else {
              console.error('HTTP POST request failed');
              setPm25Value(null); // Set to null if the request fails
            }
          } catch (error) {
            console.error('Error sending HTTP request:', error);
            setPm25Value(null); // Set to null in case of an error
          }
    };

    const sendAirQualityDataToFirestore = (pm25Value, closestMonitorSerialNumber) => {
      if (pm25Value !== null) {
        firestore()
          .collection('Nearby_air_quality') // Replace with your collection name
          .add({
            pm25Value,
            monitorSerialNumber: closestMonitorSerialNumber,
            timestamp: firestore.FieldValue.serverTimestamp(),
          })
          .then(() => {
            console.log('Air quality data sent to Firestore');
          })
          .catch((error) => {
            console.error('Error sending air quality data to Firestore:', error);
          });
      } else {
        console.log('PM2.5 value is null, data not sent to Firestore.');
      }
    };



  const sendLocationToFirestore = (latitude, longitude) => {
      // Access your Firestore collection and add a new document with a GeoPoint
      firestore()
        .collection('Location') // Replace with your collection name
        .add({
          geopoint: new firestore.GeoPoint(latitude, longitude),
          timestamp: firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          console.log('Location data sent to Firestore');
        })
        .catch((error) => {
          console.error('Error sending location data to Firestore:', error);
        });
    };

    useEffect(() => {
        // Call getLocation initially
        getLocation();

        // Set up a timer to get location and send to Firestore every 5 minutes
        const intervalId = setInterval(() => {
          getLocation();
        }, 5 * 60 * 1000);

        // Clear the interval when the component is unmounted
        return () => clearInterval(intervalId);
      }, []);
   return (
       <View style={styles.container}>
         <Text>Welcome Home!</Text>
         <View
           style={{marginTop: 10, padding: 10, borderRadius: 10, width: '40%'}}>
           <Button
            title="Get Air Quality"
            // log location, and air quality
            onPress={getLocation}/>
         </View>
         <View>
            <Text>Location:</Text>
         </View>
         <Text>Latitude: {location ? location.coords.latitude : null}</Text>
         <Text>Longitude: {location ? location.coords.longitude : null}</Text>
         <View>
         <Text>Closest Air Quality Monitor:</Text>
         <Text>Serial Number: {closestMonitor ? closestMonitor : 'No monitor found'}</Text>
         <Text>Location: {closestMonitor ? closestMonitorLocation : 'No monitor found'} </Text>
         <Text>PM2.5 Value: {pm25Value !== null ? pm25Value : 'No data available'}</Text>
         </View>
        
        <Button
            title="See AQI graph"
            onPress={() => navigation.navigate('AQI Graph')}/>
        <Button
            title="See history"
            onPress={() => navigation.navigate('History')}/>
       </View>
     );};
  

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#fff',
   alignItems: 'center',
   justifyContent: 'center',
 },
});


export default Home;
    
