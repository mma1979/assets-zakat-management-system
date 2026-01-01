import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'features/auth/login_page.dart';
import 'features/auth/auth_notifier.dart';

import 'features/setup/zakat_setup_page.dart';
import 'features/dashboard/dashboard_page.dart';
import 'features/settings/settings_page.dart';
import 'features/assets/assets_page.dart';
import 'features/liabilities/liabilities_page.dart';
import 'features/zakat/zakat_calc_page.dart';

void main() {
  runApp(
    const ProviderScope(
      child: ZakatVaultApp(),
    ),
  );
}

class ZakatVaultApp extends ConsumerWidget {
  const ZakatVaultApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'ZakatVault',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const AuthWrapper(),
      routes: {
        '/login': (context) => const LoginPage(),
        '/dashboard': (context) => const DashboardPage(),
        '/zakat-setup': (context) => const ZakatSetupPage(),
        '/settings': (context) => const SettingsPage(),
        '/assets': (context) => const AssetsPage(),
        '/liabilities': (context) => const LiabilitiesPage(),
        '/zakat': (context) => const ZakatCalcPage(),
      },
    );
  }
}

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    
    if (authState.user != null) {
      return const DashboardPage();
    }
    
    return const LoginPage();
  }
}

class DashboardPlaceholder extends StatelessWidget {
  const DashboardPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: const Center(
        child: Text('Dashboard - Coming Soon'),
      ),
    );
  }
}
