# Module Zones — fichiers Flutter

Ces fichiers sont à copier dans le projet Flutter de l'atelier (package `agrismart`), dans son dossier `lib/` :

| Ici | Dans le projet Flutter |
|---|---|
| `lib/models/zone.dart` | `lib/models/zone.dart` |
| `lib/services/zones_service.dart` | `lib/services/zones_service.dart` |
| `lib/providers/zones_provider.dart` | `lib/providers/zones_provider.dart` |
| `lib/screens/zones_page.dart` | `lib/screens/zones_page.dart` |

## À vérifier côté Flutter

1. `pubspec.yaml` contient `http` et `provider` (`flutter pub add http provider`).
2. `ZonesProvider` est déclaré dans `main.dart` : `ChangeNotifierProvider(create: (_) => ZonesProvider())` (ou dans le `MultiProvider` existant).
3. `zones_page.dart` utilise des fichiers qui existent déjà dans le projet de l'atelier : `zone_detail_page.dart`, `zone_form_page.dart`, `fiche_exploitation.dart`, `resume_exploitation.dart`, `zone_card.dart`.
4. À la déconnexion, appeler `ZonesProvider.vider()` (sinon les zones de l'utilisateur précédent restent affichées).

## ApiClient

`zones_service.dart` utilise `ApiClient` (`lib/services/api_client.dart`, à fournir par Marwa) avec cette interface :
`get(path)`, `post(path, body)`, `put(path, body)`, `delete(path)` ; en cas d'erreur : `throw ApiException(message)`.

Pour tester avant qu'elle ne le pousse : copier `TEMP_ne_pas_commiter/lib/services/api_client.dart` dans `lib/services/` et coller un token (obtenu avec Postman) dans `ApiClient.token`.
**Ce fichier ne doit jamais être commité** (le dossier est dans `.gitignore`). Une fois le vrai `ApiClient` poussé : supprimer la copie temporaire, `git pull`, adapter les 4 appels de `zones_service.dart` si les noms de méthodes diffèrent.

## URL du serveur

- Émulateur Android : `http://10.0.2.2:3000/api`
- Téléphone réel : `http://<IP du PC>:3000/api` (même WiFi que le PC)
