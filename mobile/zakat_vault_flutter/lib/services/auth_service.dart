import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_models.dart';
import '../core/constants.dart';

final authServiceProvider = Provider((ref) => AuthService());

class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    validateStatus: (status) => status! < 500,
  ));
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<(AuthResponse?, String?)> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      print('AuthService: Login status ${response.statusCode}');
      print('AuthService: Login response data: ${response.data}');

      if (response.statusCode == 200) {
        final authData = AuthResponse.fromJson(response.data);
        await _saveAuth(authData);
        return (authData, null);
      } else {
        final message = (response.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Login failed';
        return (null, message);
      }
    } on DioException catch (e) {
      final message = (e.response?.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Network error';
      return (null, message);
    } catch (e) {
      return (null, 'Unexpected error occurred');
    }
  }

  Future<(AuthResponse?, String?)> register(String email, String password, String fullName) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'name': fullName,
      });

      print('AuthService: Register status ${response.statusCode}');
      print('AuthService: Register response data: ${response.data}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final authData = AuthResponse.fromJson(response.data);
        await _saveAuth(authData);
        return (authData, null);
      } else {
        final message = (response.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Registration failed';
        return (null, message);
      }
    } on DioException catch (e) {
      final message = (e.response?.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Network error';
      return (null, message);
    } catch (e) {
      return (null, 'Unexpected error occurred');
    }
  }

  Future<(AuthResponse?, String?)> verify2Fa(String code, String challengeToken, String email) async {
    try {
      final response = await _dio.post('/auth/verify-2fa', data: {
        'code': code,
        'challengeToken': challengeToken,
        'email': email,
      });

      print('AuthService: Verify2Fa status ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final authData = AuthResponse.fromJson(response.data);
        await _saveAuth(authData);
        return (authData, null);
      } else {
        final message = (response.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Invalid 2FA code';
        return (null, message);
      }
    } on DioException catch (e) {
      final message = (e.response?.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Network error';
      return (null, message);
    } catch (e) {
      return (null, 'Unexpected error occurred');
    }
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
