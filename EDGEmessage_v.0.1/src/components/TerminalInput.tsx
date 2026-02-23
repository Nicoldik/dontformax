import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export const TerminalInput = (props: TextInputProps) => {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#00FF41"
      style={[styles.input, props.style]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#00FF41',
    color: '#00FF41',
    backgroundColor: '#000000',
    fontFamily: 'monospace',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8
  }
});
