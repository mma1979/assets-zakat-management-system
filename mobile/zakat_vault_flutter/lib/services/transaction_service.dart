import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_service.dart';
import '../core/constants.dart';

final transactionServiceProvider = Provider((ref) => TransactionService(ref));

class TransactionItem {
  final int id;
  final String type;
  final String? assetType;
  final double amount;
  final double? pricePerUnit;
  final DateTime date;

  TransactionItem({
    required this.id,
    required this.type,
    this.assetType,
    required this.amount,
    this.pricePerUnit,
    required this.date,
  });

  factory TransactionItem.fromJson(Map<String, dynamic> json) {
    return TransactionItem(
      id: json['id'] ?? 0,
      type: json['type'] ?? '',
      assetType: json['assetType'],
      amount: (json['amount'] ?? 0).toDouble(),
      pricePerUnit: (json['pricePerUnit'] ?? 0).toDouble(),
      date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class TransactionService {
  final Ref _ref;
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    validateStatus: (status) => status! < 500,
  ));

  TransactionService(this._ref);

  Future<Options> _getOptions() async {
    final token = await _ref.read(authServiceProvider).getToken();
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  Future<List<TransactionItem>> getTransactions() async {
    try {
      final response = await _dio.get(
        '/Transactions',
        options: await _getOptions(),
      );
      if (response.statusCode == 200) {
        return (response.data as List)
            .map((t) => TransactionItem.fromJson(t))
            .toList();
      }
    } catch (e) {
      print('TransactionService: getTransactions error: $e');
    }
    return [];
  }

  Future<bool> addTransaction(Map<String, dynamic> txData) async {
    try {
      final response = await _dio.post(
        '/Transactions',
        data: txData,
        options: await _getOptions(),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('TransactionService: addTransaction error: $e');
      return false;
    }
  }

  Future<bool> removeTransaction(int id) async {
    try {
      final response = await _dio.delete(
        '/Transactions/$id',
        options: await _getOptions(),
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('TransactionService: removeTransaction error: $e');
      return false;
    }
  }
}
