import { View, Text, StyleSheet, Animated, Keyboard } from 'react-native';
import {
  Portal,
  useTheme,
  IconButton,
  TextInput,
  Title,
  ProgressBar,
  Button,
} from 'react-native-paper';
import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';

import QuizContainer from './QuizContainer';
import QuizCard from './QuizCard';
import Results from './Results';
import QuizStartPage from './QuizStartPage';
import AlertDialog from './AlertDialog';

import { Category, Flashcard, StackNavigationTypes } from './types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import db from '../db-services';
import { updateUser } from '../redux/userThunkActions';
import { updateCard } from '../redux/cardThunkActions';
import { showNotification } from '../redux/storeSlice';
import checkForLevelUp from '../utility/checkForLevelUp';
import swatchContext from '../contexts/swatchContext';
import { DateTime } from 'luxon';

interface Props {
  navigation: any;
  categoryRef: string;
  setRef: string;
  cards: Flashcard[];
  categoryXP: number;
  pattern: string;
  color: string;
  set: string;
  onDismiss: () => void;
}

const Quiz = ({
  navigation,
  categoryRef,
  setRef,
  onDismiss,
  categoryXP,
  cards,
  pattern,
  color,
  set,
}: Props) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<boolean>();

  // VIEW STATE
  const [startQuiz, setStartQuiz] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [completeQuiz, setCompleteQuiz] = useState(false);

  const dt = DateTime;

  const dispatch = useDispatch<AppDispatch>();
  const {
    user,
    cards: quiz,
    levelUpCondition,
  } = useSelector((state: RootState) => state.store);

  const selectedQuizSet = useMemo(() => {
    return quiz.set.find((c) => c._id === setRef);
  }, []);

  const { patterns } = useContext(swatchContext);
  const { colors: themeColors } = useTheme();

  // track questions that were correct
  const score = useRef(0);

  // whether user has reached last card of quiz
  const lastSlide = cardCount === flashcards.length - 1;

  const checkAnswer = () => {
    if (submitted) return;
    // check and remove trailing space and case sensitivity
    const userInput = answer.trim().toLowerCase();
    const solution = flashcards[cardCount].solution.trim().toLowerCase();

    if (userInput == solution) {
      setResult(true);
      score.current++;
    } else {
      setResult(false);
    }
    setSubmitted(true);
  };

  // reset and move to next slide
  const goToNextSlide = () => {
    setAnswer('');
    setSubmitted(false);
    setCardCount((prev) => prev + 1);
  };

  const submitResults = async () => {
    setCompleteQuiz(true);

    const stats = {
      date: dt.now().toISO(),
      set: setRef,
      score: score.current,
      questions: flashcards.length,
    };

    const updateStats = user.stats.concat(stats);

    dispatch(
      updateUser({
        stats: updateStats,
      })
    );
    // if quiz has not been taken today then award points
    if (!user.completedQuiz.includes(setRef)) {
      let awardHeartCoin = 0;
      const awardPoints = score.current;

      // if user leveled up then award 20 coins/level
      const levelUp = checkForLevelUp(user.xp, awardPoints, levelUpCondition);
      if (levelUp) {
        awardHeartCoin = 20 * levelUp;
      }
      const update = [...user.completedQuiz, setRef];

      // add points to category
      await db.findOne(
        { _id: categoryRef, type: 'category' },
        (err: Error, doc: Category) => {
          if (doc) {
            dispatch(
              updateCard({
                card: doc,
                query: { points: awardPoints + categoryXP },
              })
            );
          }
        }
      );
      // add points to user
      // add set to reference
      // can only earn points once/day
      dispatch(
        updateUser({
          completedQuiz: update,
          xp: user.xp + awardPoints,
          heartcoin: awardHeartCoin,
        })
      );
    }
  };

  // ANIMATION VALUES
  const inputAnimate = useRef<any>(new Animated.Value(0)).current;

  // shuffle cards in random order
  useEffect(() => {
    const shuffleArray = (array: Flashcard[]) => {
      let shuffled = [...array];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setFlashcards(shuffled);
    };
    shuffleArray(cards);
  }, [cards]);

  // shift component out of keyboard view
  useEffect(() => {
    const slideDialogUp = () => {
      Animated.spring(inputAnimate, {
        toValue: -100,
        useNativeDriver: true,
      }).start();
    };

    const slideDialogDown = () => {
      Animated.spring(inputAnimate, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    };
    const slideInputUp = Keyboard.addListener(
      'keyboardWillShow',
      slideDialogUp
    );
    const resetInput = Keyboard.addListener(
      'keyboardWillHide',
      slideDialogDown
    );

    return () => {
      slideInputUp.remove();
      resetInput.remove();
    };
  }, []);

  return (
    <Portal>
      <QuizContainer color={user.theme.bgColor}>
        <View style={styles.container}>
          <AlertDialog
            message='Are you sure you want to quit?'
            visible={showAlert}
            onConfirm={onDismiss}
            onDismiss={() => setShowAlert(false)}
          />
          {/* CLOSE QUIZ */}
          {!completeQuiz && (
            <IconButton
              icon='close-box'
              onPress={() => setShowAlert(true)}
              style={{ position: 'absolute', top: -10, left: -25 }}
            />
          )}

          {/* START AND OPEN QUIZ */}
          {!startQuiz && (
            <QuizStartPage
              title={set}
              count={flashcards.length}
              color={color}
              onPress={() => setStartQuiz(true)}
            />
          )}

          {/* QUIZ UNIT */}
          {startQuiz && (
            <Animated.View
              style={[
                {
                  transform: [{ translateY: inputAnimate }],
                  alignItems: 'center',
                },
              ]}
            >
              {/* SHOW QUIZ RESULTS */}
              {completeQuiz && (
                <Results
                  dismiss={onDismiss}
                  score={score.current}
                  total={flashcards.length}
                  set={selectedQuizSet!}
                  pointTotal={levelUpCondition}
                />
              )}

              {/* FLASHCARDS AND INPUT */}
              {!completeQuiz && (
                <View style={{ alignItems: 'center' }}>
                  <ProgressBar
                    color={color}
                    progress={(cardCount + 1) / flashcards.length}
                    style={{ width: 275, height: 6, borderRadius: 5 }}
                  />
                  <QuizCard
                    key={flashcards[cardCount]._id}
                    color={color}
                    result={result}
                    next={submitted}
                    pattern={pattern}
                    canFlip={submitted}
                    showSolution={submitted}
                    nextCard={goToNextSlide}
                    slideRemaining={lastSlide}
                    card={flashcards[cardCount]}
                    patternList={patterns}
                  />
                  <TextInput
                    mode='outlined'
                    style={styles.input}
                    activeOutlineColor='black'
                    outlineColor='lightgrey'
                    label='ANSWER'
                    maxLength={42}
                    value={answer}
                    onChangeText={(text) => setAnswer(text)}
                    disabled={submitted}
                  />
                  <View
                    style={{
                      width: 275,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Button
                      mode='text'
                      color={themeColors.secondary}
                      labelStyle={{ fontSize: 16 }}
                      onPress={() => setAnswer('')}
                      disabled={!answer ? true : submitted ? true : false}
                    >
                      Clear
                    </Button>

                    {lastSlide && submitted && (
                      <Button
                        mode='text'
                        color={themeColors.secondary}
                        labelStyle={{ fontSize: 16 }}
                        onPress={submitResults}
                      >
                        Results
                      </Button>
                    )}

                    <Button
                      mode='text'
                      color={themeColors.secondary}
                      labelStyle={{ fontSize: 16 }}
                      disabled={!answer ? true : submitted ? true : false}
                      onPress={checkAnswer}
                    >
                      Submit
                    </Button>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </QuizContainer>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  input: {
    width: 275,
  },
});

export default Quiz;
