import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Keyboard,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Portal, Dialog, IconButton } from 'react-native-paper';
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react';

import uuid from 'react-native-uuid';

import Swatch from './Swatch';
import { useSharedValue } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');

const defaultColor = [
  '#C0392B',
  '#E74C3C',
  '#9B59B6',
  '#8E44AD',
  '#2980B9',
  '#3498DB',
  '#1ABC9C',
  '#16A085',
  '#27AE60',
  '#2ECC71',
  '#F1C40F',
  '#F39C12',
  '#E67E22',
  '#D35400',
  '#FFFFFF',
  '#BDC3C7',
  '#95A5A6',
  '#7F8C8D',
  '#34495E',
  '#2C3E50',
];

interface Props {
  color: string;
  setColor: (color: string) => void;
}

const SwatchSelector: React.FC<Props> = ({ color, setColor }) => {
  const [showPalette, setShowPalette] = useState(false);

  const swatchRef = useRef<View>(null);
  const swatchLayoutY = useRef<number>(0);
  const swatchLayoutX = useRef<number>(0);

  const swatchAnimation = useRef<any>(new Animated.Value(0)).current;
  const swatchPosition = useSharedValue<any>(null);
  const caretPosition = useSharedValue<any>(null);

  const openSwatchDialog = () => {
    setShowPalette(true);
  };

  const measureSwatch = () => {
    if (swatchRef.current) {
      swatchRef.current.measure((width, height, px, py, fx, fy) => {
        // height and width of dialog plus padding
        const dialogWidth = 237;
        const dialogHieght = 225;
        swatchLayoutY.current = fy + py - dialogHieght;
        swatchLayoutX.current = fx + py - dialogWidth;
        // check if swatch button is on left or right side of screen to position
        // swatch selector on respective side
        if (SCREEN_WIDTH / 2 < fx) {
          swatchPosition.value = { right: 0 };
          caretPosition.value = { right: -5 };
        } else {
          swatchPosition.value = { left: 0 };
          caretPosition.value = { left: -5 };
        }
      });
    }
  };

  // shift swatch selector when keyboard show/hide
  useEffect(() => {
    const keyboardDownSubscription = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        Animated.spring(swatchAnimation, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardUpSubscription = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        Animated.spring(swatchAnimation, {
          toValue: -100,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardUpSubscription.remove();
      keyboardDownSubscription.remove();
    };
  }, []);

  return (
    <>
      <Portal theme={{ colors: { backdrop: 'transparent' } }}>
        <Dialog
          visible={showPalette}
          onDismiss={() => setShowPalette(false)}
          style={[
            styles.dialog,
            { top: swatchLayoutY.current },
            { transform: [{ translateY: swatchAnimation }] },
            { ...swatchPosition.value },
          ]}
        >
          <View style={styles.container}>
            <ScrollView
              persistentScrollbar={true}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.list} onStartShouldSetResponder={() => true}>
                {useMemo(() => {
                  return defaultColor.map((swatch) => (
                    <Swatch
                      key={uuid.v4().toString()}
                      color={swatch}
                      onChange={setColor}
                    />
                  ));
                }, [defaultColor])}
              </View>
            </ScrollView>
          </View>
          <IconButton
            icon='menu-down'
            size={50}
            color='white'
            style={[
              { position: 'absolute', bottom: -47 },
              { ...caretPosition.value },
            ]}
          />
        </Dialog>
      </Portal>
      <Pressable
        ref={swatchRef}
        style={[styles.swatch, { backgroundColor: color }]}
        onPress={openSwatchDialog}
        onLayout={measureSwatch}
      />
    </>
  );
};

const styles = StyleSheet.create({
  swatch: {
    height: 40,
    aspectRatio: 1,
    borderRadius: 10,
    margin: 0,
  },
  dialog: {
    height: 150,
    width: 235,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 1,
    position: 'absolute',
  },
  container: {
    flex: 1,
    paddingVertical: 5,
    position: 'relative',
  },
  list: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default SwatchSelector;
