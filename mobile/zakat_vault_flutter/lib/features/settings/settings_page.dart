import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../shared/widgets/app_drawer.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: const Color(0xFF047857),
          unselectedLabelColor: const Color(0xFF64748B), // Slate 500
          indicatorColor: const Color(0xFF059669),
          tabs: const [
            Tab(icon: Icon(LucideIcons.user), text: 'Profile'),
            Tab(icon: Icon(LucideIcons.calculator), text: 'Config'),
            Tab(icon: Icon(LucideIcons.history), text: 'Timeline'),
            Tab(icon: Icon(LucideIcons.shield), text: 'Security'),
            Tab(icon: Icon(LucideIcons.bell), text: 'Alerts'),
            Tab(icon: Icon(LucideIcons.coins), text: 'Rates'),
          ],
        ),
      ),
      drawer: const AppDrawer(),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPlaceholderTab('Profile Settings'),
          _buildPlaceholderTab('Zakat Configuration'),
          _buildPlaceholderTab('Zakat Timeline'),
          _buildPlaceholderTab('Security Settings'),
          _buildPlaceholderTab('Price Alerts'),
          _buildPlaceholderTab('Market Rates'),
        ],
      ),
    );
  }

  Widget _buildPlaceholderTab(String label) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.settings, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            label,
            style: const TextStyle(fontSize: 18, color: Color(0xFF64748B)),
          ),
          const Text('Coming Soon', style: TextStyle(color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}
