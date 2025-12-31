import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/zakat_service.dart';

import '../../services/transaction_service.dart';
import '../../services/rates_service.dart';

class FinancialAdvisorWidget extends ConsumerStatefulWidget {
  const FinancialAdvisorWidget({super.key});

  @override
  ConsumerState<FinancialAdvisorWidget> createState() => _FinancialAdvisorWidgetState();
}

class _FinancialAdvisorWidgetState extends ConsumerState<FinancialAdvisorWidget> {
  String? _advice;
  bool _loading = false;

  Future<void> _getAdvice() async {
    setState(() => _loading = true);
    
    try {
      final config = await ref.read(zakatServiceProvider).getConfig();
      final apiKey = config?.geminiApiKey;

      if (apiKey == null || apiKey.isEmpty) {
        setState(() {
          _advice = 'Please configure your Gemini API Key in Zakat Setup/Settings to get AI financial advice.';
          _loading = false;
        });
        return;
      }

      final transactions = await ref.read(transactionServiceProvider).getTransactions();
      final rates = await ref.read(ratesServiceProvider).getLatestRates();
      final baseCurrency = config?.baseCurrency ?? 'EGP';

      final portfolioSummary = _calculatePortfolioSummary(transactions, rates, baseCurrency);

      final model = GenerativeModel(model: 'gemini-1.5-flash', apiKey: apiKey);
      final prompt = 'As a specialized Zakat and Islamic Financial Advisor, please analyze my portfolio and provide concise, actionable advice in English. '
          'Format your response with clear headings and bullet points. '
          'Current Portfolio: $portfolioSummary. '
          'Include advice on Zakat optimization and general financial health.';

      final response = await model.generateContent([Content.text(prompt)]);
      
      setState(() {
        _advice = response.text;
      });
    } catch (e) {
      setState(() => _advice = 'Error getting advice: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  String _calculatePortfolioSummary(List<TransactionItem> transactions, List<RateItem> rates, String baseCurrency) {
    // Simplified summary for the prompt
    final assetSummary = <String, double>{};
    for (final tx in transactions) {
      final asset = tx.assetType ?? baseCurrency;
      if (tx.type == 'BUY') {
        assetSummary[asset] = (assetSummary[asset] ?? 0) + tx.amount;
      } else {
        assetSummary[asset] = (assetSummary[asset] ?? 0) - tx.amount;
      }
    }
    
    return assetSummary.entries
        .where((e) => e.value > 0)
        .map((e) => '${e.key}: ${e.value.toStringAsFixed(2)}')
        .join(', ');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.indigo.shade50, Colors.purple.shade50],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.indigo.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.sparkles, color: Colors.indigo, size: 24),
              ),
              const SizedBox(width: 12),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'AI Financial Advisor',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                  ),
                  Text(
                    'Get smart insights on your Zakat portfolio',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (_advice == null)
            Center(
              child: Column(
                children: [
                  Icon(LucideIcons.bot, size: 48, color: Colors.indigo.shade200),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loading ? null : _getAdvice,
                    icon: _loading 
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(LucideIcons.sparkles, size: 18),
                    label: Text(_loading ? 'Analyzing...' : 'Get AI Advice'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.indigo.shade100),
                  ),
                  child: Column(
                    children: [
                      Text(
                        _advice!,
                        style: const TextStyle(fontSize: 14, color: Color(0xFF374151), height: 1.5),
                      ),
                      const SizedBox(height: 12),
                      const Divider(),
                      Row(
                        children: [
                          Icon(LucideIcons.alertTriangle, size: 14, color: const Color(0xFF94A3B8)), // Slate 400
                          const SizedBox(width: 8),
                          Text(
                            'AI advice is for informational purposes.',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)), // Slate 400
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _advice = null),
                  child: const Text('New Analysis', style: TextStyle(color: Colors.indigo, fontSize: 12)),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
