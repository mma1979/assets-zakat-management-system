import 'package:flutter/material.dart';
import '../../shared/widgets/app_drawer.dart';

class AssetsPage extends StatelessWidget {
  const AssetsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assets')),
      drawer: const AppDrawer(),
      body: const Center(child: Text('Assets Page - Coming Soon')),
    );
  }
}
