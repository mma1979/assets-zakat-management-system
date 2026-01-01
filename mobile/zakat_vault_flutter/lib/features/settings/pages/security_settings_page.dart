import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../auth/auth_notifier.dart';
import '../../../services/auth_service.dart';
import '../widgets/two_factor_setup_dialog.dart';

class SecuritySettingsPage extends ConsumerStatefulWidget {
  const SecuritySettingsPage({super.key});

  @override
  ConsumerState<SecuritySettingsPage> createState() => _SecuritySettingsPageState();
}

class _SecuritySettingsPageState extends ConsumerState<SecuritySettingsPage> {
  bool _isLoading = false;

  Future<void> _handleToggle2Fa(bool currentEnabled) async {
    if (currentEnabled) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Disable 2FA?'),
          content: const Text('This will make your account less secure. Are you sure?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Disable', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      );

      if (confirm == true) {
        setState(() => _isLoading = true);
        final authService = ref.read(authServiceProvider);
        final (success, error) = await authService.disable2Fa();
        if (mounted) {
          setState(() => _isLoading = false);
          if (success) {
            ref.refresh(authNotifierProvider); // Refresh to get updated user state
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('2FA disabled successfully'), backgroundColor: Colors.amber),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(error ?? 'Failed to disable 2FA'), backgroundColor: Colors.red),
            );
          }
        }
      }
    } else {
      setState(() => _isLoading = true);
      final authService = ref.read(authServiceProvider);
      final (setupData, error) = await authService.setup2Fa();
      
      if (mounted) {
        setState(() => _isLoading = false);
        if (setupData != null) {
          showDialog(
            context: context,
            builder: (context) => TwoFactorSetupDialog(
              setupData: setupData,
              onComplete: (success) {
                if (success) {
                  ref.refresh(authNotifierProvider);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('2FA enabled successfully'), backgroundColor: Color(0xFF10B981)),
                  );
                }
              },
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error ?? 'Failed to start 2FA setup'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;
    final bool isEnabled = user?.isTwoFactorEnabled ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Security Settings'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'TWO-FACTOR AUTHENTICATION',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF94A3B8),
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(LucideIcons.smartphone, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Authenticator App',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              'Use an app like Google Authenticator',
                              style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isEnabled ? 'Status: ENABLED' : 'Status: DISABLED',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isEnabled ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                        ),
                      ),
                      Switch(
                        value: isEnabled,
                        onChanged: _isLoading ? null : (val) => _handleToggle2Fa(isEnabled),
                        activeColor: const Color(0xFF10B981),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4), // Emerald 50
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFDCFCE7)), // Emerald 100
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.shieldCheck, color: Color(0xFF10B981), size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '2FA adds an extra layer of security. Even if someone knows your password, they can\'t access your account without your phone.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF166534)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
