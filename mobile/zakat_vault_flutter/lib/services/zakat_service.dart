import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_service.dart';
import '../core/constants.dart';
import '../models/zakat_models.dart';

final zakatServiceProvider = Provider((ref) => ZakatService(ref));

class ZakatCalculation {
  final double totalAssets;
  final double totalDebts;
  final double netZakatBase;
  final double goldAmount;
  final double totalZakatDue;
  final double totalPayments;
  final double remainingZakatDue;
  final double nisabGoldValue;
  final double nisabSilverValue;
  final String zakatStartDate;
  final String zakatEndDate;

  ZakatCalculation({
    required this.totalAssets,
    required this.totalDebts,
    required this.netZakatBase,
    required this.goldAmount,
    required this.totalZakatDue,
    required this.totalPayments,
    required this.remainingZakatDue,
    required this.nisabGoldValue,
    required this.nisabSilverValue,
    required this.zakatStartDate,
    required this.zakatEndDate,
  });

  factory ZakatCalculation.fromJson(Map<String, dynamic> json) {
    return ZakatCalculation(
      totalAssets: (json['totalAssets'] ?? 0).toDouble(),
      totalDebts: (json['totalDebts'] ?? 0).toDouble(),
      netZakatBase: (json['netZakatBase'] ?? 0).toDouble(),
      goldAmount: (json['glodAmount'] ?? 0).toDouble(), // Note: API typo 'glodAmount'
      totalZakatDue: (json['totalZakatDue'] ?? 0).toDouble(),
      totalPayments: (json['totalPayments'] ?? 0).toDouble(),
      remainingZakatDue: (json['remainingZakatDue'] ?? 0).toDouble(),
      nisabGoldValue: (json['nisabGoldValue'] ?? 0).toDouble(),
      nisabSilverValue: (json['nisabSilverValue'] ?? 0).toDouble(),
      zakatStartDate: json['zakatStartDate'] ?? '',
      zakatEndDate: json['zakatEndDate'] ?? '',
    );
  }
}

class ZakatPayment {
  final int id;
  final double amount;
  final DateTime date;
  final String? notes;

  ZakatPayment({
    required this.id,
    required this.amount,
    required this.date,
    this.notes,
  });

  factory ZakatPayment.fromJson(Map<String, dynamic> json) {
    return ZakatPayment(
      id: json['id'] ?? 0,
      amount: (json['amount'] ?? 0).toDouble(),
      date: DateTime.parse(json['date']),
      notes: json['notes'],
    );
  }
}

class ZakatService {
  final Ref _ref;
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    validateStatus: (status) => status! < 500,
  ));

  ZakatService(this._ref);

  Future<Options> _getOptions() async {
    final token = await _ref.read(authServiceProvider).getToken();
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  Future<ZakatCalculation?> getZakatCalculation() async {
    try {
      final response = await _dio.get(
        '/ZakatCalc',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return ZakatCalculation.fromJson(response.data);
      }
    } catch (e) {
      print('ZakatService: getZakatCalculation error: $e');
    }
    return null;
  }

  Future<List<ZakatPayment>> getZakatPayments() async {
    try {
      final response = await _dio.get(
        '/ZakatPayments',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return (response.data as List)
            .map((p) => ZakatPayment.fromJson(p))
            .toList();
      }
    } catch (e) {
      print('ZakatService: getZakatPayments error: $e');
    }
    return [];
  }

  Future<ZakatPayment?> addZakatPayment(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        '/ZakatPayments',
        data: data,
        options: await _getOptions(),
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        return ZakatPayment.fromJson(response.data);
      }
    } catch (e) {
      print('ZakatService: addZakatPayment error: $e');
    }
    return null;
  }

  Future<bool> deleteZakatPayment(int id) async {
    try {
      final response = await _dio.delete(
        '/ZakatPayments/$id',
        options: await _getOptions(),
      );
      return response.statusCode == 204 || response.statusCode == 200;
    } catch (e) {
      print('ZakatService: deleteZakatPayment error: $e');
    }
    return false;
  }

  Future<ZakatConfig?> getConfig() async {
    try {
      final response = await _dio.get(
        '/zakat-config',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return ZakatConfig.fromJson(response.data);
      }
    } catch (e) {
      print('ZakatService: getConfig error: $e');
    }
    return null;
  }

  Future<(bool, String?)> updateConfig(ZakatConfig config, {bool isUpdate = true}) async {
    try {
      final response = await _dio.request(
        '/zakat-config',
        data: config.toJson(),
        options: (await _getOptions()).copyWith(
          method: isUpdate ? 'PUT' : 'POST',
        ),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return (true, null);
      }
      return (false, 'Failed to save configuration');
    } catch (e) {
      print('ZakatService: updateConfig error: $e');
      return (false, e.toString());
    }
  }
}
