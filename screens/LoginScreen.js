import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Eventify</Text>
      <Text style={styles.subtitle}>Descubre el ritmo de tu ciudad</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      <Text style={styles.orText}>o inicia sesión con</Text>

      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={require('../assets/google-icon.png')}
            style={styles.socialIcon}
          />
          <Text style={styles.socialText}>Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.appleButton}>
          <Image
            source={require('../assets/apple-icon.png')}
            style={styles.socialIcon}
          />
          <Text style={styles.appleText}>Continuar con Apple</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.signupText}>
        ¿No tienes una cuenta?{' '}
        <Text style={styles.signupLink}>Regístrate</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C0A3E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#2C005F',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#fff',
    marginBottom: 12,
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#9B5DE5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotText: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  orText: {
    color: '#aaa',
    fontSize: 13,
    marginVertical: 10,
  },
  socialButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  socialText: {
    fontSize: 15,
    color: '#000',
  },
  appleText: {
    fontSize: 15,
    color: '#fff',
  },
  signupText: {
    color: '#aaa',
    marginTop: 20,
    fontSize: 13,
  },
  signupLink: {
    color: '#9B5DE5',
    fontWeight: 'bold',
  },
});
