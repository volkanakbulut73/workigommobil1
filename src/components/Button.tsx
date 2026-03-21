import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, textStyle }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isOutline && styles.outlineButton,
        isDanger && styles.dangerButton,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? '#00FF00' : '#000'} />
      ) : (
        <Text style={[
          styles.text,
          isPrimary && styles.primaryText,
          isOutline && styles.outlineText,
          isDanger && styles.dangerText,
          textStyle,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 55,
  },
  primaryButton: {
    backgroundColor: '#00FF00',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#000',
  },
  outlineText: {
    color: '#00FF00',
  },
  dangerText: {
    color: '#fff',
  },
});
