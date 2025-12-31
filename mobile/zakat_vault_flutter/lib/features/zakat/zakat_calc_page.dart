import 'package:flutter/material.dart';
import '../../shared/widgets/app_drawer.dart';

class ZakatCalcPage extends StatelessWidget {
  const ZakatCalcPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Zakat Calculation')),
      drawer: const AppDrawer(),
      body: const Center(child: Text('Zakat Calculation Page - Coming Soon')),
    );
  }
}
