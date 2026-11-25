import 'package:agrismart/models/zone.dart';
import 'package:agrismart/services/api_client.dart';

// Appels HTTP du module Zones. Passe par l'ApiClient partagé (Marwa),
// qui ajoute l'URL de base et l'en-tête Authorization: Bearer <token>.
class ZonesService {
  final ApiClient _api;

  ZonesService({ApiClient? api}) : _api = api ?? ApiClient();

  Future<List<Zone>> lister() async {
    final data = await _api.get('/zones') as List<dynamic>;
    return data.map((j) => Zone.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<Zone> creer(Zone zone) async {
    final data = await _api.post('/zones', zone.toJson());
    return Zone.fromJson(data as Map<String, dynamic>);
  }

  Future<Zone> modifier(int id, Zone zone) async {
    final data = await _api.put('/zones/$id', zone.toJson());
    return Zone.fromJson(data as Map<String, dynamic>);
  }

  Future<void> supprimer(int id) async {
    await _api.delete('/zones/$id');
  }
}
