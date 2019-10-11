import createDataContext from './createDataContext';
import tracker from '../api/tracker';
import { navigate } from '../navigationRef';
import { AsyncStorage } from 'react-native';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'signin':
    case 'signup':
      return { token: action.payload, err_msg: '' };
    case 'set_err':
      return {
        ...state,
        err_msg: action.payload.err,
        signing_in: action.payload.loading
      };
    case 'set_loading':
      return { ...state, signing_in: action.payload, err_msg: '' };
    case 'signout':
      return { token: null, err_msg: '', signing_in: false };
    default:
      return state;
  }
};

const signin = dispatch => async ({ email, password }) => {
  try {
    dispatch({ type: 'set_loading', payload: true });
    const response = await tracker.post('/signin', {
      email,
      password
    });
    dispatch({ type: 'set_loading', payload: false });
    console.log(response.data);
    dispatch({ type: 'signin', payload: response.data.token });
    await AsyncStorage.setItem('auth_token', response.data.token);
    navigate('mainFlow');
  } catch (err) {
    dispatch({
      type: 'set_err',
      payload: {
        err: err.response.data.message || err.response.data.error,
        loading: false
      }
    });
    console.log(err.response.data);
  }
};

const signup = dispatch => async ({ email, password, name }) => {
  try {
    dispatch({ type: 'set_loading', payload: true });
    const response = await tracker.post('/signup', {
      email,
      password,
      name
    });
    dispatch({ type: 'set_loading', payload: false });
    console.log(response.data);
    dispatch({ type: 'signup', payload: response.data.token });
    await AsyncStorage.setItem('auth_token', response.data.token);
    navigate('mainFlow');
  } catch (err) {
    dispatch({
      type: 'set_err',
      payload: err.response.data.message || err.response.data.error
    });
    console.log(err.response.data);
  }
};

const signout = dispatch => async () => {
  await AsyncStorage.removeItem('auth_token');
  dispatch({ type: 'signout' });
  navigate('authFlow');
};

const tryLocalSignin = dispatch => async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      dispatch({ type: 'signin', payload: token });
      navigate('mainFlow');
    } else {
      navigate('authFlow');
    }
  } catch (err) {}
};

export const { Provider, Context } = createDataContext(
  authReducer,
  { signin, signup, signout, tryLocalSignin },
  { token: null, err_msg: '', signing_in: false }
);
