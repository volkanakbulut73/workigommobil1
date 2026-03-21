import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/Button';

export function ProfileScreen() {
  const { signOut, user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profil</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Button 
        title="Güvenli Çıkış" 
        onPress={signOut} 
        variant="outline"
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    color: '#888',
    marginTop: 10,
  },
});
