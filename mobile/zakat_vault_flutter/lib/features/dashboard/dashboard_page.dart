import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:glass_kit/glass_kit.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../services/dashboard_service.dart';
import '../../models/dashboard_models.dart';

import 'financial_advisor_widget.dart';
import '../../services/rates_service.dart';
import '../../shared/widgets/app_drawer.dart';

final dashboardSummaryProvider = FutureProvider((ref) => ref.read(dashboardServiceProvider).getSummary());
final dashboardCompositionProvider = FutureProvider((ref) => ref.read(dashboardServiceProvider).getComposition());
final dashboardHistoryProvider = FutureProvider((ref) => ref.read(dashboardServiceProvider).getValueHistory());
final latestRatesProvider = FutureProvider((ref) => ref.read(ratesServiceProvider).getLatestRates());

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  final currencyFormat = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 0);
  final rateFormat = NumberFormat.decimalPattern();

  Future<void> _refreshData() async {
    ref.invalidate(dashboardSummaryProvider);
    ref.invalidate(dashboardCompositionProvider);
    ref.invalidate(dashboardHistoryProvider);
    ref.invalidate(latestRatesProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('ZakatVault'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: _refreshData,
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const FinancialAdvisorWidget(),
              const SizedBox(height: 24),
              _buildMetricCards(),
              const SizedBox(height: 24),
              _buildCompositionChart(),
              const SizedBox(height: 24),
              _buildHistoryChart(),
              const SizedBox(height: 24),
              _buildMarketRates(),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCards() {
    final summaryAsync = ref.watch(dashboardSummaryProvider);

    return summaryAsync.when(
      data: (summary) => Column(
        children: [
          _buildGlassCard(
            title: 'Net Worth',
            value: currencyFormat.format(summary?.netWorth ?? 0),
            icon: LucideIcons.trendingUp,
            color: Colors.blue,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildGlassCard(
                  title: 'Total Assets',
                  value: currencyFormat.format(summary?.totalAssets ?? 0),
                  icon: LucideIcons.scale,
                  color: const Color(0xFF10B981), // Emerald
                  small: true,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildGlassCard(
                  title: 'Liabilities',
                  value: currencyFormat.format(summary?.totalLiabilities ?? 0),
                  icon: LucideIcons.dollarSign,
                  color: const Color(0xFFF43F5E), // Rose
                  small: true,
                ),
              ),
            ],
          ),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => Text('Error: $e'),
    );
  }

  Widget _buildGlassCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    bool small = false,
  }) {
    return GlassContainer.clearGlass(
      height: small ? 120 : 140,
      width: double.infinity,
      borderRadius: BorderRadius.circular(24),
      borderWidth: 1,
      elevation: 4,
      shadowColor: Colors.black.withOpacity(0.05),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color, size: small ? 20 : 24),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: small ? 14 : 16,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B), // Slate 600
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: TextStyle(
                  fontSize: small ? 20 : 28,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B), // Slate 800
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompositionChart() {
    final compositionAsync = ref.watch(dashboardCompositionProvider);

    return compositionAsync.when(
      data: (metrics) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)), // Slate 100
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Asset Composition',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 4,
                  centerSpaceRadius: 40,
                  sections: metrics.map((m) {
                    final color = _parseColor(m.color);
                    return PieChartSectionData(
                      color: color,
                      value: m.value,
                      title: '${(m.percentage * 100).toStringAsFixed(0)}%',
                      radius: 50,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: metrics.map((m) => _buildLegendItem(m.name, _parseColor(m.color))).toList(),
            ),
          ],
        ),
      ),
      loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
      error: (e, st) => Text('Error loading composition: $e'),
    );
  }

  Widget _buildHistoryChart() {
    final historyAsync = ref.watch(dashboardHistoryProvider);

    return historyAsync.when(
      data: (groups) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)), // Slate 100
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Portfolio History',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 250,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: groups.map((g) {
                    return LineChartBarData(
                      spots: g.history.asMap().entries.map((e) {
                        return FlSpot(e.key.toDouble(), e.value.value);
                      }).toList(),
                      isCurved: true,
                      color: _parseColor(g.color),
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: _parseColor(g.color).withOpacity(0.1),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
      loading: () => const SizedBox(height: 250, child: Center(child: CircularProgressIndicator())),
      error: (e, st) => Text('Error loading history: $e'),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))), // Slate
      ],
    );
  }

  Widget _buildMarketRates() {
    final ratesAsync = ref.watch(latestRatesProvider);

    return ratesAsync.when(
      data: (rates) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)), // Slate 100
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Current Market Rates',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: rates.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final rate = rates[index];
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC), // Slate 50
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.02),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: Icon(_getRateIcon(rate.icon), size: 18, color: const Color(0xFF64748B)), // Slate 600
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          rate.title,
                          style: const TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF374151)),
                        ),
                      ),
                      Text(
                        rateFormat.format(rate.value),
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
      loading: () => const SizedBox(height: 100, child: Center(child: CircularProgressIndicator())),
      error: (e, st) => Text('Error loading rates: $e'),
    );
  }

  IconData _getRateIcon(String iconName) {
    switch (iconName) {
      case 'Gem':
        return LucideIcons.gem;
      case 'DollarSign':
        return LucideIcons.dollarSign;
      case 'Coins':
        return LucideIcons.coins;
      default:
        return LucideIcons.trendingUp;
    }
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceAll('#', '0xff')));
    } catch (e) {
      return Colors.grey;
    }
  }
}
