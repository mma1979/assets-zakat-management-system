import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../shared/widgets/app_drawer.dart';
import '../auth/auth_notifier.dart';
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

          const SizedBox(height: 32),
          Consumer(
            builder: (context, ref, child) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: TextButton.icon(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Logout'),
                        content: const Text('Are you sure you want to logout?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Logout', style: TextStyle(color: Colors.red)),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true) {
                      await ref.read(authNotifierProvider.notifier).logout();
                      if (context.mounted) {
                        Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                      }
                    }
                  },
                  icon: const Icon(LucideIcons.logOut, color: Color(0xFFF43F5E)),
                  label: const Text(
                    'Logout',
                    style: TextStyle(
                      color: Color(0xFFF43F5E),
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: Color(0xFFFECDD3)), // Rose 100
                    ),
                    backgroundColor: const Color(0xFFFFF1F2), // Rose 50
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          const Center(
            child: Text(
              'v1.0.0 • ZakatVault',
              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
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
