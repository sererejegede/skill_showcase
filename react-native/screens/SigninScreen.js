import React, { useContext, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import AuthForm from '../components/AuthForm';
import { Context as AuthContext } from '../context/AuthContext';

const SigninScreen = ({ navigation }) => {
  const { state, signin, tryLocalSignin } = useContext(AuthContext);

  useEffect(() => {
    tryLocalSignin();
  }, []);

  return (
    <AuthForm
      title="Sign In!"
      navigation={navigation}
      goTo="Signup"
      err_msg={state.err_msg}
      isLoading={state.signing_in}
      littleText="Don't have an account? Sign up"
      onSubmit={signin}
    />
  );
};

const styles = StyleSheet.create({});

SigninScreen.navigationOptions = () => {
  return {
    header: null
  };
};

export default SigninScreen;
