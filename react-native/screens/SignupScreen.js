import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import AuthForm from '../components/AuthForm';
import { Context as AuthContext } from '../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const { state, signup } = useContext(AuthContext);

  return (
    <AuthForm
      title="Sign Up!"
      navigation={navigation}
      goTo="Signin"
      err_msg={state.err_msg}
      isLoading={state.signing_in}
      littleText="Already have an account? Sign in"
      onSubmit={signup}
      isSignUp
    />
  );
};

const styles = StyleSheet.create({});

SignupScreen.navigationOptions = () => {
  return {
    header: null
  };
};

export default SignupScreen;
