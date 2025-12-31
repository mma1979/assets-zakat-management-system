import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_models.dart';
import '../core/constants.dart';

class AuthService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConstants.baseUrl));
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<AuthResponse?> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final authData = AuthResponse.fromJson(response.data);
        await _saveAuth(authData);
        return authData;
      }
    } catch (e) {
      print('Login error: $e');
    }
    return null;
  }

  Future<AuthResponse?> register(String email, String password, String fullName) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'fullName': fullName,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final authData = AuthResponse.fromJson(response.data);
        await _saveAuth(authData);
        return authData;
      }
    } catch (e) {
      print('Register error: $e');
    }
    return null;
  }

  Future<void> _saveAuth(AuthResponse auth) async {
    await _storage.write(key: AppConstants.tokenKey, value: auth.token);
    await _storage.write(key: AppConstants.refreshTokenKey, value: auth.refreshToken);
  }

  Future<void> logout() async {
    await _storage.delete(key: AppConstants.tokenKey);
    await _storage.delete(key: AppConstants.refreshTokenKey);
  }

  Future<String?> getToken() => _storage.read(key: AppConstants.tokenKey);
}
