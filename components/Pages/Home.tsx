import { View, ScrollView, StyleSheet } from 'react-native';
import React, {
  useEffect,
  useReducer,
  Suspense,
} from 'react';
import {
  ActivityIndicator,
  Button,
  Text,
  Title,
  useTheme,
} from 'react-native-paper';

import { CommonActions, useIsFocused } from '@react-navigation/native';

import { cardReducer } from '../../reducers/CardReducer';

import getData from '../../utility/getData';
import FavoriteCard from '../FavoriteCard';

import { Set, StackNavigationTypes, User } from '../types';
import loginStreak from '../../utility/loginStreak';
import sortWeek from '../../utility/sortWeek';
import LoginGoal from '../LoginGoal';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { updateUser } from '../../redux/userSlice';
import {showMessage} from '../../redux/notificationSlice'

interface Props extends StackNavigationTypes {}

const Home: React.FC<Props> = ({ navigation, route }) => {
  const [favorites, cardDispatch] = useReducer(cardReducer, []);
  const { user, loading } = useSelector(
    (state: RootState) => state.user
  );

  const isFocused = useIsFocused();
  const { colors } = useTheme();


  const navigateToFavorite = (set: Set) => {
    navigation.dispatch({
      ...CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'flashcards',
            state: {
              routes: [
                {
                  name: 'Categories',
                },
                {
                  name: 'Sets',
                  params: {
                    categoryRef: set.categoryRef,
                  },
                },
                {
                  name: 'Cards',
                  params: {
                    color: set.color,
                    design: set.design,
                    setRef: set._id,
                    categoryRef: set.categoryRef,
                  },
                },
              ],
            },
          },
        ],
      }),
    });
  };

  useEffect(() => {
    if (isFocused) {
      getData({ type: 'set', favorite: true }, cardDispatch);
    } else return;
  }, [isFocused]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', marginTop: 15 }}>
        <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
          <Title style={{ color: colors.secondary }}>
            LEVEL: {user.level}
          </Title>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
          <Title style={{ color: colors.secondary }}>
            XP: {user.experiencePoints}
          </Title>
        </View>
      </View>

      <LoginGoal dates={user.login.week} streak={user.login.streak} />

      <Title style={{ textAlign: 'center', color: colors.secondary }}>
        FAVORITE SETS
      </Title>

      <Suspense fallback={<ActivityIndicator />}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.favoritesContainer,
            { width: 180 * favorites.length },
          ]}
        >
          {favorites.map((set) => {
            return (
              <FavoriteCard
                key={set._id}
                card={set}
                onPress={() => navigateToFavorite(set)}
              />
            );
          })}
        </ScrollView>
      </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  favoritesContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  infoCard: {
    width: '45%',
    height: 75,
    borderRadius: 10,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Home;
