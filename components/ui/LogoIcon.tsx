import React from 'react';
import { Animated, Easing, View, Image } from 'react-native';

export function LogoIcon({ size = 40 }) {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ 
      width: size, 
      height: size, 
      justifyContent: 'center', 
      alignItems: 'center',
      marginBottom: 4 // Thêm margin bottom để căn chỉnh với các biểu tượng khác
    }}>
      <Animated.View 
        style={{ 
          transform: [{ rotate: spin }],
          width: size,
          height: size,
        }}
      >
        <Image
          source={require('../../assets/images/logo-cobic.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
} 