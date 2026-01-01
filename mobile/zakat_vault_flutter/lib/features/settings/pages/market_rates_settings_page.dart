import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MarketRatesSettingsPage extends StatelessWidget {
  const MarketRatesSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Market Rates')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.coins, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            const Text(
              'Market Rates',
              style: TextStyle(fontSize: 18, color: Color(0xFF64748B)),
            ),
            const Text('Coming Soon', style: TextStyle(color: Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }
}
