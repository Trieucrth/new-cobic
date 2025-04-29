import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 40 }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo-cobic.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
