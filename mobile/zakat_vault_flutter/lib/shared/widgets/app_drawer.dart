import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../features/auth/auth_notifier.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;
    final currentRoute = ModalRoute.of(context)?.settings.name;

    return Drawer(
      child: Column(
        children: [
          _buildHeader(context, user),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildNavItem(
                  context,
                  icon: LucideIcons.layoutDashboard,
                  label: 'Dashboard',
                  route: '/dashboard',
                  active: currentRoute == '/dashboard' || currentRoute == '/',
                ),
                _buildNavItem(
                  context,
                  icon: LucideIcons.coins,
                  label: 'Assets',
                  route: '/assets',
                  active: currentRoute == '/assets',
                ),
                _buildNavItem(
                  context,
                  icon: LucideIcons.fileText,
                  label: 'Liabilities',
                  route: '/liabilities',
                  active: currentRoute == '/liabilities',
                ),
                _buildNavItem(
                  context,
                  icon: LucideIcons.calculator,
                  label: 'Zakat Calculation',
                  route: '/zakat',
                  active: currentRoute == '/zakat',
                ),
                _buildNavItem(
                  context,
                  icon: LucideIcons.settings,
                  label: 'Settings',
                  route: '/settings',
                  active: currentRoute == '/settings',
                ),
              ],
            ),
          ),
          _buildFooter(context, ref, user?.email),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, dynamic user) {
    return DrawerHeader(
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withOpacity(0.05),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFFD1FAE5),
                radius: 30,
                child: const Icon(LucideIcons.userCircle, color: Color(0xFF047857), size: 36),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.fullName ?? 'User',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B), // Slate 800
                      ),
                    ),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF64748B), // Slate 500
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String route,
    required bool active,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        leading: Icon(
          icon,
          color: active ? Colors.white : const Color(0xFF64748B),
          size: 20,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: active ? FontWeight.bold : FontWeight.w500,
            color: active ? Colors.white : const Color(0xFF334155), // Slate 700
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: active ? const Color(0xFF059669) : Colors.transparent,
        onTap: () {
          if (!active) {
            Navigator.pushReplacementNamed(context, route);
          } else {
            Navigator.pop(context);
          }
        },
        selected: active,
      ),
    );
  }

  Widget _buildFooter(BuildContext context, WidgetRef ref, String? email) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        children: [
          OutlinedButton.icon(
            onPressed: () {
              // Language switch logic would go here
            },
            icon: const Icon(LucideIcons.languages, size: 18),
            label: const Text('العربية'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              foregroundColor: const Color(0xFF475569), // Slate 600
            ),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => ref.read(authNotifierProvider.notifier).logout(),
            icon: const Icon(LucideIcons.logOut, size: 18, color: Color(0xFFF43F5E)),
            label: const Text('Logout', style: TextStyle(color: Color(0xFFF43F5E))),
            style: TextButton.styleFrom(
              minimumSize: const Size(double.infinity, 48),
            ),
          ),
          const Text(
            'v1.0.0 • ZakatVault',
            style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }
}
