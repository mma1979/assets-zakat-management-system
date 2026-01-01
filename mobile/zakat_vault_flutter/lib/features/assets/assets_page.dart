import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../shared/widgets/app_drawer.dart';
import '../../services/rates_service.dart';
import '../../services/transaction_service.dart';
import 'assets_notifier.dart';
import 'assets_models.dart';
import 'widgets/add_transaction_dialog.dart';
import 'widgets/asset_calculator_dialog.dart';

class AssetsPage extends ConsumerWidget {
  const AssetsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(assetsNotifierProvider);
    final currencyFormat = NumberFormat.currency(symbol: 'EGP', decimalDigits: 2);
    final numberFormat = NumberFormat.decimalPattern();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Assets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {
              // TODO: Show Price Alerts
            },
          ),
          IconButton(
            icon: const Icon(Icons.calculate_outlined),
            onPressed: () {
              assetsAsync.whenData((state) {
                showDialog(
                  context: context,
                  builder: (context) => AssetCalculatorDialog(
                    rates: state.rates,
                    initialFrom: state.activeAssetType,
                  ),
                );
              });
            },
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: assetsAsync.when(
        data: (state) {
          final activeMetric = state.metrics[state.activeAssetType] ?? AssetMetrics.empty();
          final activeRate = state.rates.firstWhere(
            (r) => r.name == state.activeAssetType,
            orElse: () => RateItem(id: 0, name: '', icon: '', title: '', value: 0, lastUpdated: DateTime.now()),
          );

          return RefreshIndicator(
            onRefresh: () => ref.read(assetsNotifierProvider.notifier).refresh(),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Asset Portfolio',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    'Manage your holdings and track performance',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 20),
                  
                  // Asset Tabs
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: state.rates.map((rate) {
                        final isActive = state.activeAssetType == rate.name;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: ChoiceChip(
                            label: Text(rate.title.isNotEmpty ? rate.title : rate.name),
                            selected: isActive,
                            onSelected: (selected) {
                              if (selected) {
                                ref.read(assetsNotifierProvider.notifier).setActiveAsset(rate.name);
                              }
                            },
                            selectedColor: Colors.teal.shade100,
                            labelStyle: TextStyle(
                              color: isActive ? Colors.teal.shade900 : Colors.black87,
                              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stats Cards
                  _buildStatsSection(activeMetric, activeRate, currencyFormat, numberFormat),
                  
                  const SizedBox(height: 24),
                  
                  // Transaction History Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Transaction History',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      TextButton.icon(
                        onPressed: () => _showAddTransaction(context, ref, state),
                        icon: const Icon(Icons.add),
                        label: const Text('Add'),
                        style: TextButton.styleFrom(foregroundColor: Colors.teal),
                      ),
                    ],
                  ),
                  
                  // Transaction List
                  _buildTransactionList(context, ref, state, numberFormat, currencyFormat),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          assetsAsync.whenData((state) => _showAddTransaction(context, ref, state));
        },
        backgroundColor: Colors.teal,
        child: const Icon(Icons.add),
      ),
    );
  }


  Future<void> _showAddTransaction(BuildContext context, WidgetRef ref, AssetsState state) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AddTransactionDialog(
        rates: state.rates,
        initialAssetType: state.activeAssetType,
      ),
    );

    if (result != null) {
      await ref.read(assetsNotifierProvider.notifier).addTransaction(result);
    }
  }


  Widget _buildStatsSection(AssetMetrics metric, RateItem rate, NumberFormat currencyFormat, NumberFormat numberFormat) {
    return Column(
      children: [
        _buildStatCard(
          'Current Holdings',
          '${numberFormat.format(metric.quantity)} Units',
          Icons.account_balance_wallet_outlined,
          Colors.blue,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Avg Cost',
                currencyFormat.format(metric.avgCost),
                Icons.shopping_cart_outlined,
                Colors.orange,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Market Value',
                currencyFormat.format(metric.quantity * rate.value),
                Icons.trending_up,
                Colors.teal,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionList(BuildContext context, WidgetRef ref, AssetsState state, NumberFormat numberFormat, NumberFormat currencyFormat) {
    final transactions = state.transactions
        .where((t) => t.assetType == state.activeAssetType)
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    if (transactions.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.history, size: 48, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              Text(
                'No transactions yet for this asset',
                style: TextStyle(color: Colors.grey.shade500),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: transactions.length,
      itemBuilder: (context, index) {
        final tx = transactions[index];
        final isBuy = tx.type == 'BUY';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isBuy ? Colors.teal.shade50 : Colors.red.shade50,
              child: Icon(
                isBuy ? Icons.arrow_upward : Icons.arrow_downward,
                color: isBuy ? Colors.teal : Colors.red,
                size: 20,
              ),
            ),
            title: Text(
              '${isBuy ? 'Bought' : 'Sold'} ${numberFormat.format(tx.amount)} Units',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            subtitle: Text(
              DateFormat('dd-MM-yyyy').format(tx.date),
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      currencyFormat.format(tx.amount * (tx.pricePerUnit ?? 0)),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${numberFormat.format(tx.pricePerUnit)} / unit',
                      style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20, color: Colors.grey),
                  onPressed: () => _confirmDelete(context, ref, tx),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, TransactionItem tx) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Transaction'),
        content: const Text('Are you sure you want to delete this transaction?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(assetsNotifierProvider.notifier).removeTransaction(tx.id);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}


