import {
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import React from 'react';


interface Props {
  name: string;
  select: any;
  patternList: Record<string, any>;
}
const Pattern = ({ select, name, patternList }: Props) => {
  const handlePress = () => {
    select(name);
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      onLongPress={(e) => e.preventDefault()}
    >
      <Image
        resizeMode='center'
        source={patternList[name]}
        style={styles.image}
      />
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    height: 45,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: 'black',
    margin: 5,
  },
  image: {
    height: 45,
    width: 45,
    resizeMode: 'contain',
    tintColor: 'white',
  },
});
export default React.memo(Pattern);
