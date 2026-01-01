import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_service.dart';
import '../core/constants.dart';

final liabilityServiceProvider = Provider((ref) => LiabilityService(ref));

class LiabilityItem {
  final int id;
  final String title;
  final double amount;
  final DateTime? dueDate;
  final bool isDeductible;

  LiabilityItem({
    required this.id,
    required this.title,
    required this.amount,
    this.dueDate,
    required this.isDeductible,
  });

  factory LiabilityItem.fromJson(Map<String, dynamic> json) {
    return LiabilityItem(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate']) : null,
      isDeductible: json['isDeductible'] ?? false,
    );
  }
}

class LiabilityService {
  final Ref _ref;
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    validateStatus: (status) => status! < 500,
  ));

  LiabilityService(this._ref);

  Future<Options> _getOptions() async {
    final token = await _ref.read(authServiceProvider).getToken();
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  Future<List<LiabilityItem>> getLiabilities() async {
    try {
      final response = await _dio.get(
        '/Liabilities',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return (response.data as List)
            .map((l) => LiabilityItem.fromJson(l))
            .toList();
      }
    } catch (e) {
      print('LiabilityService: getLiabilities error: $e');
    }
    return [];
  }

  Future<LiabilityItem?> addLiability(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        '/Liabilities',
        data: data,
        options: await _getOptions(),
      );
      if (response.statusCode == 201) {
        return LiabilityItem.fromJson(response.data);
      }
    } catch (e) {
      print('LiabilityService: addLiability error: $e');
    }
    return null;
  }

  Future<bool> deleteLiability(int id) async {
    try {
      final response = await _dio.delete(
        '/Liabilities/$id',
        options: await _getOptions(),
      );
      return response.statusCode == 204;
    } catch (e) {
      print('LiabilityService: deleteLiability error: $e');
    }
    return false;
  }

  Future<LiabilityItem?> decreaseLiability(int id, double amount) async {
    try {
      final response = await _dio.patch(
        '/Liabilities/$id/decrease',
        data: {'amount': amount},
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        if (response.data['removed'] == true) return null;
        return LiabilityItem.fromJson(response.data);
      }
    } catch (e) {
      print('LiabilityService: decreaseLiability error: $e');
    }
    return null;
  }
}
