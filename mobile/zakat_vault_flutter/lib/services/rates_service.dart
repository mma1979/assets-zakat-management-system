import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_service.dart';
import '../core/constants.dart';

final ratesServiceProvider = Provider((ref) => RatesService(ref));

class RateItem {
  final int id;
  final String name;
  final String icon;
  final String title;
  final double value;
  final DateTime lastUpdated;

  RateItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.title,
    required this.value,
    required this.lastUpdated,
  });

  factory RateItem.fromJson(Map<String, dynamic> json) {
    return RateItem(
      id: json['id'] ?? 0,
      name: json['key'] ?? '',  // API uses 'key' not 'name'
      icon: json['icon'] ?? '',
      title: json['title'] ?? '',
      value: (json['value'] ?? 0).toDouble(),
      lastUpdated: DateTime.parse(json['lastUpdated'] ?? DateTime.now().toIso8601String()),
    );
  }

}

class RatesService {
  final Ref _ref;
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    validateStatus: (status) => status! < 500,
  ));

  RatesService(this._ref);

  Future<Options> _getOptions() async {
    final token = await _ref.read(authServiceProvider).getToken();
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  Future<List<RateItem>> getLatestRates() async {
    try {
      final response = await _dio.get(
        '/Rates',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return (response.data as List)
            .map((r) => RateItem.fromJson(r))
            .toList();
      }
    } catch (e) {
      print('RatesService: getLatestRates error: $e');
    }
    return [];
  }
}
