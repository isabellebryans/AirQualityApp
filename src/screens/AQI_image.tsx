import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
  logo: {
    width:500,
    height:300,
    resizeMode: 'contain',
  },
});

const DisplayImage = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../assets/AQI_graph.png')}
      />
    </View>
  );
};

export default DisplayImage;
