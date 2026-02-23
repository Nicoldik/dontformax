import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export const TerminalButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.btn}>
    <Text style={styles.text}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: '#00FF41',
    backgroundColor: '#000000',
    padding: 10,
    marginBottom: 8
  },
  text: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 13
  }
});
