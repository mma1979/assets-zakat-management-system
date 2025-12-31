import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dashboard_models.dart';
import 'auth_service.dart';

final dashboardServiceProvider = Provider((ref) => DashboardService(ref));

class DashboardService {
  final Ref _ref;
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://207.180.204.185:9090',
    validateStatus: (status) => status! < 500,
  ));

  DashboardService(this._ref);

  Future<Options> _getOptions() async {
    final token = await _ref.read(authServiceProvider).getToken();
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  Future<DashboardSummary?> getSummary() async {
    try {
      final response = await _dio.get(
        '/api/Dashboard/summary',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return DashboardSummary.fromJson(response.data);
      }
    } catch (e) {
      print('DashboardService: getSummary error: $e');
    }
    return null;
  }

  Future<List<PortfolioMetric>> getComposition() async {
    try {
      final response = await _dio.get(
        '/api/Dashboard/portfolio-composition',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return (response.data as List)
            .map((m) => PortfolioMetric.fromJson(m))
            .toList();
      }
    } catch (e) {
      print('DashboardService: getComposition error: $e');
    }
    return [];
  }

  Future<List<PortfolioValueGroup>> getValueHistory() async {
    try {
      final response = await _dio.get(
        '/api/Dashboard/portfolio-value-history',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return (response.data as List)
            .map((g) => PortfolioValueGroup.fromJson(g))
            .toList();
      }
    } catch (e) {
      print('DashboardService: getValueHistory error: $e');
    }
    return [];
  }
}
