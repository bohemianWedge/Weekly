# BRIEF — Application de gestion d'emploi du temps personnel

## Contexte

Application web React **single-page**, sans backend, persistance via `localStorage`.
Approche **éditoriale / lecture confortable** (pas une grille calendrier dense type Google Agenda).
L'utilisateur se concentre sur **une journée à la fois**.

## Stack technique

- **Framework** : React 18 (Vite)
- **Langage** : JavaScript (pas de TypeScript pour aller vite, à migrer plus tard si besoin)
- **Styling** : Tailwind CSS + CSS custom pour la typo
- **Persistance** : `localStorage` uniquement (clé `edt_data_v1`)
- **Pas de** : backend, auth, router (single page suffit)
- **Polices** : Fraunces (Google Fonts) + Inter (Google Fonts)

## Architecture des fichiers (suggérée)

```
src/
  App.jsx                      # composant racine
  components/
    Sidebar.jsx                # liste des 7 jours + stats semaine
    DayView.jsx                # vue principale "article"
    SlotCard.jsx               # carte créneau
    SlotModal.jsx              # modal création/édition
    SettingsModal.jsx          # personnalisation couleurs catégories
    WeekNavigator.jsx          # navigation entre semaines
  lib/
    dateHelpers.js             # getMonday, weekKey, addDays, formatters
    storage.js                 # load/save localStorage
    slotEngine.js              # getSlotsForWeek, matchesRecurrence, conflits
  constants.js                 # catégories par défaut, jours FR, mois FR
  styles.css                   # imports polices + variables CSS
```

## Modèle de données

```js
// localStorage key: "edt_data_v1"
{
  slots: [
    {
      id: "s_xxx",
      title: "Stage Geolotus",
      categoryId: "stage",
      dayIndex: 0,                    // 0 = lundi, 6 = dimanche
      startTime: "08:00",             // format HH:MM
      endTime: "13:00",
      recurrence: "weekdays",         // "once" | "weekly" | "weekdays" | "weekend" | "daily"
      notes: "",
      weekKey: "2026-04-27"           // SEULEMENT si recurrence === "once"
    }
  ],
  exceptions: {
    // Pour les créneaux récurrents : overrides ou suppressions par semaine
    "s_xxx": {
      "2026-04-27": {
        deleted: true                 // créneau récurrent supprimé cette semaine-là
      },
      "2026-05-04": {
        override: {                   // créneau récurrent modifié cette semaine-là
          startTime: "09:00",
          endTime: "14:00",
          title: "Stage (réunion exceptionnelle)",
          notes: "...",
          categoryId: "stage"
        }
      }
    }
  },
  categories: [
    { id: "stage", label: "Stage / Travail", color: "#2d5016" },
    { id: "etudes", label: "Études", color: "#8b4513" },
    { id: "sport", label: "Sport", color: "#c0392b" },
    { id: "perso", label: "Personnel", color: "#6c5ce7" },
    { id: "asso", label: "Associatif", color: "#d4a017" },
    { id: "tache", label: "Tâche", color: "#34495e" }
  ]
}
```

### Règle clé : génération des créneaux d'une semaine

Une fonction `getSlotsForWeek(slots, exceptions, weekKey)` retourne la liste des créneaux à afficher pour une semaine donnée :

1. Pour chaque slot avec `recurrence === "once"` : inclus si `slot.weekKey === weekKey`
2. Pour chaque slot avec récurrence (`weekly`, `weekdays`, `weekend`, `daily`) :
   - Génère une instance pour chaque `dayIndex` correspondant à la récurrence
   - Si `exceptions[slot.id][weekKey].deleted === true` → skip
   - Si `exceptions[slot.id][weekKey].override` existe → applique l'override sur l'instance

## Fonctionnalités

### MVP (à livrer)

1. **Sidebar latérale (liste des 7 jours)**
   - Pour chaque jour : nom (Fraunces), date courte, nombre de créneaux, durée totale
   - Jour sélectionné : fond sombre `#1a1a1a`, texte crème
   - En bas : récap semaine
     - Durée totale planifiée
     - Barres de progression par catégorie (uniquement les catégories utilisées cette semaine)
   - Header : navigation entre semaines (← Semaine précédente | Semaine du XX | Semaine suivante →)
   - Bouton "Aujourd'hui" pour revenir à la semaine actuelle

