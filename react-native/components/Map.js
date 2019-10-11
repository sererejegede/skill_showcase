import React, { useContext } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Circle } from 'react-native-maps';
import { Context as LocationContext } from '../context/LocationContext';

const Map = () => {
  const longitudeDelta = 0.01;
  const latitudeDelta = 0.01;
  const {
    state: { currentLocation }
  } = useContext(LocationContext);

  if (!currentLocation) {
    return <ActivityIndicator size="large" style={{ marginTop: 200 }} />;
  }

  return (
    <View>
      <MapView
        initialRegion={{
          ...currentLocation,
          latitudeDelta,
          longitudeDelta
        }}
        region={{
          ...currentLocation,
          latitudeDelta,
          longitudeDelta
        }}
        style={styles.mapContainer}
      >
        <Circle
          center={currentLocation}
          radius={20}
          strokeColor="rgba(190, 10, 190, 1)"
          fillColor="rgba(190, 10, 190, 0.3)"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 350,
    marginBottom: 10
  }
});

export default Map;
