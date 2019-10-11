import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';

const AuthForm = ({
  title,
  littleText,
  navigation,
  goTo,
  onSubmit,
  err_msg,
  isSignUp,
  isLoading
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    Keyboard.dismiss();
    onSubmit(isSignUp ? { email, password, name } : { email, password });
  };

  return (
    <View style={styles.container}>
      <Text h3>{title}</Text>
      {isSignUp ? (
        <Input
          inputContainerStyle={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name"
          autoCorrect={false}
        />
      ) : null}
      <Input
        inputContainerStyle={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        inputContainerStyle={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate(goTo)}
      >
        <Text style={styles.link}>{littleText}</Text>
      </TouchableOpacity>
      <Text style={styles.error}>{err_msg}</Text>
      <Button
        buttonStyle={styles.button}
        title="Submit"
        loading={isLoading}
        onPress={handleSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 50
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100,
    marginHorizontal: 15
  },
  input: {
    marginTop: 10
  },
  button: {
    marginTop: 20,
    width: 120
  },
  link: {
    alignSelf: 'flex-end',
    color: '#1F45EF',
    fontSize: 13,
    marginRight: 5
  },
  error: {
    marginVertical: 5,
    color: '#EA2245'
  }
});

export default AuthForm;
