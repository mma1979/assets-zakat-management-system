import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'features/auth/login_page.dart';
import 'features/auth/auth_notifier.dart';

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
        '/dashboard': (context) => const DashboardPlaceholder(),
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
      return const DashboardPlaceholder();
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
