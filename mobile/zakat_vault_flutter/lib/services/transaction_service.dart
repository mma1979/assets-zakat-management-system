import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_service.dart';

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
    baseUrl: 'http://207.180.204.185:9090',
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
        '/api/Transactions',
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
}
