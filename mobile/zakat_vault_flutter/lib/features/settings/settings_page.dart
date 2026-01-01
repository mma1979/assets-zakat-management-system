import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../shared/widgets/app_drawer.dart';
import 'pages/profile_settings_page.dart';
import 'pages/zakat_config_settings_page.dart';
import 'pages/timeline_settings_page.dart';
import 'pages/security_settings_page.dart';
import 'pages/price_alerts_settings_page.dart';
import 'pages/market_rates_settings_page.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      drawer: const AppDrawer(),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        children: [
          _buildsectionTitle('Account'),
          _buildSettingsTile(
            context, 
            icon: LucideIcons.user, 
            title: 'Profile', 
            subtitle: 'Personal information and preferences',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileSettingsPage())),
          ),
          _buildSettingsTile(
            context, 
            icon: LucideIcons.shield, 
            title: 'Security', 
            subtitle: 'Passwords and authentication',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecuritySettingsPage())),
          ),
          
          const SizedBox(height: 24),
          _buildsectionTitle('Zakat'),
          _buildSettingsTile(
            context, 
            icon: LucideIcons.calculator, 
            title: 'Configuration', 
            subtitle: 'Anniversary, currency, and calculation rules',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ZakatConfigSettingsPage())),
          ),
          _buildSettingsTile(
            context, 
            icon: LucideIcons.history, 
            title: 'Timeline', 
            subtitle: 'History of Zakat cycles and payments',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TimelineSettingsPage())),
          ),
          
          const SizedBox(height: 24),
          _buildsectionTitle('Preferences'),
          _buildSettingsTile(
            context, 
            icon: LucideIcons.bell, 
            title: 'Price Alerts', 
            subtitle: 'Notifications for gold and silver prices',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PriceAlertsSettingsPage())),
          ),
          _buildSettingsTile(
            context, 
            icon: LucideIcons.coins, 
            title: 'Market Rates', 
            subtitle: 'Manual rate overrides and sources',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MarketRatesSettingsPage())),
          ),
        ],
      ),
    );
  }

  Widget _buildsectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Color(0xFF94A3B8), // Slate 400
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFF1F5F9)), // Slate 100
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC), // Slate 50
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFF0F172A), size: 24), // Slate 900
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)), // Slate 500
        ),
        trailing: const Icon(LucideIcons.chevronRight, size: 20, color: Color(0xFFCBD5E1)), // Slate 300
        onTap: onTap,
      ),
    );
  }
}
