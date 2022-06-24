import { View, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import {
  Button,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import React, {
  useState,
  useReducer,
  useEffect,
  Suspense,
  useCallback,
  useMemo,
} from 'react';
import uuid from 'react-native-uuid';
import { DateTime } from 'luxon';

// UTILITIES
import checkDuplicate from '../../utility/checkDuplicate';
import useMarkSelection from '../../hooks/useMarkSelection';
import getData from '../../utility/getData';
import * as Haptics from 'expo-haptics';

// COMPONENTS
import ActionDialog from '../ActionDialog';
import TitleCard from '../TitleCard';
import AlertDialog from '../AlertDialog';
import SwatchSelector from '../SwatchSelector';

// TYPES
import { Category, Set } from '../types';
import { StackNavigationTypes } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import {
  addCategoryCard,
  getCards,
  removeCard,
  updateCard,
} from '../../redux/cardThunkActions';
import { checkLogin } from '../../redux/userThunkActions';


const INITIAL_STATE: { id: string; name: string; color: string } = {
  id: '',
  name: '',
  color: 'tomato',
};

interface Props extends StackNavigationTypes {}

const Categories: React.FC<Props> = ({ navigation, route }) => {
  // data state

  const [category, setCategory] = useState(INITIAL_STATE);
  // view state
  const [showDialog, setShowDialog] = useState(false);
  // const [showSwatch, setShowSwatch] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  // edit state
  const [editMode, setEditMode] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const { colors } = useTheme();
  const { selection, selectItem, clearSelection } = useMarkSelection();

  const { user, cards } = useSelector((state: RootState) => state.store);

  const dispatch = useDispatch<AppDispatch>();

  const closeDialog = () => {
    setShowDialog(false);
    setTimeout(() => {
      setCategory(INITIAL_STATE);
      setEditMode(false);
    }, 300);
  };

  const addNewCategory = () => {
    const exist = checkDuplicate(category.name, 'name', cards.category);

    if (!exist) {
      const newDoc: Category = {
        _id: uuid.v4().toString(),
        name: category.name,
        color: category.color,
        type: 'category',
        createdAt: DateTime.now().toISO(),
        points: 0,
      };

      dispatch(addCategoryCard(newDoc));
    }
    closeDialog();
  };

  const editCategory = (category: Category | Set) => {
    setCategory({
      id: category._id,
      name: category.name,
      color: category.color,
    });
    setEditMode(true);
    setShowDialog(true);
  };

  const submitEdit = () => {
    const docQuery = { name: category.name, color: category.color };
    dispatch(
      updateCard({ id: category.id, type: 'category', query: docQuery })
    );
    closeDialog();
  };

  const deleteCategory = (id: string) => {
    dispatch(removeCard({ id, type: 'category' }));
  };

  const cancelMultiDeletion = () => {
    setMultiSelectMode(false);
    setShowAlert(false);
  };

  const confirmAlert = () => {
    if (selection.current.length > 0) {
      setShowAlert(true);
    } else {
      cancelMultiDeletion();
    }
  };

  const deleteSelection = () => {
    // cycle through selection and delete each ID
    for (let i = 0; i < selection.current.length; i++) {
      dispatch(removeCard({ id: selection.current[i], type: 'category' }));
    }
    cancelMultiDeletion();
  };

  const selectColor = useCallback((color: string) => {
    setCategory((prev) => ({ ...prev, color }));
    // if (category.color !== color) {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // }
  }, []);

  useEffect(() => {
    dispatch(checkLogin(user.login[user.login.length - 1]));
  }, []);


  return (
    <View>
      {/* button wrapper */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: 75,
          paddingHorizontal: 15,
        }}
      >
        {!multiSelectMode && (
          <Button
            mode='contained'
            style={styles.button}
            labelStyle={[styles.buttonLabel, { color: colors.secondary }]}
            color={colors.primary}
            onPress={() => setShowDialog(true)}
          >
            NEW
          </Button>
        )}
        {/* start mode to mark for deletion */}
        {!multiSelectMode && (
          <Button
            mode='contained'
            style={styles.button}
            labelStyle={[styles.buttonLabel, { color: colors.secondary }]}
            color={colors.primary}
            onPress={() => {
              clearSelection();
              setMultiSelectMode(true);
            }}
            disabled={cards.category.length === 0}
          >
            EDIT
          </Button>
        )}

        {/* confirm selection for deletion */}
        {multiSelectMode && (
          <Button
            mode='text'
            style={[styles.button, { position: 'absolute', right: 0 }]}
            labelStyle={styles.buttonLabel}
            color='red'
            onPress={confirmAlert}
          >
            DELETE
          </Button>
        )}
      </View>

      <AlertDialog
        visible={showAlert}
        onDismiss={() => setShowAlert(false)}
        onConfirm={deleteSelection}
        message='DELETE SELECTED CATEGORIES?'
      />

      <Suspense fallback={<ActivityIndicator size='large' />}>
        <ScrollView>
          <View
            style={{
              paddingBottom: 150,
              flexWrap: 'wrap',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {cards.category?.map((category: Category) => {
              return (
                <TitleCard
                  key={category._id}
                  card={category}
                  multiSelect={multiSelectMode}
                  handleEdit={editCategory}
                  markForDelete={selectItem}
                  handleDelete={deleteCategory}
                  onPress={() => {
                    navigation.navigate('Sets', {
                      categoryRef: category._id,
                    });
                  }}
                />
              );
            })}
          </View>
        </ScrollView>
      </Suspense>

      {/* ADD NEW CATEGORY DIALOG */}
      <ActionDialog
        visible={showDialog}
        dismiss={() => setShowDialog(false)}
        title={editMode ? 'EDIT CATEGORY' : 'NEW CATEGORY'}
        onCancel={closeDialog}
        onSubmit={editMode ? submitEdit : addNewCategory}
        disableSubmit={category.name ? false : true}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TextInput
            mode='outlined'
            label='CATEGORY NAME'
            outlineColor='lightgrey'
            activeOutlineColor={colors.secondary}
            maxLength={32}
            value={category.name}
            onChangeText={(name) => setCategory((prev) => ({ ...prev, name }))}
            style={{ width: '80%', height: 40, margin: 0, marginBottom: 6 }}
          />

          <SwatchSelector color={category.color} setColor={selectColor} />
        </View>
      </ActionDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
    height: 50,
    elevation: 0,
    justifyContent: 'center',
  },
  buttonLabel: {
    // color: 'white',
  },
});

export default Categories;
