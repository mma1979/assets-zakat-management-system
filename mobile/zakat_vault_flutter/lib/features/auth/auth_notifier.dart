import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/auth_models.dart';
import '../../services/auth_service.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool twoFactorRequired;
  final String? challengeToken;
  final String? email;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.twoFactorRequired = false,
    this.challengeToken,
    this.email,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? twoFactorRequired,
    String? challengeToken,
    String? email,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      twoFactorRequired: twoFactorRequired ?? this.twoFactorRequired,
      challengeToken: challengeToken ?? this.challengeToken,
      email: email ?? this.email,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    return AuthState();
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    
    final authService = ref.read(authServiceProvider);
    final (result, error) = await authService.login(email, password);
    
    if (result != null) {
      if (result.twoFactorRequired) {
        state = state.copyWith(
          isLoading: false,
          twoFactorRequired: true,
          challengeToken: result.challengeToken,
          email: email,
        );
        return false;
      }
      
      state = state.copyWith(user: result.user, isLoading: false);
      return true;
    } else {
      state = state.copyWith(isLoading: false, error: error ?? 'Login failed');
      return false;
    }
  }

  Future<bool> register(String email, String password, String fullName) async {
    state = state.copyWith(isLoading: true, error: null);
    
    final authService = ref.read(authServiceProvider);
    final (result, error) = await authService.register(email, password, fullName);
    
    if (result != null) {
      state = state.copyWith(user: result.user, isLoading: false);
      return true;
    } else {
      state = state.copyWith(isLoading: false, error: error ?? 'Registration failed');
      return false;
    }
  }

  Future<bool> verify2Fa(String code) async {
    final challengeToken = state.challengeToken;
    final email = state.email;
    if (challengeToken == null || email == null) {
      state = state.copyWith(error: 'Missing verification data');
      return false;
    }

    state = state.copyWith(isLoading: true, error: null);
    
    final authService = ref.read(authServiceProvider);
    final (result, error) = await authService.verify2Fa(code, challengeToken, email);
    
    if (result != null) {
      state = state.copyWith(
        user: result.user, 
        isLoading: false,
        twoFactorRequired: false,
        challengeToken: null,
      );
      return true;
    } else {
      state = state.copyWith(isLoading: false, error: error ?? 'Verification failed');
      return false;
    }
  }

  void resetError() {
    state = state.copyWith(error: null);
  }

  Future<void> logout() async {
    final authService = ref.read(authServiceProvider);
    await authService.logout();
    state = AuthState();
  }
}

final authNotifierProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