2. **Vue principale (journée)**
   - Grand titre en Fraunces : nom du jour
   - Date complète sous le titre (ex: "27 avril 2026")
   - Sous-titre stats : "X créneaux · Yh total"
   - Liste de cartes-créneaux empilées par ordre chronologique
   - Bouton "+ Ajouter" en haut à droite

3. **Carte créneau**
   - Layout 2 colonnes : gauche = horaire, droite = contenu
   - **Gauche** : heure début (gros), heure fin (gris), badge durée (ex: "2h30")
   - **Droite** :
     - Point coloré (catégorie) + label en MAJUSCULES + petite icône ↻ si récurrent
     - Titre du créneau (gros, Fraunces)
     - Notes éventuelles (Inter, gris)
   - Au survol : bordure légèrement plus marquée, curseur pointer
   - Au clic : ouvre la modal d'édition
   - **Conflit horaire** : bordure gauche rouge épaisse `border-l-4 border-red-500` + petit badge ⚠ "Conflit"

4. **Modal création/édition**
   - Champs :
     - Titre (input text, requis)
     - Catégorie (select avec point coloré)
     - Jour (select Lun-Dim)
     - Heure début / heure fin (input type="time")
     - Récurrence (radio) : "Une fois" | "Lun-Ven" | "Week-end" | "Quotidien" | "Toutes les semaines (ce jour)"
     - Notes (textarea, optionnel)
   - Validation : titre non-vide, endTime > startTime
   - Si édition d'un créneau récurrent → demander à la sauvegarde :
     - "Modifier cette occurrence uniquement" → ajoute à `exceptions[id][weekKey].override`
     - "Modifier toutes les occurrences" → modifie le slot en base
   - Bouton "Supprimer" (rouge, en bas à gauche) :
     - Si créneau ponctuel → suppression directe
     - Si créneau récurrent → demander "Cette occurrence" / "Toutes les occurrences"
   - Bouton "Annuler" / "Enregistrer"

5. **Gestion des conflits**
   - Autoriser la création même en cas de chevauchement
   - Détecter les chevauchements dans la vue jour (deux créneaux qui se chevauchent dans le temps)
   - Marquer visuellement (bordure gauche rouge + badge ⚠)

6. **Multi-semaines (Option A : semaine type + exceptions)**
   - Navigation ← / → entre semaines
   - Les créneaux récurrents s'affichent sur toutes les semaines automatiquement
   - Les créneaux ponctuels sont attachés à une semaine précise (`weekKey`)
   - Modification d'un récurrent : choix "cette semaine" vs "toutes"

7. **Personnalisation couleurs catégories**
   - Bouton "Paramètres" (icône engrenage discret en haut à droite)
   - Modal listant les 6 catégories avec un color picker pour chacune
   - Sauvegarde immédiate dans `localStorage`

8. **Raccourcis clavier**
   - `←` / `→` : naviguer entre les jours de la semaine courante
   - `Shift + ←` / `Shift + →` : naviguer entre les semaines
   - `N` : ouvrir le modal de création
   - `Échap` : fermer le modal
   - `T` : revenir à aujourd'hui

9. **Persistance localStorage**
   - Sauvegarde automatique à chaque modification
   - Chargement au mount

### Hors-scope (V2, ne pas implémenter pour l'instant)

- Drag & drop des créneaux
- Vue mois / vue année
- Synchronisation cloud (Supabase)
- Export iCal / Google Calendar
- Notifications / rappels
- Sous-tâches dans un créneau
- Multi-utilisateurs

## Direction visuelle

### Palette
```css
:root {
  --bg: #f7f4ed;              /* fond crème */
  --bg-elevated: #ffffff;     /* cartes blanches */
  --bg-dark: #1a1a1a;         /* sidebar jour sélectionné */
  --text: #1a1a1a;            /* texte principal */
  --text-muted: #6b6b6b;      /* texte secondaire */
  --text-faint: #a0a0a0;      /* labels, métadonnées */
  --border: #e5e0d5;          /* bordures fines */
  --border-strong: #1a1a1a;   /* bordures accentuées */
  --conflict: #c0392b;        /* rouge conflit */
}
```

