import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/zakat_models.dart';
import '../core/constants.dart';
import 'auth_service.dart';
import '../features/auth/auth_notifier.dart';

class ZakatService {
  final Dio _dio;
  final AuthService _authService;

  ZakatService(this._authService) : _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    validateStatus: (status) => status! < 500,
  ));

  Future<Options> _getOptions() async {
    final token = await _authService.getToken();
    return Options(headers: {
      'Authorization': 'Bearer $token',
    });
  }

  Future<ZakatConfig?> getConfig() async {
    try {
      final response = await _dio.get('/api/zakat-config', options: await _getOptions());
      if (response.statusCode == 200) {
        return ZakatConfig.fromJson(response.data);
      }
    } catch (e) {
      print('ZakatService: GetConfig error: $e');
    }
    return null;
  }

  Future<(bool, String?)> updateConfig(ZakatConfig config, {bool isUpdate = false}) async {
    try {
      final method = isUpdate ? 'PUT' : 'POST';
      final response = await _dio.request(
        '/api/zakat-config',
        data: config.toJson(),
        options: (await _getOptions()).copyWith(method: method),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return (true, null);
      } else {
        final message = (response.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Update failed';
        return (false, message);
      }
    } on DioException catch (e) {
      final message = (e.response?.data as Map<String, dynamic>?)?['message']?.toString() ?? 'Network error';
      return (false, message);
    } catch (e) {
      return (false, 'Unexpected error occurred');
    }
  }
}

final zakatServiceProvider = Provider((ref) {
  final authService = ref.read(authServiceProvider);
  return ZakatService(authService);
});
