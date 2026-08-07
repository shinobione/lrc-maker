# SHINOBIWAN LRC Maker

Interface web légère pour créer et synchroniser des fichiers **LRC** avec un fichier audio.

- Application : https://shinobione.github.io/lrc-maker/
- Dépôt : https://github.com/shinobione/lrc-maker
- Issues : https://github.com/shinobione/lrc-maker/issues
- Version du fork : **6.1.0**

## Philosophie du fork

Cette version conserve le moteur LRC et le workflow de synchronisation qui font la force du projet, tout en simplifiant l'interface pour l'usage SHINOBIWAN :

- édition et synchronisation LRC centrées sur les paroles ;
- sortie **lyrics-only**, sans bloc de métadonnées ni tag `[tool: ...]` injecté automatiquement ;
- suppression de l'intégration GitHub Gist de l'interface ;
- suppression du lien vers l'ancien site LRC Utils ;
- fonction **Supprimer les lignes vides** intégrée directement à l'éditeur ;
- interface disponible uniquement en **Français** et **English** ;
- interface LaunchPAD sombre, glassmorphism et responsive ;
- branding et liens projet alignés sur le dépôt `shinobione/lrc-maker`.

## Utilisation

1. Ouvre l'éditeur et colle ou importe les paroles.
2. Si nécessaire, utilise le bouton **Supprimer les lignes vides** directement dans la barre d'outils de l'éditeur.
3. Charge un fichier audio.
4. Ouvre l'outil de synchronisation.
5. Utilise `Espace` pour poser les timestamps pendant la lecture.
6. Reviens dans l'éditeur pour copier ou télécharger le fichier `.lrc`.

## Raccourcis principaux

- `Espace` : insérer le timestamp sur la ligne sélectionnée.
- `Retour arrière` / `Suppr` : supprimer le timestamp.
- `Ctrl + Entrée` / `Cmd + Entrée` : lecture / pause.
- `←` / `A` : reculer de 5 secondes.
- `→` / `D` : avancer de 5 secondes.
- `↑` / `W` / `J` : ligne précédente.
- `↓` / `S` / `K` : ligne suivante.
- `-` / `+` : ajuster le timestamp sélectionné.
- `Ctrl + ↑` / `Cmd + ↑` : accélérer la lecture.
- `Ctrl + ↓` / `Cmd + ↓` : ralentir la lecture.
- `R` : réinitialiser la vitesse.

## Build et traçabilité

La page Paramètres affiche :

- la version définie par ce fork (`package.json`) ;
- le hash court du commit réellement compilé ;
- la date du dernier commit utilisé pour le build.

Ces informations sont injectées automatiquement par Vite au moment du build afin que la version affichée corresponde au dépôt déployé.

## Développement local

```bash
git clone https://github.com/shinobione/lrc-maker.git
cd lrc-maker
npm install
npm start
```

Build de production :

```bash
npm run build
```

Le projet est distribué sous licence MIT. Voir `LICENSE` pour les mentions de copyright et de licence du projet d'origine.