### Typographie
- **Fraunces** (sérif élégante) : titres, noms de jours, titres de créneaux
  - Import : `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&display=swap`
  - Activer la variation optique (`opsz`) — c'est ce qui rend Fraunces unique
- **Inter** (sans-serif) : texte fonctionnel, chiffres, UI
- **Hiérarchie** :
  - Nom du jour (vue principale) : Fraunces 64px, weight 400
  - Titre créneau : Fraunces 22px, weight 500
  - Heure début (carte) : Inter 28px, weight 600, tabular-nums
  - Labels catégorie : Inter 11px, uppercase, letter-spacing 0.1em

### Composants UI
- **Boutons primaires** : noir plein `bg-[#1a1a1a]` text crème, arrondis pill `rounded-full`, padding généreux
- **Boutons secondaires** : transparent, bordure fine
- **Cartes** : fond blanc, bordure `1px solid var(--border)`, `rounded-lg`, padding 24-32px
- **Hover** : `transition-all 200ms`, légère élévation ou bordure plus sombre (PAS de scale)
- **Inputs** : pas de border-radius excessif, bordure fine, focus = bordure noire

### Spacing
- Layout très aéré, beaucoup de blanc
- Sidebar : 320px de large, padding 32px
- Vue principale : padding 64px horizontal, max-width 720px (lecture confortable)

### À éviter absolument
- Icônes superflues (lucide-react à utiliser avec parcimonie : engrenage, ←/→, +, ✕, ↻ pour récurrence, ⚠ pour conflit, c'est tout)
- Ombres lourdes / glassmorphism / gradients
- Animations excessives (transitions 200ms max, juste pour le hover et le modal)
- Couleurs vives en dehors des points de catégorie

## Plan d'exécution suggéré

1. **Setup** : `npm create vite@latest edt -- --template react`, install Tailwind, configure les fonts dans `index.html`
2. **Structure de données + helpers** : `dateHelpers.js`, `slotEngine.js`, `storage.js` avec tests manuels en console
3. **Layout statique** : Sidebar + DayView avec données mockées en dur, focus sur la typo et le spacing
4. **SlotCard** : composant pixel-perfect avec une vraie attention au détail typographique
5. **Modal création/édition** : avec validation et gestion récurrence
6. **Branchement persistance** : remplacer les données mockées par `localStorage`
7. **Multi-semaines** : `WeekNavigator` + logique d'exceptions
8. **Détection conflits** : algo simple de chevauchement + affichage visuel
9. **Raccourcis clavier** : hook `useKeyboardShortcuts`
10. **Settings** : modal de personnalisation des couleurs
11. **Polish final** : transitions, états vides ("aucun créneau ce jour"), responsive (au moins ne pas casser sur 1280px)

## Critères d'acceptation

- [ ] Je peux créer un créneau "Stage Geolotus" récurrent Lun-Ven 8h-13h, je le vois sur les 5 jours
- [ ] Je navigue à la semaine prochaine, le créneau apparaît aussi
- [ ] Je modifie le créneau de cette semaine seulement (override) → la semaine d'après est inchangée
- [ ] Je crée un cours ponctuel mardi 14h-16h, je vois "Conflit" si ça chevauche un autre créneau
- [ ] Je ferme l'app, je rouvre → tout est là
- [ ] Je change la couleur de la catégorie "Sport" dans Settings → les points et les barres de progression sont mis à jour partout
- [ ] Les raccourcis clavier fonctionnent
- [ ] Le rendu est fidèle à la direction éditoriale (Fraunces qui chante, beaucoup d'espace, pas de bling)

## Notes pour Claude Code

- Privilégier la **simplicité maximale** : pas de state management externe (Zustand/Redux), `useState` + `useMemo` suffisent largement
- Pas de tests automatisés pour le MVP (test manuel via la checklist d'acceptation)
- Bien commenter `slotEngine.js` car c'est la logique centrale
- Utiliser `tabular-nums` partout où il y a des chiffres (heures, durées) pour un alignement propre
- Le composant racine `App.jsx` peut centraliser tout l'état (slots, exceptions, categories, currentWeek, selectedDay), pas besoin de Context
