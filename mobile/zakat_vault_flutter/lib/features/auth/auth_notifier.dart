import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/auth_models.dart';
import '../../services/auth_service.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool twoFactorRequired;
  final String? challengeToken;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.twoFactorRequired = false,
    this.challengeToken,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? twoFactorRequired,
    String? challengeToken,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      twoFactorRequired: twoFactorRequired ?? this.twoFactorRequired,
      challengeToken: challengeToken ?? this.challengeToken,
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

  Future<void> logout() async {
    final authService = ref.read(authServiceProvider);
    await authService.logout();
    state = AuthState();
  }
}

final authServiceProvider = Provider((ref) => AuthService());

final authNotifierProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
