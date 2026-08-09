# SHINOBIWAN LRC Maker

Interface web légère pour créer et synchroniser des fichiers **LRC** avec un fichier audio.

- Application : https://shinobione.github.io/lrc-maker/
- Dépôt : https://github.com/shinobione/lrc-maker
- Issues : https://github.com/shinobione/lrc-maker/issues
- Version du fork : **6.3.1**

## Lyrics Studio (Phase 6)

Le mode autonome reste disponible. LRC Maker expose maintenant deux consommateurs du **même moteur de synchronisation** :

1. l’application standalone historique ;
2. le bundle `build/embed/lyrics-studio.js`, monté par SHINOBIWAN Studio sous forme de Web Component `shinobiwan-lyrics-studio`.

Le mode embarqué réutilise le vrai `Synchronizer`, le vrai lecteur audio et le même pipeline de sérialisation. Il est isolé par Shadow DOM afin de ne pas injecter la feuille de style LRC Maker dans Studio. Ce n’est **pas une iframe** et ce n’est pas une réécriture du moteur.

Dans les deux modes Studio, seul le `trackId` canonique est nécessaire. Le moteur charge l’audio et `tracks/<slug>/lyrics.txt` via Track Manager, puis valide et sauvegarde exclusivement ce même `lyrics.txt` avec sa révision et son ETag.

Le texte et l’audio ne transitent jamais dans l’URL. Un export `.lrc` reste possible pour la compatibilité, mais il n’est ni obligatoire, ni une seconde source de vérité, ni un signal de Content Health.

Le mode embarqué ne propose pas de remplacement manuel de l’audio : l’audio vient du morceau canonique. Le standalone reste le fallback avancé si le bundle embarqué n’est pas disponible.

### 6.3.1 — embedded runtime hotfix

Le bundle embarqué compile désormais explicitement React en mode production pour le navigateur. Cela supprime la référence résiduelle `process.env.NODE_ENV` qui pouvait interrompre l’exécution avant l’enregistrement du Web Component. Le build exécute aussi un garde post-build qui refuse tout bundle embarqué contenant encore une référence `process.env` non résolue ou ne contenant pas l’enregistrement `customElements.define`.

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

Dans SHINOBIWAN Studio, les étapes 1 à 4 sont contextualisées automatiquement à partir du morceau sélectionné.

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

`pnpm run build` produit désormais :

- l’application Pages standalone dans `build/` ;
- le moteur embarquable stable dans `build/embed/lyrics-studio.js` ;
- un contrôle post-build qui vérifie que l’embed peut enregistrer son Web Component sans dépendance Node résiduelle.

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